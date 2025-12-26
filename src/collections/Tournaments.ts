import { APIError, CollectionConfig } from 'payload'

export const Tournament: CollectionConfig = {
  slug: 'tournaments',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeChange: [
      async ({ req, data }) => {
        if (!req || !req.user || !data || req.user.role != 'organiser') {
          throw new APIError('unauthorised! You are not an organiser ', 403, undefined, true)
        }
        data.organiser = req.user.id
      },
    ],
    afterChange: [
      async ({ req, doc }) => {
        if (!req || !doc) {
          return false
        }

        const organiser = await req.payload.findByID({
          collection: 'users',
          id: doc.organiser,
        })

        const email = await req.payload.sendEmail({
          to: 'charanvadla27@gmail.com',
          subject: 'Updated or Created Tournament',
          text: `Dear ${organiser.fullname},
           You have created new Tournament: ${doc.title}`,
        })
      },
    ],
  },
  access: {
    // acces for creating user
    create: async ({ req: { user } }) => {
      //unauthenticated users cannot create tournament
      if (!user) {
        return false
      }
      //allowing only organisers to create a tournament
      if (user.role === 'organiser') {
        return true
      }

      return false
    },

    read: async ({ req: { user } }) => {
      //unauthenticated users cannot read tournaments
      if (!user) {
        return false
      }

      //organisers can only see the tournaments created by them
      if (user.role == 'organiser') {
        return {
          organiser: {
            equals: user.id,
          },
        }
      }
      //all the authenticated players can read the tournament
      return true
    },

    update: async ({ req, id }) => {
      if (!id) {
        return true
      }
      const tempTournament = await req.payload.findByID({
        collection: 'tournaments',
        id,
        depth: 0,
      })

      return tempTournament.organiser == req.user?.id
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      unique: true,
    },
    {
      name: 'organiser',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: async ({ req }) => {
        if (!req.user) {
          return false
        }

        return {
          id: {
            equals: req.user.id,
          },
        }
      },
    },
    {
      name: 'venue',
      type: 'textarea',
    },
  ],
}
