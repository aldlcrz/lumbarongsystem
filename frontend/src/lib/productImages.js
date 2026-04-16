import { BACKEND_URL } from "./api";
const FALLBACK_IMAGE = "/images/placeholder.png";

const parseImageList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string" && parsed.trim()) return [parsed];
  } catch (error) {}

  if (trimmed.startsWith("[") || trimmed.endsWith("]")) return [];

  return [trimmed];
};

const normalizeImageValue = (value) => {
  if (value && typeof value === 'object' && value.url) {
    return {
      ...value,
      url: normalizeImageValue(value.url)
    };
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${BACKEND_URL}${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, "/").replace(/^\.?\//, "");
  if (normalized.startsWith("uploads/")) {
    return `${BACKEND_URL}/${normalized}`;
  }

  return `/${normalized}`;
};

export function normalizeProductImages(image) {
  return parseImageList(image)
    .map(normalizeImageValue)
    .filter(Boolean);
}

export function normalizeProductSizes(sizes) {
  return parseImageList(sizes).filter(Boolean);
}

export function getProductImageSrc(image, fallback = FALLBACK_IMAGE) {
  const images = normalizeProductImages(image);
  if (images.length === 0) return fallback;
  let first = images[0];
  // Unwrap object wrappers until we get a plain string URL
  while (first && typeof first === 'object' && first.url) {
    first = first.url;
  }
  return (first && typeof first === 'string' && first.trim() !== '') ? first : fallback;
}
