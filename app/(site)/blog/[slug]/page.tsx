import { notFound } from 'next/navigation'
import { getPostSlugs, getPost } from '@/lib/content'
import Link from 'next/link'

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  return (
    <div className="section-pad">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/blog" className="mono" style={{ color: 'var(--ink-faint)', fontSize: 13, display: 'block', marginBottom: 32 }}>
          ← blog
        </Link>
        <span className="mono" style={{ color: 'var(--yellow)', fontSize: 13 }}>{post.cat}</span>
        <h1 style={{ marginTop: 8, marginBottom: 16 }}>{post.title}</h1>
        <div className="mono" style={{ color: 'var(--ink-faint)', fontSize: 13, marginBottom: 32 }}>
          {post.author} · {post.date} · {post.read} lectura
        </div>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: 40 }}>{post.excerpt}</p>
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </div>
    </div>
  )
}
