import projects from '@/content/projects.json';
import { Ranking } from '@/components/ranking/Ranking';

export default function RankingPage() {
  return <Ranking projects={projects} />;
}
