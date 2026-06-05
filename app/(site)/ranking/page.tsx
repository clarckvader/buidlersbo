import { getProjects } from '@/lib/content'
import { Ranking } from '@/components/ranking/Ranking'

export default async function RankingPage() {
  const projects = await getProjects()
  return <Ranking projects={projects} />
}
