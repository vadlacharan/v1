import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        {
          value: 'player',
          label: 'Player',
        },
        {
          value: 'organiser',
          label: 'Organiser',
        },
        {
          value: 'umpire',
          label: 'Umpire',
        },
      ],
    },
    {
      name: 'fullname',
      label: 'Full name',
      type: 'text',
      required: true,
    },
  ],
}
