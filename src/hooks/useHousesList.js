import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { orgCase } from '../lib/format';

export const UK_TABS = [['our', 'Обслуживаемые'], ['gone', 'Ушедшие'], ['foreign', 'Сторонние'], ['all', 'Все УК']];

export function ukStatus(row) {
  const m = typeof row.company === 'string' ? row.company.match(/^\[([^\]]*)\]/) : null;
  if (!m) return 'our';
  const t = m[1].toLowerCase();
  if (t.startsWith('ушед')) return 'gone';
  if (t.startsWith('сторон')) return 'foreign';
  return 'other';
}
export const isHouseRow = (row, level) => row.next_level === 'house' || row.next_level === 'card' || !row.next_level
  || row.build_id !== undefined || row.buildId !== undefined || level === 'house' || level === 'card';
export const cleanName = (s) => (typeof s === 'string' ? orgCase(s.replace(/^\[[^\]]*\]\s*/, '')) : s);

/** Загрузка уровня по mark + поиск, вкладки статуса УК, итоги. */
export function useHousesList(mark) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ukTab, setUkTab] = useState('our');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.houses(mark).then((d) => !cancelled && setData(d)).catch((e) => !cancelled && setError(e.message)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [mark, reload]);

  const level = data?.level || null;
  const items = data?.items || [];
  const isUk = level === 'uk';
  const isHouses = level === 'house' || level === 'card';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = items;
    if (isUk && ukTab !== 'all') rows = rows.filter((r) => ukStatus(r) === ukTab);
    if (!q) return rows;
    return rows.filter((r) => [r.address, r.company, r.next_text, r.build_years].filter((v) => v != null).some((v) => String(v).toLowerCase().includes(q)));
  }, [items, search, isUk, ukTab]);

  const counts = useMemo(() => {
    const c = { our: 0, gone: 0, foreign: 0, other: 0, all: items.length };
    if (isUk) items.forEach((r) => { c[ukStatus(r)] += 1; });
    return c;
  }, [items, isUk]);

  const totals = useMemo(() => filtered.reduce((t, r) => ({ mkd: t.mkd + (Number(r.house_cnt) || 0), area: t.area + (Number(r.full_area) || 0) }), { mkd: 0, area: 0 }), [filtered]);

  return { data, level, items, filtered, counts, totals, isUk, isHouses, loading, error, search, setSearch, ukTab, setUkTab, retry: () => setReload((n) => n + 1) };
}
