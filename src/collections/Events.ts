import { CollectionConfig, jobAfterRead } from 'payload'

export const Event: CollectionConfig = {
  slug: 'events',
  admin: {
    defaultColumns: ['id', 'title', 'tournament', 'areMatchesGenerated'],
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        console.log(doc)
      },
    ],
  },
  endpoints: [
    //custom endpoint for auto generating matches based on registrations
    {
      path: '/:id/generate-matches',
      method: 'post',
      handler: async (req) => {
        const eventId = await req.routeParams?.id

        //fetching the event using eventId from path params
        const event = await req.payload.findByID({
          collection: 'events',
          //@ts-ignore
          id: eventId,
        })

        //checking if Match already has Generated already
        if (event.areMatchesGenerated) {
          return Response.json({ error: 'Matches already Generated' })
        }

        //adding the task to the Job Queue to generate Matches
        await req.payload.jobs.queue({
          task: 'generateMatches',
          input: {
            //@ts-ignore
            event: Number.parseInt(eventId),
          },
        })

        return Response.json({ message: 'tempRegistrations' })
      },
    },
  ],
  access: {
    create: async ({ req, data }) => {
      if (!req.user || req.user.role != 'organiser') {
        return false
      }
      return true
    },

    read: () => true,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'tournament',
      type: 'relationship',
      relationTo: 'tournaments',
    },
    {
      name: 'areMatchesGenerated',
      type: 'checkbox',
      defaultValue: false,
      admin: {},
    },
    {
      name: 'Pairing Type',
      type: 'select',
      options: [
        {
          label: 'Round Robin',
          value: 'round-robin',
        },
        {
          label: 'Single Elimination',
          value: 'single-elimination',
        },
      ],
    },
    {
      name: 'numberOfSets',
      label: 'Number of sets per each Match',
      type: 'number',
      min: 1,
      max: 7,
    },
    {
      name: 'startdate',
      label: 'Choose Start Date and Time',
      type: 'date',
      timezone: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          minDate: new Date(),
        },
      },
    },
    {
      name: 'enddate',
      label: 'Choose End Date',
      type: 'date',
      timezone: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          minDate: new Date(),
        },
      },
    },
    {
      name: 'intervalBetweenMatches',
      label: 'Interval between Matches',
      type: 'select',
      options: [
        {
          value: '10',
          label: '10 min',
        },
        {
          value: '5',
          label: '5 min',
        },
      ],
    },
    {
      name: 'duration',
      label: 'Event Duration',
      type: 'select',
      options: [
        {
          label: '60 mins',
          value: '60',
        },
        {
          label: '30 mins',
          value: '30',
        },
      ],
    },
    {
      name: 'startTime',
      type: 'date',
      label: 'Start Time',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
        },
      },
    },
    {
      name: 'endTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
        },
      },
    },
    {
      name: 'registrationDeadline',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'maxScore',
      label: 'Game Point',
      type: 'number',
      min: 1,
      max: 99,
    },
    {
      name: 'Courts',
      type: 'array',
      fields: [
        {
          name: 'CourtIdentifier',
          label: 'Court Name',
          type: 'text',
        },
      ],
    },
  ],
}
