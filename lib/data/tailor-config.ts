import { getFashionCoverImage, getFashionProfileImage } from "./fashion-images"

export interface TailorConfig {
  specialty: string
  category: string
  experience: number // Years
  location: string
  startingPrice: number
  responseTime: string
  coverImage: string
  profileImage: string
  availabilityStatus: "Accepting Orders" | "Limited Availability" | "Fully Booked"
  pricing: Array<{ item: string; startingAt: number }>
  deliveryTimeline: Array<{ service: string; days: string }>
  fabricList: string[]
  measurementOptions: string[]
  happyCustomers: number
  repeatCustomers: string // e.g., "40%"
  beforeAfterPairs: Array<{
    inspirationImg: string
    resultImg: string
    label: string
  }>
  expertiseTags: string[]
  reviewCount?: number
}

export const CATEGORIES = [
  "Bridal Couture",
  "Luxury Sarees",
  "Half Sarees",
  "Designer Blouses",
  "Anarkalis",
  "Western Dresses",
  "Party Wear",
  "Formal Wear",
  "Menswear",
  "Blazers",
  "Sherwanis",
  "Kids Wear",
  "Boutique Tailoring",
  "Ethnic Wear",
  "Custom Embroidery"
] as const;

export type Category = typeof CATEGORIES[number];

export const DEFAULT_CONFIG: TailorConfig = {
  specialty: "Bespoke Menswear & Suiting",
  category: "Menswear",
  experience: 12,
  location: "Mumbai, Maharashtra",
  startingPrice: 350,
  responseTime: "Usually responds in 2 hours",
  coverImage: getFashionCoverImage("Menswear", 0),
  profileImage: getFashionProfileImage("Menswear", 0),
  availabilityStatus: "Accepting Orders",
  pricing: [
    { item: "Bespoke Suit (2-piece)", startingAt: 350 },
    { item: "Custom Trousers", startingAt: 120 },
    { item: "Tailored Shirt", startingAt: 85 },
    { item: "Winter Overcoat", startingAt: 450 },
  ],
  deliveryTimeline: [
    { service: "Standard", days: "14-21 days" },
    { service: "Express", days: "7-10 days (+₹50)" },
    { service: "Bridal/Intricate", days: "30-45 days" },
  ],
  fabricList: [
    "Italian Wool Blends",
    "Egyptian Cotton",
    "Linen (Irish & Belgian)",
    "Silk & Satin",
    "Cashmere Blends",
  ],
  measurementOptions: [
    "Home Measurement (Select Cities)",
    "Virtual Consultation",
    "Self-Measure with Video Guide",
    "Send Existing Garment",
  ],
  happyCustomers: 310,
  repeatCustomers: "45%",
  beforeAfterPairs: [
    {
      inspirationImg: getFashionCoverImage("Menswear", 1),
      resultImg: getFashionCoverImage("Menswear", 2),
      label: "Classic Double-Breasted Suit",
    },
    {
      inspirationImg: getFashionCoverImage("Blazers", 0),
      resultImg: getFashionCoverImage("Formal Wear", 0),
      label: "Vintage Recreation",
    },
  ],
  expertiseTags: [
    "Hand-stitched Buttonholes",
    "Full Canvas Construction",
    "Sustainable Fabrics",
    "Pattern Drafting",
    "Alterations",
  ],
}

