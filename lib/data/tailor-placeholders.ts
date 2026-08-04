import { getTailorConfig } from "./tailor-config"

export interface TailorPlaceholderData {
  specialty: string[];
  experienceYears: number;
  location: string;
  availability: 'Accepting Orders' | 'Busy' | 'Unavailable';
  pricing: {
    garmentType: string;
    startingPrice: number;
  }[];
  deliveryTimelines: {
    type: string;
    timeline: string;
  }[];
  fabrics: string[];
  measurementOptions: string[];
  stats: {
    happyCustomers: number;
    repeatCustomers: string;
    averageDelivery: string;
  };
}

export const defaultTailorPlaceholder: TailorPlaceholderData = {
  specialty: ['Bridal Wear', 'Lehengas', 'Sarees'],
  experienceYears: 12,
  location: 'Mumbai, Maharashtra',
  availability: 'Accepting Orders',
  pricing: [
    { garmentType: 'Simple Wear', startingPrice: 1500 },
  ],
  deliveryTimelines: [
    { type: 'Standard', timeline: '7-14 Days' },
  ],
  fabrics: ['Silk', 'Cotton'],
  measurementOptions: ['Visit Store', 'Home Measurement', 'Video Consultation'],
  stats: {
    happyCustomers: 450,
    repeatCustomers: '85%',
    averageDelivery: '12 Days',
  },
};

export function getTailorPlaceholder(id: string, nameHint?: string): TailorPlaceholderData {
  const config = getTailorConfig(id, nameHint)
  
  return {
    specialty: [config.category, config.specialty],
    experienceYears: config.experience,
    location: config.location,
    availability: config.availabilityStatus === "Accepting Orders" ? "Accepting Orders" : "Busy",
    pricing: config.pricing.map(p => ({ garmentType: p.item, startingPrice: p.startingAt })),
    deliveryTimelines: config.deliveryTimeline.map(d => ({ type: d.service, timeline: d.days })),
    fabrics: config.fabricList,
    measurementOptions: config.measurementOptions,
    stats: {
      happyCustomers: config.happyCustomers,
      repeatCustomers: config.repeatCustomers,
      averageDelivery: config.deliveryTimeline[0]?.days || "10 Days"
    }
  };
}
