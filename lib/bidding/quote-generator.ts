import { formatINR } from "@/lib/utils/currency";

export interface TailorQuote {
  id: string;
  tailorId: string;
  tailorName: string;
  studioName: string;
  experience: number; // in years
  rating: number;
  reviews: number;
  completedOrders: number;
  specialization: string;
  avatar: string;
  thumbnail: string;
  portfolio: string[];
  materialCost: number; // in INR
  stitchingCost: number; // in INR
  customizationCost: number; // in INR
  tax: number; // in INR
  price: number; // total in INR
  deliveryDays: number;
  responseTime: string;
  status: "pending" | "accepted" | "declined";
  notes: string;
}

export interface DesignConfig {
  fabric?: string;
  color?: string;
  pattern?: string;
  style?: string;
  sleeve?: string;
  collar?: string;
  size?: string;
  fit?: string;
  specialRequirements?: string;
  [key: string]: unknown;
}

/**
 * Analyzes customer design configuration and dynamically generates 4 tailored quotes
 * matching specialist tailors, accurate material/labor cost breakdowns, and delivery estimates.
 */
export function generateDynamicQuotes(config?: DesignConfig | null): TailorQuote[] {
  const fabric = (config?.fabric || "Silk").toLowerCase();
  const style = (config?.style || "A-Line").toLowerCase();
  const pattern = (config?.pattern || "Solid").toLowerCase();
  const notes = (config?.specialRequirements || "").toLowerCase();

  // Determine garment category
  type Category = "bridal" | "suit" | "ethnic" | "dress" | "jacket" | "casual";
  let category: Category = "casual";

  if (style.includes("lehenga") || style.includes("bridal") || style.includes("gown") || notes.includes("wedding") || notes.includes("bridal")) {
    category = "bridal";
  } else if (style.includes("suit") || style.includes("blazer") || style.includes("tuxedo") || style.includes("indo-western")) {
    category = "suit";
  } else if (style.includes("jacket") || style.includes("coat")) {
    category = "jacket";
  } else if (style.includes("anarkali") || style.includes("kurti") || style.includes("saree") || fabric.includes("silk") || pattern.includes("paisley")) {
    category = "ethnic";
  } else if (style.includes("dress") || fabric.includes("velvet") || fabric.includes("georgette")) {
    category = "dress";
  } else {
    category = "casual";
  }

  // Base pricing matrix (in INR)
  let baseMaterial = 400;
  let baseLabor = 600;
  let minDays = 6;
  let maxDays = 9;

  switch (category) {
    case "bridal":
      baseMaterial = 6500;
      baseLabor = 8500;
      minDays = 20;
      maxDays = 35;
      break;
    case "suit":
      baseMaterial = 2200;
      baseLabor = 3200;
      minDays = 10;
      maxDays = 14;
      break;
    case "dress":
      baseMaterial = 1800;
      baseLabor = 2400;
      minDays = 8;
      maxDays = 12;
      break;
    case "ethnic":
      baseMaterial = 1100;
      baseLabor = 1500;
      minDays = 6;
      maxDays = 9;
      break;
    case "jacket":
      baseMaterial = 1600;
      baseLabor = 2200;
      minDays = 9;
      maxDays = 13;
      break;
    default:
      baseMaterial = 500;
      baseLabor = 700;
      minDays = 5;
      maxDays = 7;
      break;
  }

  // Fabric multiplier
  let fabricMultiplier = 1.0;
  if (fabric.includes("silk") || fabric.includes("velvet") || fabric.includes("wool")) {
    fabricMultiplier = 1.45;
  } else if (fabric.includes("linen") || fabric.includes("georgette") || fabric.includes("chiffon") || fabric.includes("crepe")) {
    fabricMultiplier = 1.2;
  }

  // Embroidery / Special customization surcharge
  let customizationAddon = 0;
  if (pattern.includes("floral") || pattern.includes("paisley") || notes.includes("embroidery") || notes.includes("beadwork") || notes.includes("hidden pockets") || notes.includes("lining")) {
    customizationAddon = Math.round(baseLabor * 0.25);
  }

  // Tailor Profiles Pool by Category
  const tailorPools = {
    bridal: [
      {
        id: "t_bridal_1",
        name: "Ananya Varma",
        studio: "Royal Couture Atelier",
        experience: 16,
        rating: 4.95,
        reviews: 240,
        completedOrders: 410,
        specialization: "Bridal & Zardozi Embroidery",
        avatar: "/images/fashion/designer_1.png",
        portfolio: ["/images/fashion/designer_1.png", "/images/fashion/designer_2.png", "/images/fashion/designer_3.png"],
        marginRatio: 1.15,
        daysOffset: 2,
        responseTime: "1 hr",
        notes: "Includes premium silk lining, hand-piping & fitting guarantees.",
      },
      {
        id: "t_bridal_2",
        name: "Meera Rajput",
        studio: "Velvet & Gold Heritage",
        experience: 14,
        rating: 4.9,
        reviews: 185,
        completedOrders: 320,
        specialization: "Lehengas & Festive Gowns",
        avatar: "/images/fashion/designer_2.png",
        portfolio: ["/images/fashion/designer_2.png", "/images/fashion/designer_3.png", "/images/fashion/designer_1.png"],
        marginRatio: 1.0,
        daysOffset: 0,
        responseTime: "3 hrs",
        notes: "Expert in heavy flared silhouettes and custom embellishments.",
      },
      {
        id: "t_bridal_3",
        name: "Priya Sharma",
        studio: "Artisanal Ethnic Studio",
        experience: 12,
        rating: 4.85,
        reviews: 290,
        completedOrders: 480,
        specialization: "Bespoke Ethnic Couture",
        avatar: "/images/fashion/designer_3.png",
        portfolio: ["/images/fashion/designer_3.png", "/images/fashion/designer_1.png", "/images/fashion/designer_2.png"],
        marginRatio: 0.9,
        daysOffset: -3,
        responseTime: "2 hrs",
        notes: "Fast turnaround with precision hand-finishing.",
      },
      {
        id: "t_bridal_4",
        name: "Lakshmi Studio",
        studio: "Lakshmi Handloom & Design",
        experience: 10,
        rating: 4.75,
        reviews: 140,
        completedOrders: 210,
        specialization: "Traditional Silk & Brocades",
        avatar: "/images/fashion/designer_1.png",
        portfolio: ["/images/fashion/designer_1.png", "/images/fashion/designer_2.png", "/images/fashion/designer_3.png"],
        marginRatio: 0.82,
        daysOffset: -5,
        responseTime: "4 hrs",
        notes: "Direct weaver pricing on authentic silk materials.",
      },
    ],
    suit: [
      {
        id: "t_suit_1",
        name: "Rajesh Kumar",
        studio: "Savile Row Certified Suits",
        experience: 18,
        rating: 4.92,
        reviews: 380,
        completedOrders: 620,
        specialization: "Bespoke Suiting & Tuxedos",
        avatar: "/images/fashion/designer_2.png",
        portfolio: ["/images/fashion/designer_2.png", "/images/fashion/designer_1.png", "/images/fashion/designer_3.png"],
        marginRatio: 1.12,
        daysOffset: 1,
        responseTime: "1 hr",
        notes: "Full canvas construction with hand-padded lapels.",
      },
      {
        id: "t_suit_2",
        name: "Vikram Malhotra",
        studio: "Heritage Suitcrafters",
        experience: 15,
        rating: 4.88,
        reviews: 340,
        completedOrders: 510,
        specialization: "Formal Blazers & Indo-Western",
        avatar: "/images/fashion/designer_1.png",
        portfolio: ["/images/fashion/designer_1.png", "/images/fashion/designer_3.png", "/images/fashion/designer_2.png"],
        marginRatio: 1.0,
        daysOffset: 0,
        responseTime: "2 hrs",
        notes: "Precision laser measurement & Italian wool options.",
      },
      {
        id: "t_suit_3",
        name: "Kavita Reddy",
        studio: "Modern Fit Workshop",
        experience: 9,
        rating: 4.8,
        reviews: 190,
        completedOrders: 280,
        specialization: "Slim Fit & Contemporary Coats",
        avatar: "/images/fashion/designer_3.png",
        portfolio: ["/images/fashion/designer_3.png", "/images/fashion/designer_2.png", "/images/fashion/designer_1.png"],
        marginRatio: 0.88,
        daysOffset: -2,
        responseTime: "3 hrs",
        notes: "Clean modern cuts with quick alteration support.",
      },
      {
        id: "t_suit_4",
        name: "Bespoke Artisans",
        studio: "Threadify Master Collective",
        experience: 11,
        rating: 4.78,
        reviews: 165,
        completedOrders: 230,
        specialization: "Custom Jackets & Trousers",
        avatar: "/images/fashion/designer_2.png",
        portfolio: ["/images/fashion/designer_2.png", "/images/fashion/designer_3.png", "/images/fashion/designer_1.png"],
        marginRatio: 0.8,
        daysOffset: -4,
        responseTime: "5 hrs",
        notes: "Affordable luxury tailored for everyday wear.",
      },
    ],
    default: [
      {
        id: "t_def_1",
        name: "Priya Sharma",
        studio: "Artisanal Ethnic Studio",
        experience: 12,
        rating: 4.95,
        reviews: 280,
        completedOrders: 420,
        specialization: "Custom Ethnic & Fusion Wear",
        avatar: "/images/fashion/designer_1.png",
        portfolio: ["/images/fashion/designer_1.png", "/images/fashion/designer_2.png", "/images/fashion/designer_3.png"],
        marginRatio: 1.0,
        daysOffset: 0,
        responseTime: "2 hrs",
        notes: "Hand-stitched finishes with custom fitting trial.",
      },
      {
        id: "t_def_2",
        name: "Vikram Malhotra",
        studio: "Heritage Tailoring House",
        experience: 15,
        rating: 4.85,
        reviews: 310,
        completedOrders: 530,
        specialization: "Pattern Cutting & Structured Wear",
        avatar: "/images/fashion/designer_2.png",
        portfolio: ["/images/fashion/designer_2.png", "/images/fashion/designer_3.png", "/images/fashion/designer_1.png"],
        marginRatio: 1.15,
        daysOffset: -2,
        responseTime: "4 hrs",
        notes: "Includes 2 complimentary alterations after delivery.",
      },
      {
        id: "t_def_3",
        name: "Lakshmi Studio",
        studio: "Lakshmi Handloom & Design",
        experience: 10,
        rating: 4.75,
        reviews: 185,
        completedOrders: 290,
        specialization: "Pure Cotton & Organic Linens",
        avatar: "/images/fashion/designer_3.png",
        portfolio: ["/images/fashion/designer_3.png", "/images/fashion/designer_1.png", "/images/fashion/designer_2.png"],
        marginRatio: 0.85,
        daysOffset: +3,
        responseTime: "1 hr",
        notes: "Eco-friendly natural dyes and sustainable fabrics.",
      },
      {
        id: "t_def_4",
        name: "Bespoke Tailors",
        studio: "Express Artisan Workshop",
        experience: 8,
        rating: 4.9,
        reviews: 142,
        completedOrders: 195,
        specialization: "Fast Turnaround & Modern Fits",
        avatar: "/images/fashion/designer_1.png",
        portfolio: ["/images/fashion/designer_1.png", "/images/fashion/designer_2.png", "/images/fashion/designer_3.png"],
        marginRatio: 1.25,
        daysOffset: -4,
        responseTime: "30 mins",
        notes: "Priority express stitching with doorstep delivery.",
      },
    ],
  };

  const selectedPool = category === "bridal" ? tailorPools.bridal : category === "suit" ? tailorPools.suit : tailorPools.default;

  return selectedPool.map((t, idx) => {
    const rawMat = Math.round(baseMaterial * fabricMultiplier * t.marginRatio);
    const rawLabor = Math.round(baseLabor * t.marginRatio);
    const rawCustom = Math.round(customizationAddon * t.marginRatio);
    const total = rawMat + rawLabor + rawCustom;
    const estDays = Math.max(3, minDays + t.daysOffset);

    return {
      id: `q_${t.id}_${idx}`,
      tailorId: t.id,
      tailorName: t.name,
      studioName: t.studio,
      experience: t.experience,
      rating: t.rating,
      reviews: t.reviews,
      completedOrders: t.completedOrders,
      specialization: t.specialization,
      avatar: t.avatar,
      thumbnail: t.portfolio[0],
      portfolio: t.portfolio,
      materialCost: rawMat,
      stitchingCost: rawLabor,
      customizationCost: rawCustom,
      tax: Math.round(total * 0.05),
      price: total,
      deliveryDays: estDays,
      responseTime: t.responseTime,
      status: "pending",
      notes: t.notes,
    };
  });
}
