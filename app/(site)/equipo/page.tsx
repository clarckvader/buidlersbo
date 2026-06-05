import { getTeams } from '@/lib/content'
import { Equipo } from '@/components/team/Equipo'

export default async function EquipoPage() {
  const teams = await getTeams()
  return <Equipo teams={teams} />
}
