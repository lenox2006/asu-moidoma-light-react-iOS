import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, fs } from '../theme';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const pad = (n) => String(n).padStart(2, '0');
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Календарь на месяц без внешних зависимостей: выбор даты для произвольного периода.
 * value и результат onChange — строка «ГГГГ-ММ-ДД», как ждёт метод analyticsHousingMoving.
 */
export function Calendar({ value, onChange, min, max }) {
  const { theme: t } = useTheme();
  const selected = fromIso(value);
  const [view, setView] = useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const minDate = fromIso(min);
  const maxDate = fromIso(max);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const shift = (first.getDay() + 6) % 7;            // неделя с понедельника
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out = Array(shift).fill(null);
    for (let d = 1; d <= days; d += 1) out.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [view]);

  const shiftMonth = (delta) => setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  const disabled = (d) => (minDate && d < minDate) || (maxDate && d > maxDate);
  const isSelected = (d) => selected && toIso(d) === toIso(selected);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Arrow dir="‹" onPress={() => shiftMonth(-1)} label="Предыдущий месяц" />
        <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.text }}>
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </Text>
        <Arrow dir="›" onPress={() => shiftMonth(1)} label="Следующий месяц" />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={{ flex: 1, textAlign: 'center', fontSize: fs(11), color: t.colors.textSecondary }}>{w}</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 38 }} />;
          const off = disabled(d);
          const active = isSelected(d);
          return (
            <View key={toIso(d)} style={{ width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' }}>
              <Pressable
                onPress={() => !off && onChange(toIso(d))}
                disabled={off}
                accessibilityLabel={toIso(d)}
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: active ? t.colors.accent : 'transparent', opacity: off ? 0.3 : 1,
                }}
              >
                <Text style={{
                  fontSize: fs(14),
                  fontWeight: active ? t.font.weightMedium : '400',
                  color: active ? '#fff' : t.colors.text,
                }}>{d.getDate()}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Arrow({ dir, onPress, label }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8}
      style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.sm, backgroundColor: t.colors.chip }}>
      <Text style={{ fontSize: fs(20), lineHeight: fs(22), color: t.colors.accent }}>{dir}</Text>
    </Pressable>
  );
}
