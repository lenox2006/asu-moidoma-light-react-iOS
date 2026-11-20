/**
 * Справочники кондуктора для карточки МКД (getHouseById).
 * Значение поля — id, в карточке показываем name.
 */

/** Вид обслуживания — поле management_type_id */
export const MANAGEMENT_TYPE = {
    1: 'В лицензии',
    2: 'На обслуживании',
    3: 'Не наш',
};

/** Расчётный центр (Биллинг) — поле BILLING_ID */
export const BILLING = {
    1: 'Домовой',
    2: 'Домовой (Частично)',
    3: 'Сторонний РКЦ',
};

/** Филиал — поле UK_BRANCH_ID. Справочник пока не предоставлен: добавьте пары id → name. */
export const UK_BRANCH = {
    // 1: 'Название филиала',
};

/** Перевод id → name; если id нет в справочнике — показываем как есть. */
export function dict(map, value) {
    if (value === null || value === undefined || value === '') return null;
    const key = String(value).trim();
    return map[key] ?? map[Number(key)] ?? key;
}
