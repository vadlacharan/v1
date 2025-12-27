//@ts-nocheck
import { APIError, CollectionConfig } from 'payload'

export const Rally: CollectionConfig = {
  slug: 'rally',
  hooks: {
    beforeChange: [
      /**
       * This hook runs BEFORE a Rally is created.
       * Responsibility:
       * 1. Check if the current Set already has a winner
       * 2. Check if the Match already has a winner
       * 3. If this rally causes a Set win → update Set winner
       * 4. If enough Sets are won → update Match winner
       */
      async ({ data, req }) => {
        // --------------------------------------------
        // 1️⃣ Fetch the Set with full Match + Event data
        // --------------------------------------------
        const set = await req.payload.findByID({
          collection: 'sets',
          id: data.set,
          depth: 4,
        })

        req.payload.logger.trace(set, 'setdetails')

        // --------------------------------------------
        // 2️⃣ Guard checks (IMPORTANT)
        // --------------------------------------------

        // If the set already has a winner → stop
        if (set.winner) {
          throw new APIError('Set already has a winner', 400, undefined, true)
        }

        // If the match already has a winner → stop
        if (set.match.winner) {
          throw new APIError('Match already has a winner', 400, undefined, true)
        }

        // --------------------------------------------
        // 3️⃣ Read current scores & rules
        // --------------------------------------------
        const player1Score = set.player1Score
        const player2Score = set.player2Score

        const maxScore = set.match.player1.event.maxScore

        /**
         * Badminton rule:
         * - At least maxScore - 1 (e.g. 20 if maxScore is 21)
         * - AND lead by 2 points
         */
        const hasPlayerWonSet =
          (player1Score >= maxScore - 1 || player2Score >= maxScore - 1) &&
          Math.abs(player1Score - player2Score) >= 2

        // If no one has won yet → allow rally creation
        if (!hasPlayerWonSet) {
          return data
        }

        // --------------------------------------------
        // 4️⃣ Decide Set Winner
        // --------------------------------------------
        const player1RegistrationId = set.match.player1.id
        const player2RegistrationId = set.match.player2.id

        const setWinnerId =
          player1Score > player2Score ? player1RegistrationId : player2RegistrationId

        // --------------------------------------------
        // 5️⃣ Update the Set as completed
        // --------------------------------------------
        await req.payload.update({
          collection: 'sets',
          id: set.id,
          data: {
            winner: setWinnerId,
            isCompleted: true,
            incomplete: false,
          },
        })

        // --------------------------------------------
        // 6️⃣ Check if the Match is won
        // --------------------------------------------

        // Fetch all sets for this match
        const setsForThisMatch = await req.payload.find({
          collection: 'sets',
          where: {
            match: {
              equals: set.match.id,
            },
          },
        })

        console.log('setsForThisMatch', setsForThisMatch)
        const totalSets = set.match.player1.event.numberOfSets
        const setsRequiredToWin = Math.ceil(totalSets / 2)

        // Only completed sets count
        const completedSets = setsForThisMatch.docs.filter((s) => s.winner !== null)

        const setsWonByPlayer1 = completedSets.filter(
          (s) => s.winner.id === player1RegistrationId,
        ).length

        const setsWonByPlayer2 = completedSets.filter(
          (s) => s.winner.id === player2RegistrationId,
        ).length
        console.log('setsWonByPlayer1', setsWonByPlayer1)
        console.log('setsWonByPlayer2', setsWonByPlayer2)
        // --------------------------------------------
        // 7️⃣ Declare Match Winner if condition met
        // --------------------------------------------
        if (setsWonByPlayer1 >= setsRequiredToWin || setsWonByPlayer2 >= setsRequiredToWin) {
          const matchWinnerId =
            setsWonByPlayer1 >= setsRequiredToWin ? player1RegistrationId : player2RegistrationId

          await req.payload.update({
            collection: 'matches',
            id: set.match.id,
            data: {
              winner: matchWinnerId,
              isCompleted: true,
            },
          })
        }

        // --------------------------------------------
        // 8️⃣ Allow Rally creation to continue
        // --------------------------------------------
        return data
      },
    ],

    afterChange: [
      async ({ doc, req, data, previousDoc }) => {
        const set = await req.payload.findByID({
          collection: 'sets',
          id: data.set,
        })
        console.log('player1', set.match.player1)
        console.log('rallwyinner', data.rallyWinner)
        console.log('setid', data.set)
        if (data.rallyWinner == set.match.player1.player) {
          await req.payload.db.updateOne({
            collection: 'sets',
            id: data.set,
            data: {
              player1Score: set.player1Score + 1,
            },
          })
        } else {
          await req.payload.db.updateOne({
            collection: 'sets',
            id: data.set,
            data: {
              player2Score: set.player2Score + 1,
            },
          })
        }
        return doc
      },
    ],
  },
  access: {
    create: ({ req }) => {
      if (!req.user) {
        return false
      }

      return true
    },
  },
  fields: [
    {
      name: 'set',
      type: 'relationship',
      relationTo: 'sets',
    },
    {
      name: 'rallyNumber',
      type: 'number',
      min: 0,
    },
    {
      name: 'currentServer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'nextServer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'rallyWinner',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
