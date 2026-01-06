//@ts-nocheck
import { APIError, CollectionConfig } from 'payload'
import { Match } from './Matches'

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
        const set = await req.payload.findByID({
          collection: 'sets',
          id: data.set,
        })

        if (set.match.winner) {
          throw new APIError('Match Already Completed', 400, undefined, true)
        }

        if (set.winner) {
          throw new APIError('Set Already Completed', 400, undefined, true)
        }
        //check if deuce occurs

        const MaxScore = set.match.event.maxScore
        const isDeuce =
          player1Score >= maxScore - 1 &&
          player2Score >= maxScore - 1 &&
          player1Score === player2Score
        //if deuce
        if (isDeuce) {
          return data
        }

        //if not deuce
        return data
      },
    ],

    afterChange: [],
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
      index: true,
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
