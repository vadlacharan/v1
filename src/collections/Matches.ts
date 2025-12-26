import { CollectionConfig } from 'payload'

export const Match: CollectionConfig = {
  slug: 'matches',
  admin: {
    defaultColumns: ['player1Name', 'player2Name', 'Event', 'matchDate', 'court'],
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
  fields: [
    {
      name: 'player1',
      type: 'relationship',
      relationTo: 'registrations',
    },

    {
      name: 'player2',
      type: 'relationship',
      relationTo: 'registrations',
    },
    {
      name: 'umpire',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'player1Name',
      type: 'text',
      virtual: 'player1.player.email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'player2Name',
      type: 'text',
      virtual: 'player2.player.email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'Event',
      type: 'text',
      virtual: 'player1.event.title',
      admin: {
        readOnly: true,
      },
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
  ],
}
