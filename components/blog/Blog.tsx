'use client';

import Link from 'next/link';
import { SectionHead } from '@/components/shared/SectionHead';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { slugify } from '@/lib/slugify';
import { Post } from '@/lib/types';

export function Blog({ posts }: { posts: Post[] }) {
  useRevealFallback('blog');
  const feat = posts.find((p) => p.feat) ?? posts[0];
  const rest = posts.filter((p) => p !== feat);

  return (
    <div className="section-pad">
      <div className="blog-wrap">
        <SectionHead index="06" eyebrow="~ blog" title="Notas de la red" sub="Manifiestos, tutoriales técnicos y lecturas del ecosistema cripto boliviano. Escrito por la comunidad, para la comunidad." />

        <div className="blog-feat reveal">
          <div className="blog-feat__media">
            <span className="glyph mono">{'{ }'}</span>
            <span className="ph mono">imagen destacada · drop aquí</span>
          </div>
          <div className="blog-feat__body">
            <span className="postcard__cat mono">{feat.cat} · destacado</span>
            <h3>{feat.title}</h3>
            <p>{feat.excerpt}</p>
            <div className="blog-meta">
              <span className="au">{feat.author}</span>
              <span>·</span>
              <span>{feat.date}</span>
              <span>·</span>
              <span>{feat.read} lectura</span>
            </div>
            <Link href={`/blog/${slugify(feat.title)}`} className="btn btn-primary" style={{ marginTop: 24, alignSelf: 'flex-start' }}>
              leer artículo ↗
            </Link>
          </div>
        </div>

        <div className="blog-grid">
          {rest.map((p) => (
            <Link href={`/blog/${slugify(p.title)}`} key={p.title} style={{ textDecoration: 'none' }}>
              <article className="postcard card reveal">
                <span className="postcard__cat mono">{p.cat}</span>
                <h4 className="postcard__title">{p.title}</h4>
                <p className="postcard__excerpt">{p.excerpt}</p>
                <div className="postcard__foot">
                  <span>{p.date} · {p.read}</span>
                  <span className="postcard__arrow">↗</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
