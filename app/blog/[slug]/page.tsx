import { notFound } from 'next/navigation';
import posts from '@/content/posts.json';
import { slugify } from '@/lib/slugify';
import Link from 'next/link';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: slugify(p.title) }));
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => slugify(p.title) === params.slug);
  if (!post) notFound();

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
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>{post.excerpt}</p>
      </div>
    </div>
  );
}
