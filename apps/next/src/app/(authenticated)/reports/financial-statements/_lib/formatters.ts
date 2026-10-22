export const formatNumber = (n: number) => {
  const f = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  return n < 0 ? `(${f})` : f;
};

export const formatDateDisplay = (s?: string) =>
  !s
    ? ""
    : new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(s));
