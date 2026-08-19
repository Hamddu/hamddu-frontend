const AVATAR_COLORS = [
  { backgroundColor: "#FFE8D8", color: "#C7521A" },
  { backgroundColor: "#E8EEFF", color: "#4263C7" },
  { backgroundColor: "#E3F5EC", color: "#287A57" },
  { backgroundColor: "#F2E9FF", color: "#7452A8" },
  { backgroundColor: "#FFE8F0", color: "#B94A73" },
  { backgroundColor: "#FFF1C9", color: "#8A6518" },
  { backgroundColor: "#DFF4F5", color: "#27757A" },
] as const;

export function getAvatarColors(seed?: string | null) {
  const value = seed || "anonymous";
  const hash = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
