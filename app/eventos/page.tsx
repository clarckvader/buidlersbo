import events from '@/content/events.json';
import { Eventos } from '@/components/eventos/Eventos';

export default function EventosPage() {
  return <Eventos events={events} />;
}
