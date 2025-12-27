import { CollectionConfig } from 'payload'

export const Set: CollectionConfig = {
  slug: 'sets',
  admin: {
    defaultColumns: [
      'match',
      'set',
      'player1',
      'player1Score',
      'player2',
      'player2Score',
      'winner',
    ],
  },
  fields: [
    {
      name: 'match',
      type: 'relationship',
      relationTo: 'matches',
    },
    {
      name: 'set',
      type: 'number',
      required: true,
    },
    {
      name: 'winner',
      type: 'relationship',
      relationTo: 'registrations',
    },
    {
      name: 'player1Score',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'player2Score',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'player1',
      type: 'text',
      virtual: 'match.player1.player.fullname',
    },
    {
      name: 'player2',
      type: 'text',
      virtual: 'match.player2.player.fullname',
    },
    {
      name: 'isCompleted',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'tournamentTitle',
      type: 'text',
      virtual: 'match.player2.event.tournament.title',
    },
    {
      name: 'inProgress',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
