import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, fs } from '../theme';

/* ---------- Иконки (stroke, currentColor через props.color) ---------- */
const S = ({ size = 24, color, children, sw = 1.8 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</Svg>
);
export const Icon = {
  back: (c) => <S color={c} size={26} sw={2.2}><Path d="M15 5l-7 7 7 7" /></S>,
  chevron: (c) => <S color={c} size={20} sw={2}><Path d="M9 6l6 6-6 6" /></S>,
  search: (c) => <S color={c} size={20}><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></S>,
  filter: (c) => <S color={c} size={22}><Path d="M4 6h16" /><Path d="M7 12h10" /><Path d="M10 18h4" /></S>,
  plus: (c) => <S color={c} size={22} sw={2.2}><Path d="M12 5v14" /><Path d="M5 12h14" /></S>,
  close: (c) => <S color={c} size={14} sw={2.4}><Path d="M6 6l12 12" /><Path d="M18 6L6 18" /></S>,
  check: (c) => <S color={c} size={22} sw={2.4}><Path d="M5 12l5 5L20 7" /></S>,
  home: (c) => <S color={c}><Path d="M3 11 12 4l9 7" /><Path d="M5 10v10h14V10" /><Path d="M10 20v-6h4v6" /></S>,
  users: (c) => <S color={c}><Circle cx="9" cy="8" r="3.5" /><Path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><Circle cx="17" cy="9" r="2.5" /><Path d="M16 14.5c3 0 5.5 2 5.5 5" /></S>,
  person: (c) => <S color={c}><Circle cx="12" cy="8" r="4" /><Path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></S>,
  logout: (c) => <S color={c} size={22}><Path d="M10 4H5v16h5" /><Path d="M14 8l4 4-4 4" /><Path d="M18 12H9" /></S>,
  alert: (c) => <S color={c}><Circle cx="12" cy="12" r="9" /><Path d="M12 8v5" /><Path d="M12 16h.01" /></S>,
  empty: (c) => <S color={c} size={48} sw={1.5}><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /><Path d="M8 11h6" /></S>,
  palette: (c) => <S color={c} size={22}><Circle cx="12" cy="12" r="9" /><Circle cx="8.5" cy="10" r="1.2" /><Circle cx="12" cy="7.5" r="1.2" /><Circle cx="15.5" cy="10" r="1.2" /><Path d="M12 21a3 3 0 0 1 0-6h2a2 2 0 0 0 0-4" /></S>,
};
export const LogoMark = ({ size = 40, color = '#3863D2' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100"><Path d="M22 50 50 24 78 50" stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M30 50v26M70 50v26" stroke="#fff" strokeWidth="11" strokeLinecap="round" /><Path d="M26 74a24 18 0 0 0 48 0" stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round" />
    <Path d="M40 54l10 9 10-9" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M0 0h100v100H0z" fill={color} opacity="0" /></Svg>
);

/* ---------- Навигационная панель ---------- */
export function NavBar({ title, subtitle, onBack, right, children, brand }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: t.colors.surface, paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: t.colors.line, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 6, paddingVertical: 2 }}>
        {onBack ? <Pressable onPress={onBack} hitSlop={8} style={{ width: 44, height: 44, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Назад">{Icon.back(t.colors.accent)}</Pressable> : null}
        {brand ? <View style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}><LogoMark size={30} color={t.colors.accent} /></View> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={{ fontSize: fs(brand ? t.size.h2 : t.size.title), lineHeight: fs((brand ? t.size.h2 : t.size.title) * 1.22), fontWeight: t.font.weightBold, color: brand ? t.colors.brandTitle : t.colors.navTitle }}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={{ fontSize: fs(t.size.sub), lineHeight: fs(t.size.sub * 1.3), color: t.colors.textSecondary, marginTop: 1 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function IconButton({ icon, onPress, filled, badge, disabled, label }) {
  const { theme: t } = useTheme();
  const color = filled ? '#fff' : t.colors.accent;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={({ pressed }) => ({
      width: 44, height: 44, borderRadius: t.key === 'md24' ? 22 : t.radius.sm, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      backgroundColor: filled ? t.colors.accent : t.key === 'md24' ? t.colors.chip : t.colors.surface,
      borderWidth: t.key === 'md24' ? 0 : 1, borderColor: t.colors.fieldBorder,
    })}>
      {Icon[icon](color)}
      {badge ? <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}><Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '700' }}>{badge}</Text></View> : null}
    </Pressable>
  );
}

/* ---------- Поле поиска ---------- */
export function SearchField({ value, onChangeText, placeholder = 'Поиск' }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.colors.textMuted} autoCorrect={false} clearButtonMode="while-editing" returnKeyType="search"
        style={{ height: 46, borderWidth: 1, borderColor: t.colors.fieldBorder, borderRadius: t.radius.sm, paddingLeft: 14, paddingRight: 44, backgroundColor: t.colors.field, color: t.colors.text, fontSize: fs(t.size.body)}} />
      <View style={{ position: 'absolute', right: 14 }}>{Icon.search(t.key === 'md24' ? t.colors.textSecondary : t.colors.accent)}</View>
    </View>
  );
}

