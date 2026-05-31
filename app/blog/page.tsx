import posts from '@/content/posts.json';
import { Blog } from '@/components/blog/Blog';

export default function BlogPage() {
  return <Blog posts={posts} />;
}
