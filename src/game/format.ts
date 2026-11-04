export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(2)} Md €`;
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(2)} M €`;
  if (a >= 1e4) return `${sign}${(a / 1e3).toFixed(1)} k €`;
  return `${sign}${Math.floor(a).toLocaleString('fr-FR')} €`;
}

export function num(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
  if (a >= 1e4) return `${(n / 1e3).toFixed(1)} k`;
  return Math.floor(n).toLocaleString('fr-FR');
}

export function duration(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h} h ${m.toString().padStart(2, '0')} min`;
  if (m) return `${m} min ${r.toString().padStart(2, '0')} s`;
  return `${r} s`;
}

export const ratingClass = (r: number) =>
  r >= 80 ? 'r-elite' : r >= 65 ? 'r-good' : r >= 50 ? 'r-mid' : r >= 35 ? 'r-low' : 'r-poor';