/* ---------- Сегмент / чип ---------- */
export function Segment({ label, active, onPress }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ height: 34, paddingHorizontal: 14, borderRadius: t.radius.chip, justifyContent: 'center', marginRight: 8,
      backgroundColor: active ? t.colors.accent : t.colors.chip, borderWidth: t.key === 'md24' ? 0 : 1, borderColor: active ? t.colors.accent : t.colors.accent40 }}>
      <Text style={{ fontSize: fs(13), fontWeight: active ? t.font.weightMedium : '500', color: active ? '#fff' : t.colors.text }}>{label}</Text>
    </Pressable>
  );
}
export function Crumb({ label, current, onPress }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={current} style={{ height: 30, maxWidth: 240, paddingHorizontal: 12, borderRadius: t.radius.chip, justifyContent: 'center', marginRight: 6,
      backgroundColor: current ? (t.key === 'md24' ? t.colors.accentBg : t.colors.accent) : (t.key === 'md24' ? t.colors.chip : t.colors.tagBg) }}>
      <Text numberOfLines={1} style={{ fontSize: fs(13), fontWeight: '600', color: current ? (t.key === 'md24' ? t.colors.accent : '#fff') : (t.key === 'md24' ? t.colors.textSecondary : t.colors.tagFg) }}>{label}</Text>
    </Pressable>
  );
}
export function Tag({ label, tone = 'default' }) {
  const { theme: t } = useTheme();
  const map = { default: [t.colors.chip, t.colors.textSecondary], accent: [t.colors.tagBg, t.colors.tagFg], ok: [t.colors.greenBg, t.colors.green], muted: [t.colors.line, t.colors.textSecondary] };
  const [bg, fg] = map[tone] || map.default;
  if (t.key === 'asu' && tone === 'default') return <View style={{ backgroundColor: '#eef2f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 }}><Text style={{ fontSize: fs(12), color: '#3d4756' }}>{label}</Text></View>;
  return <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 }}><Text style={{ fontSize: fs(12), fontWeight: '500', color: fg }}>{label}</Text></View>;
}

