/** Разбор ответа getHouseById (логика идентична веб-версии). */
import { BILLING, dict, MANAGEMENT_TYPE, UK_BRANCH } from './dictionaries';
import { fmtAreaExact, fmtIntZero, fmtText, orgCase } from './format';

export function flatten(obj, prefix = '', out = {}) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = v;
  });
  return out;
}
function findKey(obj, key) {
  const want = key.toLowerCase(); const keys = Object.keys(obj);
  return keys.find((k) => k.toLowerCase() === want) || keys.find((k) => k.toLowerCase().endsWith(`.${want}`)) || null;
}
export function pick(sources, ...keys) {
  for (const obj of sources) {
    if (!obj) continue;
    for (const k of keys) {
      const real = findKey(obj, k);
      if (real !== null) { const v = obj[real]; if (v !== undefined && v !== null && v !== '') return v; }
    }
  }
  return null;
}
const num = (v) => { if (v == null || v === '') return null; const n = Number(String(v).replace(',', '.')); return Number.isNaN(n) ? null : n; };
export function fmtDate(v) {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('ru-RU');
}
export function fmtYear(v) {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  if (/^\d{4}$/.test(s)) return s;
  let m = s.match(/^(\d{4})-\d{2}-\d{2}/); if (m) return m[1];
  m = s.match(/^\d{2}\.\d{2}\.(\d{4})/); if (m) return m[1];
  const d = new Date(s); return Number.isNaN(d.getTime()) ? s : String(d.getFullYear());
}
export function splitAddress(address) {
  if (!address) return { short: '', city: '' };
  const parts = String(address).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return { short: address, city: '' };
  return { short: parts.slice(-2).join(', '), city: parts.slice(0, -2).join(', ') };
}

/** Собирает все поля карточки из ответа getHouseById (приоритет) и строки списка. */
export function buildCardModel(cardHouse, listRow) {
  const src = [flatten(cardHouse || {}), listRow || {}];
  const livingArea = num(pick(src, 'LIVINGAREA'));
  const nonLivingArea = num(pick(src, 'NONLIVINGAREA'));
  const mop = num(pick(src, 'MOP', 'mop_area', 'MOPAREA'));
  const basis = pick(src, 'BASIS_MANAGEMENT', 'MAINTENANCE_BASIS', 'management_basis');
  const companyValue = pick(src, 'UKNAME', 'company', 'company_name', 'uk_name');
  const address = orgCase(pick(src, 'address', 'full_address', 'ADDRESS'));
  return {
    address,
    ...splitAddress(address),
    company: typeof companyValue === 'string' ? orgCase(companyValue.replace(/^\[[^\]]*\]\s*/, '')) : companyValue,
    floors: fmtText(pick(src, 'minLevels', 'floors', 'FLOORS')),
    entrances: fmtIntZero(pick(src, 'ENTRANCE_COUNT', 'entrances', 'ENTRANCES')),
    elevators: fmtIntZero(pick(src, 'ELEVATOR_COUNT', 'elevators', 'ELEVATORS')),
    flats: fmtIntZero(pick(src, 'FLATS')),
    livingArea: fmtAreaExact(livingArea),
    nonFlats: fmtIntZero(pick(src, 'NonFlats')),
    nonLivingArea: fmtAreaExact(nonLivingArea),
    totalArea: fmtAreaExact(livingArea === null && nonLivingArea === null && mop === null ? null : (livingArea || 0) + (nonLivingArea || 0) + (mop || 0)),
    premisesArea: fmtAreaExact(livingArea === null && nonLivingArea === null ? null : (livingArea || 0) + (nonLivingArea || 0)),
    mopArea: fmtAreaExact(mop),
    maintenanceStart: fmtDate(pick(src, 'MAINTENANCE_ENTRYDATE')),
    managementType: fmtText(dict(MANAGEMENT_TYPE, pick(src, 'management_type_id', 'MANAGEMENT_TYPE_ID'))),
    basis: basis == null || basis === '' ? 'Не определено' : fmtText(basis),
    branch: fmtText(dict(UK_BRANCH, pick(src, 'UK_BRANCH_ID', 'uk_branch_id'))),
    buildYear: fmtText(pick(src, 'build_years', 'BUILDYEAR', 'build_year', 'BUILDDATE')),
    entryYear: fmtYear(pick(src, 'buildEntryDate')),
    projectSeries: fmtText(pick(src, 'PROJECT_SERIES', 'project_series')),
    projectType: fmtText(pick(src, 'PROJECT_TYPE', 'project_type')),
    objectType: pick(src, 'OBJECTTYPE', 'object_type', 'HOUSETYPE') || 'МКД',
    billing: fmtText(dict(BILLING, pick(src, 'BILLING_ID', 'billing_id'))),
  };
}
