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
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'match',
      type: 'relationship',
      relationTo: 'matches',
      index: true,
    },
    {
      name: 'set',
      type: 'number',
      required: true,
    },
    {
      name: 'winner',
      type: 'relationship',
      relationTo: 'users',
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
      name: 'isCompleted',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'inProgress',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
