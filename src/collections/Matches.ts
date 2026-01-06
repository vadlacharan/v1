import { CollectionConfig } from 'payload'

export const Match: CollectionConfig = {
  slug: 'matches',
  admin: {
    defaultColumns: ['player1', 'player2', 'event', 'matchDate', 'court'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'player') {
        return true
      } else if (user?.role === 'umpire') {
        return {
          umpire: {
            equals: user.id,
          },
        }
      }
      return true
    },
  },
  defaultSort: 'id',
  fields: [
    {
      name: 'player1',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },

    {
      name: 'player2',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'umpire',
      type: 'relationship',
      relationTo: 'users',
    },

    {
      name: 'winner',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'matchDate',
      type: 'date',
    },
    {
      name: 'court',
      type: 'text',
    },
    {
      name: 'isCompleted',
      label: 'Match Completed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'inProgress',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'round',
      type: 'number',
    },
    {
      name: 'match',
      type: 'number',
    },
    {
      name: 'winnerRound',
      type: 'number',
    },
    {
      name: 'winnerMatch',
      type: 'number',
    },
  ],
}
