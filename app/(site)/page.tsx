import { getSiteData } from '@/lib/content'
import { Landing } from '@/components/home/Landing'

export default async function Home() {
  const siteData = await getSiteData()
  return <Landing values={siteData.values} stats={siteData.stats} />
}
