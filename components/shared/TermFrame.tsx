import { ReactNode, CSSProperties } from 'react';

interface TermFrameProps {
  title: string;
  children: ReactNode;
  accent?: string;
}

export function TermFrame({ title, children, accent }: TermFrameProps) {
  return (
    <div className="termframe" style={accent ? ({ '--tf': accent } as CSSProperties) : undefined}>
      <div className="termframe__bar">
        <span className="termframe__dots"><i /><i /><i /></span>
        <span className="mono termframe__title">{title}</span>
      </div>
      <div className="termframe__body">{children}</div>
    </div>
  );
}
