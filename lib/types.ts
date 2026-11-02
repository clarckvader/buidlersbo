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

export interface CoffeeEvent {
  id: number | string;
  slug: string;
  d: string;
  mo: string;
  name: string;
  type: string;
  city: string;
  place: string;
  cap: number;
  taken: number;
  registered: boolean;
  tag: string;
  desc: string;
}

export interface PendingInviteView {
  id: number | string;
  project: { name: string; slug: string; tagline: string };
  invitedBy: string;
}

export interface ParticipantData {
  projects: ProjectCard[];
  invites: PendingInviteView[];
  events: CoffeeEvent[];
}

export interface TeamMember {
  memberId: number | string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: 'owner' | 'member';
  title: string | null;
}

export interface ProjectCard {
  id: number | string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  status: 'idea' | 'construyendo' | 'lanzado';
  stack: string[];
  lookingFor: string[];
  team: TeamMember[];
}

export interface ProjectPage extends ProjectCard {
  description: string;
  category: string;
  links: string[];
  isOwner: boolean;
  isMember: boolean;
}

export interface Post {
  slug: string;
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
