//@ts-nocheck
import { APIError, CollectionConfig } from 'payload'

export const Rally: CollectionConfig = {
  slug: 'rally',
  hooks: {
    beforeChange: [
      //fetching the set with all the details
      async ({ data, req }) => {
        const set = await req.payload.findByID({
          collection: 'sets',
          id: data.set,
          depth: 4,
        })

        //@ts-ignore
        // if (set.match.umpire.id != req.user?.id) {
        //   throw new APIError('You are not an Umpire for this Match', 403, undefined, true)
        // }

        const player1Score = set.player1Score
        const player2Score = set.player2Score

        try {
          //fetching the game point of the set

          const maxScore = set.match.player1.event.maxScore
          console.log('maxscore ', maxScore)
          //validating whether any player won the set
          const hasPlayerWonSet =
            (player1Score >= maxScore - 1 || player2Score >= maxScore - 1) &&
            Math.abs(player1Score - player2Score) >= 2

          if (!hasPlayerWonSet) return data

          const player1Id = set.match.player1
          const player2Id = set.match.player2
          let WinnerRegistrationId = 0
          if (player1Score > player1Score) {
            WinnerRegistrationId = player1Id
          } else {
            WinnerRegistrationId = player1Id
          }
          try {
            await req.payload.update({
              collection: 'sets',
              id: set.id,
              data: {
                winner: WinnerRegistrationId,
              },
            })
          } catch (error) {
            throw error
          }
        } catch (err) {
          throw new APIError('Unable to Perform this Operation', 400, undefined, true)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        const set = await req.payload.findByID({
          collection: 'sets',
          id: doc.set,
        })

        if (doc.rallyWinner == set.player1.id) {
          await req.payload.update({
            collection: 'sets',
            id: doc.set,
            data: {
              player1Score: set.player1Score + 1,
            },
          })
        } else {
          await req.payload.update({
            collection: 'sets',
            id: doc.set,
            data: {
              player2Score: set.player2Score + 1,
            },
          })
        }
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
