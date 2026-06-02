import teams from '@/content/teams.json';
import { Equipo } from '@/components/team/Equipo';

export default function EquipoPage() {
  return <Equipo teams={teams} />;
}
