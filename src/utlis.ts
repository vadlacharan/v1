//@ts-nocheck
export function generateSlotsWithCourts(event) {
  const { startdate, enddate, startTime, endTime, duration, intervalBetweenMatches, Courts } = event
  console.log('----------------------------------')
  console.log(event)
  if (!Courts || Courts.length === 0) {
    throw new Error('No courts available for slot generation')
  }

  const matchDuration = Number(duration)
  const interval = Number(intervalBetweenMatches)
  const step = (matchDuration + interval) * 60000

  const start = new Date(startdate)
  const end = new Date(enddate)

  const st = new Date(startTime)
  const et = new Date(endTime)

  const result = []

  // 📅 Loop days
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    let current = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      st.getHours(),
      st.getMinutes(),
      0,
    )

    const dayEnd = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      et.getHours(),
      et.getMinutes(),
      0,
    )

    // ⏱ Loop time slots
    while (current.getTime() + matchDuration * 60000 <= dayEnd.getTime()) {
      // 🏟 Create slot for EACH court (SIMULTANEOUS)
      for (const court of Courts) {
        result.push({
          timeSlot: new Date(current),
          court: court.CourtIdentifier, // TEXT
        })
      }

      current = new Date(current.getTime() + step)
    }
  }

  return result
}
