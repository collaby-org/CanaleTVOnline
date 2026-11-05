'use client';
import { useEffect, useState } from 'react';

export function hashSeed(id: number): number {
  return (2654435761 * (id | 0)) >>> 0;
}

export function fakeViewsBase(id: number, base: number, now = Date.now()): number {
  const h = new Date(now).getHours();
  const hourFactor = h >= 18 && h <= 23 ? 1.3 : h >= 12 && h <= 17 ? 1.1 : 0.85;
  const seed = (hashSeed(id) / 4294967296) * 0.5 + 0.75;
  return Math.max(1, Math.round(18 * Math.pow(Math.log10(Math.max(1, base)), 2.2) * hourFactor * seed));
}

export function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 10000) return (n / 10000).toFixed(1) + 'K';
  return n.toLocaleString('ro-RO');
}

export function useFakeViews(channel: { id?: number; views?: number } | string | number) {
  const id = typeof channel === 'object' ? channel.id ?? 0 : Number(channel) || 0;
  const base = typeof channel === 'object' ? channel.views ?? 0 : 0;
  const [value, setValue] = useState(() => fakeViewsBase(id, base));
  useEffect(() => {
    setValue(fakeViewsBase(id, base));
    const t = setInterval(() => {
      setValue((v) => {
        const b = fakeViewsBase(id, base);
        const drift = v + (Math.random() - 0.5) * 0.3 * b;
        return Math.round(Math.max(1, Math.min(2 * b, drift)));
      });
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(t);
  }, [id, base]);
  return { views: value, formatted: formatViews(value) };
}
export { useFakeViews as default };
