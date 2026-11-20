// Форматирование чисел в стиле основной системы: 2 098 241

const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function fmtInt(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n === 0 ? '' : nf0.format(n);
}

export function fmtIntZero(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : nf0.format(n);
}

export function fmtArea(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n === 0 ? '' : nf0.format(Math.round(n));
}

export function fmtAreaExact(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : nf2.format(n);
}

export function fmtText(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Да' : 'Нет';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

/** Подписи уровней навигации кондуктора. */
export const LEVEL_TITLES = {
  region: 'Регионы',
  uk: 'Управляющие компании',
  area: 'Районы',
  city: 'Города',
  settlement: 'Населённые пункты',
  street: 'Улицы',
  house: 'Дома',
  card: 'Дома', // на уровне домов кондуктор возвращает next_level = "card" (карточка дома)
};

/** Человекочитаемые имена полей ответа кондуктора (для карточки дома). */
export const FIELD_LABELS = {
  address: 'Адрес',
  company: 'Управляющая компания',
  company_id: 'ID УК',
  build_years: 'Год постройки',
  floors: 'Этажность',
  entrances: 'Количество подъездов',
  elevators: 'Количество лифтов',
  full_area: 'Общая площадь объекта, м²',
  house_cnt: 'Количество МКД',
  is_our_management: 'Наша УК',
  living_area: 'Площадь жилых помещений, м²',
  nonliving_area: 'Площадь нежилых помещений, м²',
  living_cnt: 'Жилых помещений',
  nonliving_cnt: 'Нежилых помещений',
  mop_area: 'Общая площадь МОП, м²',
  exploitation_year: 'Год ввода в эксплуатацию',
  project_series: 'Серия проекта',
  project_type: 'Тип проекта',
  object_type: 'Тип объекта',
  management_start: 'Дата начала управления',
  management_basis: 'Основание для управления',
  branch: 'Филиал',
  service_type: 'Вид обслуживания',
  billing: 'Биллинг',
  fias: 'Код ФИАС',
  cadastral_number: 'Кадастровый номер',
  cadastral: 'Кадастровый номер',
  fias_id: 'Код ФИАС',
  oktmo: 'ОКТМО',
  region: 'Регион',
  city: 'Город',
  street: 'Улица',
  house: 'Дом',
  building: 'Корпус',
  liter: 'Литера',
  latitude: 'Широта',
  longitude: 'Долгота',
  energy_class: 'Класс энергоэффективности',
  wall_material: 'Материал стен',
  roof_type: 'Тип крыши',
  foundation_type: 'Тип фундамента',
  status: 'Статус',
};

/** Служебные поля, которые не выводим в карточке. */
export const HIDDEN_FIELDS = new Set(['mark', 'next_level', 'next_text', 'next_value', 'buildId', 'build_id', 'id']);

/* ---------- Регистр и длина названий организаций и адресов ----------
 * Кондуктор отдаёт названия УК вперемешку: часть ПРОПИСНЫМИ, часть в обычном регистре.
 * orgCase() приводит их к одному виду: аббревиатуры (ООО, ЖКХ, ПЖРЭП) остаются
 * прописными, длинные написания юр. форм сокращаются, слова КАПСОМ переводятся
 * в обычный регистр; уже смешанный регистр не трогаем.
 */

// Аббревиатуры, которые всегда остаются прописными.
const KEEP_UPPER = new Set([
  'ООО', 'ОАО', 'ЗАО', 'ПАО', 'АО', 'НАО', 'ИП', 'ТСЖ', 'ТСН', 'ЖСК', 'ЖК', 'УК', 'УО', 'УЖК',
  'УЖКХ', 'МУП', 'ГУП', 'МУ', 'МКУ', 'МБУ', 'ГБУ', 'ФКП', 'НП', 'СНТ', 'ПК', 'РКЦ', 'ЖЭУ', 'ЖЭК',
  'ЖКХ', 'ЖКУ', 'КСК', 'ТД', 'НПО', 'ДЕЗ', 'РЭУ', 'РЭО', 'ПЖРЭУ', 'ПЖРЭП', 'ПЖРТ', 'ЦЖКУ', 'ЧОП',
  'ГК', 'СК', 'МКД', 'РФ', 'ХМАО', 'ЯНАО', 'КБ', 'НКО', 'АН', 'ДК', 'ДУК', 'ЕРКЦ',
]);

// Адресные сокращения — всегда строчными.
const LOWER_ABBR = new Set([
  'УЛ', 'Д', 'К', 'КОРП', 'КВ', 'ПР', 'ПР-КТ', 'ПРКТ', 'ПЕР', 'ПРОЕЗД', 'СТР', 'ПЛ', 'Ш', 'МКР',
  'НАБ', 'ТУП', 'ЛИТ', 'ВЛ', 'ПОМ', 'ЭТ', 'Г', 'П', 'С', 'ПГТ', 'РП', 'СТ', 'ОБЛ', 'Р-Н', 'РН',
]);

// Короткие слова, которые встречаются в названиях УК и аббревиатурами не являются.
const COMMON_WORDS = new Set([
  'ДОМ', 'ДОМА', 'ДВОР', 'ГОРОД', 'ЮГ', 'МИР', 'САД', 'СВЕТ', 'ЦЕНТР', 'ПЛЮС', 'ПАРК', 'СТРОЙ',
  'ГРУПП', 'УЮТ', 'НАШ', 'ВАШ', 'МОЙ', 'ТВОЙ', 'ЭРА', 'ГРАД', 'ВЕК', 'ЛЮКС', 'СТИЛЬ', 'ТРЕСТ',
  'ФОНД', 'РАЙ', 'ДЕЛО',
]);

// Внутри кавычек слова названия пишутся с заглавной («Центр Плюс», «Соколиная Гора»),
// кроме родовых и административных слов — они остаются строчными («ДК Приокского района»).
const LOWER_IN_NAME = new Set([
  'РАЙОН', 'РАЙОНА', 'РАЙОНОВ', 'ОКРУГ', 'ОКРУГА', 'ОБЛАСТЬ', 'ОБЛАСТИ', 'КРАЙ', 'КРАЯ',
  'ГОРОДА', 'ПОСЁЛКА', 'ПОСЕЛКА', 'ПОСЕЛЕНИЯ', 'МУНИЦИПАЛЬНОГО', 'ГОРОДСКОГО', 'СЕЛЬСКОГО',
  'ЖИЛОГО', 'ФОНДА', 'ХОЗЯЙСТВА', 'ОБСЛУЖИВАНИЯ', 'ОБСЛУЖИВАНИЮ', 'УПРАВЛЕНИЯ', 'РАЗВИТИЯ',
  'СТРОИТЕЛЬСТВА', 'НЕДВИЖИМОСТИ', 'СОБСТВЕННИКОВ', 'ЖИЛЬЯ', 'ИМЕНИ', 'ИМ', 'ФОНД', 'ФОНДОМ',
  'ЖИЛЫМ', 'ЖИЛЫХ', 'ЖИЛОЙ', 'ДОМОВ', 'ДОМАМИ', 'ОРГАНИЗАЦИЯ', 'ОРГАНИЗАЦИИ',
  'И', 'В', 'НА', 'ПО', 'С', 'ДЛЯ', 'ПРИ',
]);

// Длинные написания юридических форм → аббревиатура (так название помещается на экран).
const LEGAL_FORMS = [
  [/общество\s+с\s+ограниченной\s+ответственностью/gi, 'ООО'],
  [/публичное\s+акционерное\s+общество/gi, 'ПАО'],
  [/закрытое\s+акционерное\s+общество/gi, 'ЗАО'],
  [/открытое\s+акционерное\s+общество/gi, 'ОАО'],
  [/непубличное\s+акционерное\s+общество/gi, 'НАО'],
  [/акционерное\s+общество/gi, 'АО'],
  [/товарищество\s+собственников\s+жилья/gi, 'ТСЖ'],
  [/товарищество\s+собственников\s+недвижимости/gi, 'ТСН'],
  [/жилищно[-\s]строительный\s+кооператив/gi, 'ЖСК'],
  [/жилищный\s+кооператив/gi, 'ЖК'],
  [/управляющая\s+компания/gi, 'УК'],
  [/управляющая\s+организация/gi, 'УО'],
  [/индивидуальный\s+предприниматель/gi, 'ИП'],
  [/муниципальное\s+унитарное\s+предприятие/gi, 'МУП'],
  [/государственное\s+унитарное\s+предприятие/gi, 'ГУП'],
  [/домоуправляющая\s+компания/gi, 'ДК'],
  [/домоук/gi, 'ДК'],
  [/муниципальн(?:ого|ый)\s+район(?:а)?/gi, 'М. Р-Н'],
];

// Описательные хвосты после названия в кавычках — отбрасываем, они не помещаются на экран
// («ООО "Центр плюс" по обслуживанию жилого фонда» → «ООО "Центр Плюс"»).
const TAIL = /(["»"'])\s+по\s+(?:обслуживанию|управлению|содержанию|эксплуатации|ремонту|оказанию)[\s\S]*$/iu;

const VOWELS = /[аеёиоуыэюяaeiouy]/gi;
const isUpper = (w) => w === w.toUpperCase() && w !== w.toLowerCase();
const title = (w) => w[0] + w.slice(1).toLowerCase();

/**
 * Регистр одного слова. Аббревиатуру от обычного слова отличаем по доле гласных:
 * у аббревиатур (ПЖРЭП, МПЖХ, ЮРВ) гласных мало, у слов (ИНВЕСТ, ЖИЛКОМСЕРВИС) — много.
 */
function caseWord(w, nextSep, capitalize, inName) {
  if (!w) return w;
  if (/\d/.test(w)) return w;                        // номера домов, «7А», «ЖЭУ-5»
  const up = w.toUpperCase();
  if (KEEP_UPPER.has(up)) return up;
  // «ул.», «д.» — только как адресные сокращения (точка следом или слово длиннее двух букв),
  // иначе «С» в «ВЕГА-С» превратилось бы в «с».
  if (LOWER_ABBR.has(up) && (/^\s*\./.test(nextSep || '') || w.length >= 3)) return w.toLowerCase();
  if (!isUpper(w)) return w;                         // уже смешанный или строчный регистр
  const lower = w.toLowerCase();
  // аббревиатуру узнаём по доле гласных и длине — она остаётся прописной и внутри названия
  if (!COMMON_WORDS.has(up) && w.length < 6) {
    const vowels = (w.match(VOWELS) || []).length;
    if (vowels === 0) return w;                      // МПЖХ, СЖК, «-В» в «Спецремстрой-В»
    if (vowels / w.length < 0.3) return w;           // ПЖРЭП
    if (w.length <= 4 && vowels <= 1) return w;      // ЮРВ, МК
  }
  // внутри кавычек это имя собственное: с заглавной, кроме родовых слов
  if (inName) return LOWER_IN_NAME.has(up) ? lower : title(w);
  return capitalize ? title(w) : lower;
}

/** Единый регистр для названий УК, адресов и прочих наименований. */
export function orgCase(s) {
  if (typeof s !== 'string' || !s) return s;
  let out = s.trim().replace(/\s+/g, ' ');
  out = out.replace(TAIL, '$1');
  LEGAL_FORMS.forEach(([re, abbr]) => { out = out.replace(re, abbr); });
  const parts = out.split(/([^\p{L}\p{N}]+)/u);
  let capitalize = true;   // первое слово — с заглавной
  let inName = false;      // после первой кавычки начинается собственное название
  return parts.map((part, i) => {
    if (i % 2) return part;                          // разделитель
    const res = caseWord(part, parts[i + 1], capitalize, inName);
    // следующее слово пишем с заглавной после кавычки, скобки, дефиса, точки
    // и после аббревиатуры юр. формы («ООО УК Управление жилым фондом»).
    const sep = parts[i + 1] || '';
    if (/["«»„“']/.test(sep)) inName = true;
    capitalize = KEEP_UPPER.has(part.toUpperCase()) || /[«»"„“'()\[\]\-–—/.:]/.test(sep);
    return res;
  }).join('');
}


/** Поля ответа кондуктора, в которых встречаются названия и адреса. */
const NAME_FIELDS = ['address', 'ADDRESS', 'full_address', 'next_text', 'company', 'company_name', 'UKNAME', 'uk_name', 'region', 'city', 'street'];

/** Приводит названия УК и адреса в ответе API к единому регистру. */
export function normalizeNames(data) {
  if (!data || typeof data !== 'object') return data;
  const fix = (o) => {
    if (!o || typeof o !== 'object') return o;
    NAME_FIELDS.forEach((f) => {
      if (typeof o[f] === 'string') o[f] = orgCase(o[f]);
    });
    return o;
  };
  if (Array.isArray(data.items)) data.items.forEach(fix);
  if (data.house && typeof data.house === 'object') {
    fix(data.house);
    Object.values(data.house).forEach((v) => { if (v && typeof v === 'object') fix(v); });
  }
  return data;
}
