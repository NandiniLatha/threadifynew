export interface InspirationItem {
  id: string;
  type: 'image' | 'url';
  src: string;
  addedAt: string;
}

export interface DesignConfig {
  fabric: string;
  color: string;
  pattern: string;
  sleeve: string;
  collar: string;
  fit: string;
  measurements: Record<string, number>;
}

export interface PriceQuote {
  id: string;
  tailorId: string;
  materialCost: number;
  stitchingCost: number;
  deliveryDays: number;
  rating: number;
  reviewCount: number;
}

export interface Tailor {
  id: string;
  name: string;
  rating: number;
  experienceYears: number;
  completedOrders: number;
  responseTimeHrs: number;
  available: boolean;
  portfolio: string[];
}

export interface ProductionStage {
  key: string;
  label: string;
  completedAt: string | null;
  photos: string[];
}

export interface Order {
  id: string;
  inspiration: InspirationItem[];
  design: DesignConfig;
  quotation: PriceQuote;
  tailor: Tailor;
  stages: ProductionStage[];
}
