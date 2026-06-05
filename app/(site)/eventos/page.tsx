import { getEvents } from '@/lib/content'
import { Eventos } from '@/components/events/Eventos'

export default async function EventosPage() {
  const events = await getEvents()
  return <Eventos events={events} />
}
