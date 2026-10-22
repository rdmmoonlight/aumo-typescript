export const formatNumber = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Math.abs(n));
export const formatNumberWithParen = (amount: number) => {
  const f = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return amount < 0 ? `(${f})` : f;
};
export const formatDateDisplay = (s: string) =>
  !s
    ? "-"
    : new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(s));
export const formatDateTimeDisplay = (s?: string) => {
  if (!s) return null;
  const d = new Date(s);
  return `${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
