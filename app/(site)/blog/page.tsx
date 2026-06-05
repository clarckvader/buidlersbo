import { getPosts } from '@/lib/content'
import { Blog } from '@/components/blog/Blog'

export default async function BlogPage() {
  const posts = await getPosts()
  return <Blog posts={posts} />
}
