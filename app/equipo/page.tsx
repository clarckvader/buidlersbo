import teams from '@/content/teams.json';
import { Equipo } from '@/components/equipo/Equipo';

export default function EquipoPage() {
  return <Equipo teams={teams} />;
}
