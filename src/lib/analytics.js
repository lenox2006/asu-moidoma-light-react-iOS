/** Справочники и форматирование для вкладки «Аналитика: движение жилого фонда». */

export const REPORTS = [
  { key: 'summary', label: 'Сводка' },
  { key: 'regions', label: 'Сравнение регионов' },
  { key: 'trend', label: 'Тренд' },
];

export const PERIODS = [
  { key: 'month', title: 'За последний месяц', sub: 'с 1-го числа по конец текущего месяца', step: 'week' },
  { key: 'half_year', title: 'За полгода', sub: '6 месяцев, включая текущий', step: 'month' },
  { key: 'ytd', title: 'С начала года', sub: 'с 1 января по конец текущего месяца', step: 'month' },
  { key: 'year', title: 'За 12 месяцев', sub: '12 месяцев, включая текущий', step: 'month' },
  { key: 'custom', title: 'Произвольный период', sub: 'выбрать даты вручную', step: 'month' },
];

export const STEPS = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'quarter', label: 'Квартал' },
];

/** Метрика динамики: количество домов или их общая площадь. */
export const METRICS = [
  { key: 'houses', label: 'Дома' },
  { key: 'area', label: 'Площадь' },
];

export const periodTitle = (key) => (PERIODS.find((p) => p.key === key) || PERIODS[0]).title;

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const QUARTERS = ['I кв.', 'II кв.', 'III кв.', 'IV кв.'];

/** '2026-11-01' → '01.11.2026' */
export function fmtDate(iso) {
  if (typeof iso !== 'string' || iso.length < 10) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export function periodLabel(period) {
  if (!period) return '';
  const from = fmtDate(period.from);
  const to = fmtDate(period.to);
  return from && to ? `${from} — ${to}` : period.label || '';
}

/** Подпись корзины графика по дате её начала и шагу. */
export function bucketLabel(item, step) {
  const iso = item?.from || '';
  if (iso.length < 10) return String(item?.bucket || '');
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (step === 'week') return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
  if (step === 'quarter') return QUARTERS[Math.floor((m - 1) / 3)] || '';
  return MONTHS[m - 1] + (step === 'month' && m === 1 ? ` ${String(y).slice(2)}` : '');
}

/** Короткое имя региона для подписи под столбиком графика. */
export function shortRegion(name) {
  const s = String(name || '').replace(/\s*(область|край|республика|автономный округ|г\.)\s*/gi, ' ').trim();
  const w = s.split(/\s+/)[0] || String(name || '');
  return w.length > 9 ? `${w.slice(0, 8)}.` : w;
}

const SPACED = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

/** Значение метрики: площадь в м², дома — штуки. */
export function fmtMetric(v, metric) {
  const n = Number(v) || 0;
  return metric === 'area' ? `${SPACED(n)} м²` : `${SPACED(n)} д.`;
}

/** Значение со знаком: «+1 793 м²», «−6 д.», «0». */
export function fmtDelta(v, metric) {
  const n = Number(v) || 0;
  if (n === 0) return metric === 'area' ? '0 м²' : '0 д.';
  const sign = n > 0 ? '+' : '−';
  return `${sign}${fmtMetric(Math.abs(n), metric)}`;
}

/** Компактное значение площади для осей: 25 398 → «25,4». */
export function fmtThousands(v) {
  const n = Math.abs(Number(v) || 0);
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',');
  return String(Math.round(n));
}

/** Поля ответа для выбранной метрики. */
export const metricFields = (metric) => (metric === 'area'
  ? { in: 'area_in', out: 'area_out', delta: 'area_delta', total: 'area_total' }
  : { in: 'houses_in', out: 'houses_out', delta: 'houses_delta', total: 'houses_total' });

/**
 * Чистое изменение за период. Кондуктор не всегда заполняет *_delta согласованно
 * с приходом и уходом, поэтому считаем «пришло − ушло», а *_delta используем,
 * когда движения домов не было (изменение площади уже обслуживаемых домов).
 */
export function netDelta(o, metric) {
  const f = metricFields(metric);
  const inV = Number(o?.[f.in]) || 0;
  const outV = Number(o?.[f.out]) || 0;
  if (inV !== 0 || outV !== 0) return inV - outV;
  return Number(o?.[f.delta]) || 0;
}

/**
 * Список из ответа кондуктора: он отдаёт коллекции то массивом, то объектом
 * с числовыми ключами ({"0": {...}}), поэтому приводим к массиву всегда.
 */
export function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}

/** Все УК из ответа одним списком (кондуктор отдаёт их внутри регионов). */
export function flattenUks(groups) {
  const out = [];
  toArray(groups).forEach((g) => {
    toArray(g && g.top_uks).forEach((uk) => {
      out.push({ ...uk, region: g.name, regionId: g.id, key: `${g.id}:${uk.id}` });
    });
  });
  return out;
}
