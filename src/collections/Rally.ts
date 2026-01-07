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
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const payload = req.payload
        const { set: setId, rallyWinner } = data

        if (!setId || !rallyWinner) {
          throw new APIError('Set and Rally Winner are required', 400)
        }

        /* -------------------------------------------------- */
        /* Fetch Set → Match → Event                          */
        /* -------------------------------------------------- */
        const setDoc = await payload.findByID({
          collection: 'sets',
          id: setId,
          depth: 3,
        })

        if (setDoc.isCompleted) {
          throw new APIError('Set already completed', 400)
        }

        const match = setDoc.match
        if (match.isCompleted) {
          throw new APIError('Match already completed', 400)
        }

        const event = match.event
        const maxScore = event.maxScore || 21

        /* -------------------------------------------------- */
        /* Update Scores                                      */
        /* -------------------------------------------------- */
        let p1Score = setDoc.player1Score
        let p2Score = setDoc.player2Score

        if (match.player1?.id === rallyWinner) {
          p1Score += 1
        } else if (match.player2?.id === rallyWinner) {
          p2Score += 1
        } else {
          throw new APIError('Invalid rally winner', 400)
        }

        /* -------------------------------------------------- */
        /* Deuce + Set Winner Logic                           */
        /* -------------------------------------------------- */
        let setWinner = null
        const lead = Math.abs(p1Score - p2Score)

        if ((p1Score >= maxScore || p2Score >= maxScore) && lead >= 2) {
          setWinner = p1Score > p2Score ? setDoc.player1.id : setDoc.player2.id
        }

        /* -------------------------------------------------- */
        /* Update Set                                         */
        /* -------------------------------------------------- */
        await payload.update({
          collection: 'sets',
          id: setId,
          data: {
            player1Score: p1Score,
            player2Score: p2Score,
            isCompleted: !!setWinner,
            winner: setWinner,
          },
        })

        /* -------------------------------------------------- */
        /* Handle Match Completion                            */
        /* -------------------------------------------------- */
        if (setWinner) {
          const allSets = await payload.find({
            collection: 'sets',
            where: {
              match: { equals: match.id },
              winner: { exists: true },
            },
            limit: 20,
          })

          let p1Wins = 0
          let p2Wins = 0

          allSets.docs.forEach((s) => {
            if (s.winner === match.player1?.id) p1Wins++
            if (s.winner === match.player2?.id) p2Wins++
          })

          const setsToWin = Math.ceil(event.numberOfSets / 2)
          let matchWinner = null

          if (p1Wins >= setsToWin) matchWinner = match.player1.id
          if (p2Wins >= setsToWin) matchWinner = match.player2.id

          if (matchWinner) {
            /* ---------------------------------------------- */
            /* Update Match                                   */
            /* ---------------------------------------------- */
            await payload.update({
              collection: 'matches',
              id: match.id,
              data: {
                isCompleted: true,
                winner: matchWinner,
              },
            })

            /* ---------------------------------------------- */
            /* Advance Winner (BYE-safe)                      */
            /* ---------------------------------------------- */
            if (match.winnerRound && match.winnerMatch) {
              const nextMatchRes = await payload.find({
                collection: 'matches',
                where: {
                  round: { equals: match.winnerRound },
                  match: { equals: match.winnerMatch },
                  event: { equals: event.id },
                },
                limit: 1,
              })

              const nextMatch = nextMatchRes.docs?.[0]
              if (nextMatch) {
                const updateData: any = {}

                if (!nextMatch.player1) updateData.player1 = matchWinner
                else if (!nextMatch.player2) updateData.player2 = matchWinner

                await payload.update({
                  collection: 'matches',
                  id: nextMatch.id,
                  data: updateData,
                })
              }
            }
          }
        }

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
