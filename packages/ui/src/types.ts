export type RiverStatus = 'good' | 'warning' | 'critical';
export type WasteIndex = 'Rendah' | 'Sedang' | 'Berat';

export interface River {
  id: string;
  slug: string;
  name: string;
  province: string;
  description: string;
  status: RiverStatus;
  ikaScore: number;
  ph: number;
  doMgL: number;
  tssMgL: number;
  wasteIndex: WasteIndex;
  issues: string[];
  coordinates: { lat: number; lng: number };
  lastUpdated: string;
  verifier: string;
  liveCamUrl?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  coverImage: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readMinutes: number;
  totalViews: number;
  videoUrl?: string;
}

export interface Milestone {
  id: string;
  year: string;
  title: string;
  phase: string;
  narrative: string;
  quote?: string;
  image?: string;
}

export type VolunteerRole =
  | 'Uji Air'
  | 'Dokumentasi'
  | 'Logistik'
  | 'Edukasi'
  | 'Medis'
  | 'Advokasi'
  | 'Aksi Lapangan';

export interface Program {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  type: 'dana' | 'petisi';
}