/* ---------- Карточка / строка списка ---------- */
export function Card({ children, style }) {
  const { theme: t } = useTheme();
  return <View style={[{ backgroundColor: t.colors.surface, borderRadius: t.radius.card, padding: 16, borderWidth: t.card.borderWidth, borderColor: t.card.borderColor, gap: 12 }, style]}>{children}</View>;
}
export function CardHead({ children }) {
  const { theme: t } = useTheme();
  return <Text style={{ fontSize: fs(t.key === 'md24' ? 17 : 15), fontWeight: t.font.weightMedium, color: t.colors.cardHead, paddingBottom: 8, borderBottomWidth: t.key === 'md24' ? 1 : 2, borderBottomColor: t.colors.cardHeadLine }}>{children}</Text>;
}
export function Row({ onPress, left, title, subtitle, tags, meta, right }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? t.colors.accentBg : t.colors.surface, borderRadius: t.radius.card, padding: 14, paddingLeft: 16, borderWidth: t.card.borderWidth, borderColor: t.card.borderColor, minHeight: 66 })}>
      {left}
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text style={{ fontSize: fs(t.size.body), fontWeight: t.font.weightMedium, color: t.colors.text, lineHeight: fs(t.size.body * 1.3)}}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: fs(t.size.sub), color: t.colors.textSecondary }} numberOfLines={1}>{subtitle}</Text> : null}
        {meta ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{meta.map((m, i) => <Text key={i} style={{ fontSize: fs(t.size.sub), color: t.colors.textSecondary }}>{m[0]}: <Text style={{ color: t.colors.text, fontWeight: t.font.weightMedium }}>{m[1]}</Text></Text>)}</View> : null}
        {tags ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{tags.map((g, i) => <Tag key={i} label={g[0]} tone={g[1]} />)}</View> : null}
      </View>
      {right !== undefined ? right : Icon.chevron(t.colors.textMuted)}
    </Pressable>
  );
}
export function Avatar({ text, size = 44 }) {
  const { theme: t } = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.tagBg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.colors.tagFg, fontWeight: '700', fontSize: fs(size * 0.34)}}>{text}</Text></View>;
}

/* ---------- Поле карточки (только чтение) и поле ввода ---------- */
export function Field({ label, value, style }) {
  const { theme: t } = useTheme();
  const empty = value == null || value === '' || value === '—';
  return (
    <View style={[{ gap: 4, justifyContent: 'flex-end' }, style]}>
      <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{label}</Text>
      <View style={{ backgroundColor: t.key === 'md24' ? t.colors.bg : '#eef2f6', borderRadius: t.radius.sm, paddingHorizontal: 14, paddingVertical: 12, minHeight: 46, justifyContent: 'center' }}>
        <Text style={{ fontSize: fs(t.size.body), fontWeight: empty ? '400' : t.font.weightMedium, color: empty ? t.colors.textMuted : t.colors.text }}>{empty ? '—' : String(value)}</Text>
      </View>
    </View>
  );
}
export const Input = React.forwardRef(function Input({ label, error, hint, ...props }, ref) {
  const { theme: t } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontSize: fs(13), color: t.colors.textSecondary }}>{label}</Text> : null}
      <TextInput ref={ref} placeholderTextColor={t.colors.textMuted} autoCorrect={false} {...props}
        style={{ height: 50, borderWidth: 1, borderColor: error ? t.colors.red : t.colors.fieldBorder, borderRadius: t.radius.sm, paddingHorizontal: 14, backgroundColor: t.colors.field, color: t.colors.text, fontSize: fs(t.size.body)}} />
      {error ? <Text style={{ fontSize: fs(12), color: t.colors.red }}>{error}</Text> : hint ? <Text style={{ fontSize: fs(12), color: t.colors.textSecondary, lineHeight: fs(16)}}>{hint}</Text> : null}
    </View>
  );
});

