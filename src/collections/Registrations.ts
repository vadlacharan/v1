import { CollectionConfig } from 'payload'

export const Registration: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'playerEmail',
    listSearchableFields: ['event.title', 'player.email'],
  },
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'player',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'playerEmail',
      type: 'email',
      virtual: 'player.email',
    },
  ],

  indexes: [
    {
      fields: ['event', 'player'],
      unique: true,
    },
  ],
}
