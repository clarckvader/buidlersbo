import { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  tone?: string;
}

export function Chip({ children, tone }: ChipProps) {
  return (
    <span className={'chip' + (tone ? ' chip--' + tone : '')}>{children}</span>
  );
}