export const DESIGNERS = [
  {
    name: "Aisha's Bridal Studio",
    email: "aisha.bridal@threadify.in",
    category: "Bridal Couture",
    location: "Jaipur, Rajasthan",
    experience: 15,
    startingPrice: 8500,
    responseTime: "Usually responds in 1 hour",
    rating: 4.9,
    reviewCount: 84,
    profileImage: "photo-1500648767791-00dcc994a43e",
    coverImage: "photo-1595777457583-95e059d581b8",
    portfolioImages: ["photo-1550928431-ee0ec6db30d3", "photo-1572804013309-59a88b7e92f1"],
    bio: "Exquisite bridal couture hand-crafted in Jaipur. Specializing in royal lehengas and wedding trousseau."
  },
  {
    name: "Royal Knot Couture",
    email: "royalknot@threadify.in",
    category: "Bridal Couture",
    location: "Delhi, NCR",
    experience: 12,
    startingPrice: 9500,
    responseTime: "Usually responds in 2 hours",
    rating: 4.8,
    reviewCount: 62,
    profileImage: "photo-1544005313-94ddf0286df2",
    coverImage: "photo-1550928431-ee0ec6db30d3",
    portfolioImages: ["photo-1595777457583-95e059d581b8", "photo-1572804013309-59a88b7e92f1"],
    bio: "Luxury bridal wear and custom wedding gowns. Elevating heritage designs with modern silhouettes."
  },
  {
    name: "Zoya Saree Tailor",
    email: "zoyasaree@threadify.in",
    category: "Luxury Sarees",
    location: "Varanasi, Uttar Pradesh",
    experience: 10,
    startingPrice: 6000,
    responseTime: "Usually responds in same day",
    rating: 4.7,
    reviewCount: 45,
    profileImage: "photo-1522075469751-3a6694fb2f61",
    coverImage: "photo-1610030469983-98e550d6193c",
    portfolioImages: ["photo-1529139574466-a303027c1d8b", "photo-1434389677669-e08b4cac3105"],
    bio: "Handwoven luxury banarasi sarees and contemporary drapes. Dedicated to preserving Indian textiles."
  },
  {
    name: "Kavya Reddy Drapes",
    email: "kavyareddy@threadify.in",
    category: "Luxury Sarees",
    location: "Hyderabad, Telangana",
    experience: 8,
    startingPrice: 5500,
    responseTime: "Usually responds in 1 hour",
    rating: 4.9,
    reviewCount: 78,
    profileImage: "photo-1531746020798-e6953c6e8e04",
    coverImage: "photo-1529139574466-a303027c1d8b",
    portfolioImages: ["photo-1610030469983-98e550d6193c", "photo-1434389677669-e08b4cac3105"],
    bio: "Specialist in Kanjeevaram and designer sarees. Providing custom blouse stitching and pleating services."
  },
  {
    name: "Vogue & Verve",
    email: "vogueverve@threadify.in",
    category: "Western Dresses",
    location: "Mumbai, Maharashtra",
    experience: 6,
    startingPrice: 3200,
    responseTime: "Usually responds in 3 hours",
    rating: 4.6,
    reviewCount: 39,
    profileImage: "photo-1542206395-9feb3edaa68d",
    coverImage: "photo-1512436991641-6745cdb1723f",
    portfolioImages: ["photo-1483985988355-763728e1935b", "photo-1515886657613-9f3515b0c78f"],
    bio: "High fashion western wear, custom evening gowns, and ready-to-wear party outfits in Mumbai."
  },
  {
    name: "Stella Custom Fits",
    email: "stellafits@threadify.in",
    category: "Western Dresses",
    location: "Bengaluru, Karnataka",
    experience: 5,
    startingPrice: 2800,
    responseTime: "Usually responds within 24 hours",
    rating: 4.5,
    reviewCount: 28,
    profileImage: "photo-1519085360753-af0119f7cbe7",
    coverImage: "photo-1483985988355-763728e1935b",
    portfolioImages: ["photo-1512436991641-6745cdb1723f", "photo-1515886657613-9f3515b0c78f"],
    bio: "Modern silhouettes, premium fabrics, and chic custom western wear tailored to perfection."
  },
  {
    name: "Avani Couture",
    email: "avanicouture@threadify.in",
    category: "Anarkalis",
    location: "Kolkata, West Bengal",
    experience: 14,
    startingPrice: 4800,
    responseTime: "Usually responds in 2 hours",
    rating: 4.8,
    reviewCount: 57,
    profileImage: "photo-1560250097-0b93528c311a",
    coverImage: "photo-1496747611176-843222e1e57c",
    portfolioImages: ["photo-1509631179647-0177331693ae", "photo-1539109136881-3be0616acf4b"],
    bio: "Classic, flowy Anarkali suits with intricate hand embroidery and zardozi borders."
  },
  {
    name: "Gulbahar Ensemble",
    email: "gulbahar@threadify.in",
    category: "Anarkalis",
    location: "Lucknow, Uttar Pradesh",
    experience: 11,
    startingPrice: 4200,
    responseTime: "Usually responds in same day",
    rating: 4.7,
    reviewCount: 48,
    profileImage: "photo-1508214751196-bcfd4ca60f91",
    coverImage: "photo-1509631179647-0177331693ae",
    portfolioImages: ["photo-1496747611176-843222e1e57c", "photo-1539109136881-3be0616acf4b"],
    bio: "Famous Chikankari Anarkalis and traditional ethnic wear reflecting Lakhnavi heritage."
  },
  {
    name: "Lakshmi Stitch Studio",
    email: "lakshmi.demo@threadify.in",
    category: "Designer Blouses",
    location: "Chennai, Tamil Nadu",
    experience: 7,
    startingPrice: 1800,
    responseTime: "Usually responds in 1 hour",
    rating: 4.8,
    reviewCount: 91,
    profileImage: "photo-1573496359142-b8d87734a5a2",
    coverImage: "photo-1556905055-8f358a7a47b2",
    portfolioImages: ["photo-1485230895905-ec40ba36b9bc", "photo-1479064555552-3ef4979f8908"],
    bio: "Exquisite designer blouses, custom embroidery, and specialized festive wear."
  },
  {
    name: "Prerna Sharma Label",
    email: "prernasharma@threadify.in",
    category: "Designer Blouses",
    location: "Pune, Maharashtra",
    experience: 9,
    startingPrice: 2200,
    responseTime: "Usually responds in 2 hours",
    rating: 4.6,
    reviewCount: 54,
    profileImage: "photo-1488426862026-3ee34a7d66df",
    coverImage: "photo-1485230895905-ec40ba36b9bc",
    portfolioImages: ["photo-1556905055-8f358a7a47b2", "photo-1479064555552-3ef4979f8908"],
    bio: "Modern designer blouses and luxury crop tops. Tailored to complement any contemporary saree."
  },
  {
    name: "Karthik Bespoke Tailors",
    email: "karthik.demo@threadify.in",
    category: "Menswear",
    location: "Bengaluru, Karnataka",
    experience: 12,
    startingPrice: 3500,
    responseTime: "Usually responds in 2 hours",
    rating: 4.6,
    reviewCount: 40,
    profileImage: "photo-1522075469751-3a6694fb2f61",
    coverImage: "photo-1507679799987-c73779587ccf",
    portfolioImages: ["photo-1505022610485-0249ba5b3675", "photo-1617137968427-85924c800a22"],
    bio: "Bespoke menswear, custom suiting, and formal shirting constructed to your exact fit."
  },
  {
    name: "Vikram Malhotra Suits",
    email: "vikram@threadify.in",
    category: "Menswear",
    location: "Ludhiana, Punjab",
    experience: 18,
    startingPrice: 7500,
    responseTime: "Usually responds in 3 hours",
    rating: 4.9,
    reviewCount: 110,
    profileImage: "photo-1539571696357-5a69c17a67c6",
    coverImage: "photo-1505022610485-0249ba5b3675",
    portfolioImages: ["photo-1507679799987-c73779587ccf", "photo-1617137968427-85924c800a22"],
    bio: "Premium custom suiting, bandhgalas, and bespoke trousers. Handcrafted elegance for gentlemen."
  },
  {
    name: "Aura Boutique",
    email: "tailor4.demo@threadify.in",
    category: "Party Wear",
    location: "Mumbai, Maharashtra",
    experience: 4,
    startingPrice: 3800,
    responseTime: "Usually responds in 2 hours",
    rating: 4.2,
    reviewCount: 22,
    profileImage: "photo-1524504388940-b1c1722653e1",
    coverImage: "photo-1577900232427-18219b9166a0",
    portfolioImages: ["photo-1601924994987-69e26d50dc26", "photo-1525507119028-ed4c629a60a3"],
    bio: "Trendy party wear, casual dresses, and fusion wear designed for the spotlight."
  },
  {
    name: "The Corporate Stitch",
    email: "corporatestitch@threadify.in",
    category: "Formal Wear",
    location: "Gurugram, Haryana",
    experience: 8,
    startingPrice: 4000,
    responseTime: "Usually responds in same day",
    rating: 4.7,
    reviewCount: 66,
    profileImage: "photo-1492562080023-ab3db95bfbce",
    coverImage: "photo-1562157873-818bc0726f68",
    portfolioImages: ["photo-1578932750294-f5075e85f44a", "photo-1516257984-b1b4d707412e"],
    bio: "Custom office wear, power suits, blazers, and formal trousers for the modern professional."
  },
  {
    name: "Prestige Suits",
    email: "tailor5.demo@threadify.in",
    category: "Blazers",
    location: "Delhi, NCR",
    experience: 15,
    startingPrice: 5000,
    responseTime: "Usually responds in 1 hour",
    rating: 4.5,
    reviewCount: 33,
    profileImage: "photo-1534528741775-53994a69daeb",
    coverImage: "photo-1617137968427-85924c800a22",
    portfolioImages: ["photo-1507679799987-c73779587ccf", "photo-1505022610485-0249ba5b3675"],
    bio: "Custom blazers, sports jackets, and bespoke outerwear tailored for a sharp look."
  },
  {
    name: "Maharaja Groom Wear",
    email: "maharajagroom@threadify.in",
    category: "Sherwanis",
    location: "Jaipur, Rajasthan",
    experience: 20,
    startingPrice: 12000,
    responseTime: "Usually responds in 2 hours",
    rating: 5.0,
    reviewCount: 124,
    profileImage: "photo-1438761681033-6461ffad8d80",
    coverImage: "photo-1617137984095-74e4e5e3613f",
    portfolioImages: ["photo-1507679799987-c73779587ccf", "photo-1617137968427-85924c800a22"],
    bio: "Heritage sherwanis, bandhgalas, and traditional royal groom wear of Rajasthan."
  },
  {
    name: "Tiny Tots Boutique",
    email: "tinytots@threadify.in",
    category: "Kids Wear",
    location: "Bengaluru, Karnataka",
    experience: 3,
    startingPrice: 1500,
    responseTime: "Usually responds within 24 hours",
    rating: 4.3,
    reviewCount: 15,
    profileImage: "photo-1580489944761-15a19d654956",
    coverImage: "photo-1525507119028-ed4c629a60a3",
    portfolioImages: ["photo-1601924994987-69e26d50dc26", "photo-1577900232427-18219b9166a0"],
    bio: "Cute, comfortable custom ethnic and party outfits for toddlers and children."
  },
  {
    name: "Meena's Boutique",
    email: "meena.demo@threadify.in",
    category: "Ethnic Wear",
    location: "Hyderabad, Telangana",
    experience: 12,
    startingPrice: 1800,
    responseTime: "Usually responds in 2 hours",
    rating: 4.8,
    reviewCount: 95,
    profileImage: "photo-1516257984-b1b4d707412e",
    coverImage: "photo-1479064555552-3ef4979f8908",
    portfolioImages: ["photo-1485230895905-ec40ba36b9bc", "photo-1556905055-8f358a7a47b2"],
    bio: "Hyderabad based designer boutique specializing in custom ethnic wear and festive drapes."
  }
];

