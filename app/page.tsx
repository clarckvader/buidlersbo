import siteData from '@/content/site.json';
import { Landing } from '@/components/home/Landing';

export default function Home() {
  return <Landing values={siteData.values} stats={siteData.stats} />;
}
