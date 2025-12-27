//@ts-nocheck
// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { SingleElimination, RoundRobin } from 'tournament-pairings'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tournament } from './collections/Tournaments'
import { Event } from './collections/Events'
import { Registration } from './collections/Registrations'
import { Match } from './collections/Matches'
import { Set } from './collections/Sets'
import { Rally } from './collections/Rally'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { generateSlotsWithCourts } from './utlis'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: 'https://smashlive-omega.vercel.app',
  cors: ['http://localhost:8080', 'http://localhost'],
  csrf: ['http://localhost:8080', 'http://localhost'],

  admin: {
    user: Users.slug,
    meta: {
      title: 'Smash Live',
      titleSuffix: 'Smash Live',
    },
    components: {},
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  email: nodemailerAdapter({
    defaultFromAddress: 'charanvadla27@gmail.com',
    defaultFromName: 'Charan Vadla',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  collections: [Users, Media, Tournament, Event, Registration, Match, Set, Rally],
  jobs: {
    autoRun: [
      //scheduled job that runs every second
      {
        cron: '* * * * *',
        queue: 'generateMatches',
      },
    ],
    tasks: [
      {
        slug: 'generateMatches',
        retries: 0,
        inputSchema: [
          {
            name: 'event',
            type: 'number',
            required: true,
          },
        ],

        handler: async ({ input, req }) => {
          //fetching the event using evenid
          const event = await req.payload.findByID({
            collection: 'events',
            id: input.event,
          })

          //generates slosts using available courts and time stamps
          const slotCourtPairs = generateSlotsWithCourts(event)

          //fetching the event registrations from registrations collection
          const registrations = await req.payload.find({
            collection: 'registrations',
            where: {
              event: { equals: input.event },
            },
            limit: 999,
          })

          const registeredIds = registrations.docs.map((r) => r.id)

          let Matches: number[] = []

          if (event['Pairing Type'] === 'round-robin') {
            //@ts-ignore
            Matches = RoundRobin(registeredIds)
          } else if (event['Pairing Type'] === 'single-elimination') {
            //@ts-ignore
            Matches = SingleElimination(registeredIds)
          }

          if (!Matches.length || !slotCourtPairs.length) {
            return { output: { registrations } }
          }

          // 🧠 One-to-one mapping: match → (timeSlot + court)
          const sortedMatches = Matches.sort(
            (match1, match2) => match1.round - match2.round || match1.match - match2.match,
          )
          console.log('sortedMatches', sortedMatches)
          console.log('slotCourtPairs', slotCourtPairs)
          const total = Math.min(Matches.length, slotCourtPairs.length)
          const createdMatches: String[] = []
          for (let i = 0; i < total; i++) {
            const match = sortedMatches[i]
            const slot = slotCourtPairs[i]

            const CreatedMatch = await req.payload.create({
              collection: 'matches',
              data: {
                //@ts-ignore
                player1: match.player1 ?? undefined,
                //@ts-ignore
                player2: match.player2 ?? undefined,
                //@ts-ignore
                matchDate: slot.timeSlot,
                court: slot.court, // ✅ ALWAYS SET
                round: match.round,
                match: match.match,
                winnerRound: match?.win?.round || 0,
                winnerMatch: match?.win?.match || 0,
              },
            })
            //@ts-ignore
            createdMatches.push(CreatedMatch.id)
          }

          const numberOfSets = event.numberOfSets
          for (const matchId of createdMatches) {
            for (let setNumber = 1; setNumber <= numberOfSets; setNumber++) {
              await req.payload.create({
                collection: 'sets',
                data: {
                  match: matchId,
                  set: setNumber,
                  player1Score: 0,
                  player2Score: 0,
                  winner: undefined,
                },
              })
            }
          }

          if (Matches.length > slotCourtPairs.length) {
            console.warn('⚠️ Not enough slots/courts to schedule all matches')
          }

          //checking the areMatchesGenerated field after generating the Matches
          await req.payload.update({
            collection: 'events',
            id: event.id,
            data: {
              areMatchesGenerated: true,
            },
          })

          return {
            output: { registrations },
          }
        },
      },
    ],
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ssl: { rejectUnauthorized: false },
    },
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
})
