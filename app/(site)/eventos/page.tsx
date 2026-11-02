import { getEvents } from '@/lib/content'
import { getCurrentMember } from '@/lib/currentMember'
import { Eventos } from '@/components/events/Eventos'

export default async function EventosPage() {
  const events = await getEvents(await getCurrentMember())
  return <Eventos events={events} />
}
