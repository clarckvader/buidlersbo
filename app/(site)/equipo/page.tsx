import { getProjectDirectory } from '@/lib/content'
import { Equipo } from '@/components/team/Equipo'

export default async function EquipoPage() {
  return <Equipo projects={await getProjectDirectory()} />
}