export function getTailorConfig(tailorId: string, bioOrNameHint?: string): TailorConfig {
  const hint = (bioOrNameHint || "").toLowerCase();
  
  const designerIndex = DESIGNERS.findIndex(d =>
    d.name.toLowerCase().includes(hint) ||
    hint.includes(d.name.toLowerCase()) ||
    (d.bio && (d.bio.toLowerCase().includes(hint) || hint.includes(d.bio.toLowerCase()))) ||
    tailorId === d.email
  );

  const designer = designerIndex !== -1 ? DESIGNERS[designerIndex] : null;

  // Generate dynamic unique statistics if fallback designer
  const hash = tailorId ? tailorId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const dynamicHappyCustomers = hash ? (hash % 180) + 30 : 310;
  const dynamicReviewCount = hash ? Math.max(10, dynamicHappyCustomers - (hash % 20) - 5) : 280;
  
  if (designer) {
    return {
      ...DEFAULT_CONFIG,
      specialty: `${designer.category} Specialist`,
      category: designer.category,
      experience: designer.experience,
      location: designer.location,
      startingPrice: designer.startingPrice,
      responseTime: designer.responseTime,
      happyCustomers: designer.reviewCount + Math.floor(designer.reviewCount * 0.15) + 5,
      reviewCount: designer.reviewCount,
      coverImage: getFashionCoverImage(designer.category, designerIndex),
      profileImage: getFashionProfileImage(designer.category, designerIndex),
      pricing: [
        { item: `Custom ${designer.category}`, startingAt: designer.startingPrice },
        { item: "Premium Stitching", startingAt: Math.round(designer.startingPrice * 0.7) },
        { item: "Alterations", startingAt: Math.max(200, Math.round(designer.startingPrice * 0.1)) },
      ]
    };
  }

  // Fallback category matching
  const lowerHint = hint.toLowerCase();
  if (lowerHint.includes("bridal") || lowerHint.includes("wedding")) {
    return {
      ...DEFAULT_CONFIG,
      category: "Bridal Couture",
      specialty: "Bridal Couture Specialist",
      happyCustomers: dynamicHappyCustomers,
      reviewCount: dynamicReviewCount,
      coverImage: getFashionCoverImage("Bridal Couture", hash),
      profileImage: getFashionProfileImage("Bridal Couture", hash),
    };
  }
  if (lowerHint.includes("saree") || lowerHint.includes("sari")) {
    return {
      ...DEFAULT_CONFIG,
      category: "Luxury Sarees",
      specialty: "Luxury Saree Specialist",
      happyCustomers: dynamicHappyCustomers,
      reviewCount: dynamicReviewCount,
      coverImage: getFashionCoverImage("Luxury Sarees", hash),
      profileImage: getFashionProfileImage("Luxury Sarees", hash),
    };
  }
  if (lowerHint.includes("men") || lowerHint.includes("suit")) {
    return {
      ...DEFAULT_CONFIG,
      category: "Menswear",
      specialty: "Menswear Specialist",
      happyCustomers: dynamicHappyCustomers,
      reviewCount: dynamicReviewCount,
      coverImage: getFashionCoverImage("Menswear", hash),
      profileImage: getFashionProfileImage("Menswear", hash),
    };
  }
  if (lowerHint.includes("sherwani") || lowerHint.includes("groom")) {
    return {
      ...DEFAULT_CONFIG,
      category: "Sherwanis",
      specialty: "Sherwani & Groom Wear Specialist",
      happyCustomers: dynamicHappyCustomers,
      reviewCount: dynamicReviewCount,
      coverImage: getFashionCoverImage("Sherwanis", hash),
      profileImage: getFashionProfileImage("Sherwanis", hash),
    };
  }
  
  return { 
    ...DEFAULT_CONFIG,
    happyCustomers: dynamicHappyCustomers,
    reviewCount: dynamicReviewCount,
    coverImage: getFashionCoverImage("Boutique Tailoring", hash),
    profileImage: getFashionProfileImage("Boutique Tailoring", hash),
  };
}


