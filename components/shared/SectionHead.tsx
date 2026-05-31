interface SectionHeadProps {
  index: string;
  eyebrow: string;
  title: string;
  sub?: string;
}

export function SectionHead({ index, eyebrow, title, sub }: SectionHeadProps) {
  return (
    <header className="sec-head reveal">
      <div className="sec-head__top">
        <span className="kbd-label">{index}</span>
        <span className="sec-head__rule" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 className="sec-head__title">{title}</h2>
      {sub && <p className="sec-head__sub">{sub}</p>}
    </header>
  );
}