/* ---------- Кнопки ---------- */
export function Button({ title, onPress, variant = 'primary', disabled, small, style }) {
  const { theme: t } = useTheme();
  const v = {
    primary: { bg: t.colors.accent, fg: '#fff', border: t.colors.accent },
    outline: { bg: t.colors.surface, fg: t.colors.accent, border: t.key === 'md24' ? t.colors.accent : t.colors.fieldBorder },
    danger: { bg: t.colors.surface, fg: t.colors.red, border: t.key === 'md24' ? t.colors.red : '#f1c6c4' },
    dangerFilled: { bg: t.colors.red, fg: '#fff', border: t.colors.red },
    text: { bg: 'transparent', fg: t.colors.accent, border: 'transparent' },
  }[variant];
  const h = small ? 40 : t.btn.height;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ height: h, paddingHorizontal: small ? 16 : 20, borderRadius: t.btn.pill ? h / 2 : t.radius.btn, backgroundColor: disabled && variant === 'primary' ? t.colors.disabled : v.bg, borderWidth: 1, borderColor: v.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : disabled && variant !== 'primary' ? 0.5 : 1 }, style]}>
      <Text style={{ fontSize: fs(small ? 15 : t.size.body), fontWeight: t.font.weightMedium, color: disabled && variant === 'primary' ? t.colors.textSecondary : v.fg }}>{title}</Text>
    </Pressable>
  );
}
export function Switch({ value, onValueChange, disabled }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={() => !disabled && onValueChange(!value)} style={{ width: 52, height: 32, borderRadius: 16, backgroundColor: value ? t.colors.accent : t.colors.gray, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', marginLeft: value ? 23 : 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }} />
    </Pressable>
  );
}

/* ---------- Состояния ---------- */
export function Loading({ text = 'Загрузка данных' }) {
  const { theme: t } = useTheme();
  return <View style={{ padding: 32, alignItems: 'center', gap: 12 }}><ActivityIndicator color={t.colors.accent} /><Text style={{ color: t.colors.textSecondary, fontSize: fs(t.size.sub)}}>{text}</Text></View>;
}
export function EmptyState({ title = 'Ничего не найдено', text = 'Измените запрос или сбросьте фильтр', action }) {
  const { theme: t } = useTheme();
  return <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>{Icon.empty(t.colors.textMuted)}<Text style={{ fontSize: fs(t.size.body), fontWeight: t.font.weightMedium, color: t.colors.text }}>{title}</Text>{text ? <Text style={{ fontSize: fs(13), color: t.colors.textSecondary, textAlign: 'center' }}>{text}</Text> : null}{action}</Card>;
}
export function ErrorCard({ message, onRetry }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.redBg, borderRadius: t.radius.card, padding: 16, flexDirection: 'row', gap: 12, borderWidth: t.key === 'asu' ? 1 : 0, borderColor: '#f1c6c4' }}>
      {Icon.alert(t.colors.red)}
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.red }}>Внешний сервис недоступен</Text>
        <Text style={{ fontSize: fs(13), color: t.colors.text, lineHeight: fs(18)}}>{message || 'Не удалось получить данные. Проверьте соединение и повторите попытку.'}</Text>
        {onRetry ? <Button title="Повторить" variant="dangerFilled" small onPress={onRetry} style={{ alignSelf: 'flex-start', marginTop: 4 }} /> : null}
      </View>
    </View>
  );
}

/* ---------- Нижняя шторка ---------- */
export function Sheet({ visible, onClose, title, headerRight, children, footer }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.colors.backdrop }} onPress={onClose} />
      <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: t.radius.sheet, borderTopRightRadius: t.radius.sheet, paddingBottom: insets.bottom + 16, maxHeight: '85%' }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.gray, alignSelf: 'center', marginTop: 10, marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: fs(20), fontWeight: t.font.weightBold, color: t.colors.text }}>{title}</Text>{headerRight}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>{footer}</View> : null}
      </View>
    </Modal>
  );
}
export function SheetOption({ label, count, selected, onPress }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: t.colors.line }}>
      <Text style={{ fontSize: fs(t.size.body), fontWeight: selected ? t.font.weightMedium : '400', color: selected && t.key === 'md24' ? t.colors.accent : t.colors.text }}>{label}{count != null ? <Text style={{ color: t.colors.textMuted }}> · {count}</Text> : null}</Text>
      {selected ? Icon.check(t.colors.accent) : null}
    </Pressable>
  );
}

export const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 16, gap: 10 } });
