export interface NavItem {
  id: string;
  label: string;
  glyph: string;
}

export interface Value {
  k: string;
  v: string;
}

export interface Stat {
  n: string;
  l: string;
  src: string;
}

export interface Project {
  rank: number;
  name: string;
  cat: string;
  builder: string;
  loc: string;
  year: string | number;
  metric: string;
  metricL: string;
  delta: string;
  tags: string[];
  blurb: string;
  funding?: string;
}

export interface Team {
  name: string;
  focus: string;
  city: string;
  members: number;
  open: number;
  stack: string[];
  lead: string;
}

export interface CoffeeEvent {
  d: string;
  mo: string;
  name: string;
  type: string;
  city: string;
  place: string;
  cap: number;
  taken: number;
  tag: string;
  desc: string;
}

export interface Post {
  cat: string;
  title: string;
  read: string;
  date: string;
  author: string;
  excerpt: string;
  feat?: boolean;
}

export interface GeoNode {
  city: string;
  lon: number;
  lat: number;
  members: number;
  status: string;
  note: string;
  labelSide: string;
}

export interface RedesData {
  nodes: GeoNode[];
  outline: [number, number][];
}

export interface User {
  provider: string;
  name: string;
  handle: string;
  team: string;
}

export const NAV: NavItem[] = [
  { id: 'inicio',  label: 'inicio',  glyph: '>_' },
  { id: 'ranking', label: 'ranking', glyph: '#'  },
  { id: 'equipo',  label: 'equipo',  glyph: '::' },
  { id: 'redes',   label: 'redes',   glyph: '@'  },
  { id: 'eventos', label: 'eventos', glyph: '//' },
  { id: 'blog',    label: 'blog',    glyph: '~'  },
];
