import { api } from "@/lib/api";

export const getCategoryName = (category) => {
  if (typeof category === "string") return category.trim();
  if (category && typeof category.name === "string") return category.name.trim();
  return "";
};

export const normalizeCategories = (categories) => {
  if (!Array.isArray(categories)) return [];

  return Array.from(new Set(categories.map(getCategoryName).filter(Boolean)));
};

export const fetchCategories = async () => {
  const res = await api.get("/categories");
  return Array.isArray(res.data) ? res.data : [];
};
