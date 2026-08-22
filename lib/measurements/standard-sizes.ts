export type StandardSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"

export type GarmentType = "general" | "blouse" | "shirt" | "dress"

export const STANDARD_SIZES: StandardSize[] = ["XS", "S", "M", "L", "XL", "XXL"]

export interface GarmentField {
  key: string
  label: string
  unit: string
  placeholder: string
}

export const GARMENT_FIELDS: Record<GarmentType, GarmentField[]> = {
  general: [
    { key: "chest",         label: "Chest / Bust",   unit: "cm", placeholder: "e.g. 90" },
    { key: "waist",         label: "Waist",           unit: "cm", placeholder: "e.g. 70" },
    { key: "hips",          label: "Hips",            unit: "cm", placeholder: "e.g. 96" },
    { key: "shoulder",      label: "Shoulder Width",  unit: "cm", placeholder: "e.g. 38" },
    { key: "sleeve_length", label: "Sleeve Length",   unit: "cm", placeholder: "e.g. 55" },
    { key: "height",        label: "Height",          unit: "cm", placeholder: "e.g. 162" },
  ],
  blouse: [
    { key: "chest",         label: "Bust",            unit: "cm", placeholder: "e.g. 88" },
    { key: "waist",         label: "Waist",           unit: "cm", placeholder: "e.g. 70" },
    { key: "shoulder",      label: "Shoulder",        unit: "cm", placeholder: "e.g. 36" },
    { key: "sleeve_length", label: "Sleeve Length",   unit: "cm", placeholder: "e.g. 40" },
    { key: "custom.armhole",     label: "Armhole",         unit: "cm", placeholder: "e.g. 38" },
    { key: "custom.blouse_length", label: "Blouse Length", unit: "cm", placeholder: "e.g. 42" },
    { key: "custom.neck_depth",  label: "Neck Depth",      unit: "cm", placeholder: "e.g. 7"  },
  ],
  shirt: [
    { key: "chest",         label: "Chest",           unit: "cm", placeholder: "e.g. 100" },
    { key: "shoulder",      label: "Shoulder",        unit: "cm", placeholder: "e.g. 42"  },
    { key: "neck",          label: "Neck",            unit: "cm", placeholder: "e.g. 39"  },
    { key: "sleeve_length", label: "Sleeve Length",   unit: "cm", placeholder: "e.g. 60"  },
    { key: "custom.shirt_length", label: "Shirt Length", unit: "cm", placeholder: "e.g. 76" },
  ],
  dress: [
    { key: "chest",         label: "Bust",            unit: "cm", placeholder: "e.g. 90"  },
    { key: "waist",         label: "Waist",           unit: "cm", placeholder: "e.g. 70"  },
    { key: "hips",          label: "Hips",            unit: "cm", placeholder: "e.g. 96"  },
    { key: "shoulder",      label: "Shoulder",        unit: "cm", placeholder: "e.g. 38"  },
    { key: "sleeve_length", label: "Sleeve Length",   unit: "cm", placeholder: "e.g. 55"  },
    { key: "custom.dress_length", label: "Dress Length", unit: "cm", placeholder: "e.g. 120" },
  ],
}

export const GARMENT_LABELS: Record<GarmentType, string> = {
  general: "General",
  blouse:  "Blouse",
  shirt:   "Shirt / Kurta",
  dress:   "Dress / Gown",
}

/**
 * Garment-Specific Standard Size Chart (Dimensions in CM)
 */
export const GARMENT_STANDARD_SIZES: Record<GarmentType, Record<StandardSize, Record<string, string>>> = {
  general: {
    XS:  { chest: "84", waist: "68", hips: "90", shoulder: "36", sleeve_length: "53", height: "158" },
    S:   { chest: "88", waist: "72", hips: "94", shoulder: "37", sleeve_length: "54", height: "160" },
    M:   { chest: "92", waist: "76", hips: "98", shoulder: "38", sleeve_length: "55", height: "162" },
    L:   { chest: "98", waist: "82", hips: "104", shoulder: "40", sleeve_length: "56", height: "165" },
    XL:  { chest: "104", waist: "88", hips: "110", shoulder: "42", sleeve_length: "57", height: "168" },
    XXL: { chest: "110", waist: "94", hips: "116", shoulder: "44", sleeve_length: "58", height: "170" },
  },
  blouse: {
    XS:  { chest: "80", waist: "64", shoulder: "34", sleeve_length: "36", "custom.armhole": "34", "custom.blouse_length": "38", "custom.neck_depth": "6.5" },
    S:   { chest: "84", waist: "68", shoulder: "35", sleeve_length: "38", "custom.armhole": "36", "custom.blouse_length": "40", "custom.neck_depth": "7" },
    M:   { chest: "88", waist: "72", shoulder: "36", sleeve_length: "40", "custom.armhole": "38", "custom.blouse_length": "42", "custom.neck_depth": "7" },
    L:   { chest: "94", waist: "78", shoulder: "38", sleeve_length: "42", "custom.armhole": "40", "custom.blouse_length": "44", "custom.neck_depth": "7.5" },
    XL:  { chest: "100", waist: "84", shoulder: "40", sleeve_length: "44", "custom.armhole": "42", "custom.blouse_length": "46", "custom.neck_depth": "8" },
    XXL: { chest: "106", waist: "90", shoulder: "42", sleeve_length: "46", "custom.armhole": "44", "custom.blouse_length": "48", "custom.neck_depth": "8.5" },
  },
  shirt: {
    XS:  { chest: "92", shoulder: "39", neck: "36", sleeve_length: "58", "custom.shirt_length": "72" },
    S:   { chest: "96", shoulder: "40.5", neck: "38", sleeve_length: "59", "custom.shirt_length": "74" },
    M:   { chest: "100", shoulder: "42", neck: "39.5", sleeve_length: "60", "custom.shirt_length": "76" },
    L:   { chest: "106", shoulder: "44", neck: "41.5", sleeve_length: "61.5", "custom.shirt_length": "78" },
    XL:  { chest: "112", shoulder: "46", neck: "43.5", sleeve_length: "63", "custom.shirt_length": "80" },
    XXL: { chest: "118", shoulder: "48", neck: "45.5", sleeve_length: "64.5", "custom.shirt_length": "82" },
  },
  dress: {
    XS:  { chest: "82", waist: "64", hips: "88", shoulder: "35", sleeve_length: "53", "custom.dress_length": "115" },
    S:   { chest: "86", waist: "68", hips: "92", shoulder: "36.5", sleeve_length: "54", "custom.dress_length": "118" },
    M:   { chest: "90", waist: "72", hips: "96", shoulder: "38", sleeve_length: "55", "custom.dress_length": "120" },
    L:   { chest: "96", waist: "78", hips: "102", shoulder: "40", sleeve_length: "56.5", "custom.dress_length": "123" },
    XL:  { chest: "102", waist: "84", hips: "108", shoulder: "42", sleeve_length: "58", "custom.dress_length": "126" },
    XXL: { chest: "108", waist: "90", hips: "114", shoulder: "44", sleeve_length: "59.5", "custom.dress_length": "128" },
  },
}
