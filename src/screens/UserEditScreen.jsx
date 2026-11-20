import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../api/client';
import { Button, Card, ErrorCard, Icon, Input, Loading, NavBar, Sheet, SheetOption, Switch } from '../components/ui';
import { cleanName } from '../hooks/useHousesList';
import { useAuth } from '../lib/auth';
import { orgCase } from '../lib/format';
import { useTheme, fs } from '../theme';

const EMPTY = { login: '', name: '', password: '', role: 'user', regions: [], uks: [], is_active: true };

/** Чипы выбранных значений + кнопка добавления (мультивыбор регионов / УК). */
function Picker({ label, chips, onRemove, onAdd, addLabel, hint, error, disabled }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: fs(13), color: t.colors.textSecondary }}>{label}</Text>
      <View style={{ borderWidth: 1, borderColor: error ? t.colors.red : t.colors.fieldBorder, borderRadius: t.radius.sm, backgroundColor: t.colors.field, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {chips.map((c) => (
          <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', height: 34, paddingLeft: 12, paddingRight: 4, borderRadius: t.radius.chip, backgroundColor: t.key === 'md24' ? t.colors.surface : t.colors.tagBg, borderWidth: t.key === 'md24' ? 1 : 0, borderColor: t.colors.gray, maxWidth: '100%' }}>
            <Text numberOfLines={1} style={{ fontSize: fs(14), fontWeight: '500', color: t.key === 'md24' ? t.colors.text : t.colors.tagFg, flexShrink: 1 }}>{c.label}</Text>
            <Pressable onPress={() => onRemove(c)} hitSlop={6} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>{Icon.close(t.colors.textSecondary)}</Pressable>
          </View>
        ))}
        <Pressable onPress={onAdd} disabled={disabled} style={{ height: 34, paddingHorizontal: 14, borderRadius: t.radius.chip, backgroundColor: t.colors.accentBg, justifyContent: 'center', opacity: disabled ? 0.5 : 1, borderWidth: t.key === 'asu' ? 1 : 0, borderColor: t.colors.fieldBorder, borderStyle: 'dashed' }}>
          <Text style={{ fontSize: fs(14), fontWeight: '600', color: t.colors.accent }}>+ {addLabel}</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: fs(12), color: error ? t.colors.red : t.colors.textSecondary, lineHeight: fs(16)}}>{error || hint}</Text>
    </View>
  );
}

export default function UserEditScreen({ navigation, route }) {
  const id = route.params?.id ?? null;
  const isNew = id == null;
  const { user: me } = useAuth();
  const { theme: t } = useTheme();
  const isSelf = !isNew && me && String(me.id) === String(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null);
  const [q, setQ] = useState('');

  const [regionOptions, setRegionOptions] = useState([]);
  const [ukCache, setUkCache] = useState({});
  const [optLoading, setOptLoading] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    api.users().then((list) => {
      if (cancelled) return;
      const u = (Array.isArray(list) ? list : list.data || []).find((x) => String(x.id) === String(id));
      if (!u) { setError('Пользователь не найден'); return; }
      setForm({ login: u.login, name: u.name, password: '', role: u.role, regions: u.regions || [], uks: u.uks || [], is_active: Boolean(u.is_active) });
    }).catch((e) => !cancelled && setError(e.message)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    api.houses('').then((d) => !cancelled && setRegionOptions((d.items || []).map((r) => ({ id: String(r.next_value), name: r.next_text || r.address, mark: r.mark })))).catch((e) => !cancelled && setError(`Не удалось загрузить регионы: ${e.message}`));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const missing = form.regions.map((r) => regionOptions.find((o) => o.id === String(r.id))).filter((o) => o && !ukCache[o.id]);
    if (!missing.length) return undefined;
    let cancelled = false;
    setOptLoading(true);
    Promise.all(missing.map((o) => api.houses(o.mark).then((d) => [o.id, (d.items || []).map((u) => ({ id: Number(u.next_value ?? u.company_id), name: cleanName(u.company || u.next_text || ''), region_id: o.id, region_name: o.name }))])))
      .then((pairs) => !cancelled && setUkCache((prev) => { const n = { ...prev }; pairs.forEach(([k, v]) => { n[k] = v; }); return n; }))
      .catch((e) => !cancelled && setError(`Не удалось загрузить УК: ${e.message}`)).finally(() => !cancelled && setOptLoading(false));
    return () => { cancelled = true; };
  }, [form.regions, regionOptions, ukCache]);

  const ukOptions = useMemo(() => form.regions.flatMap((r) => ukCache[String(r.id)] || []), [form.regions, ukCache]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k) => (errors[k] ? errors[k][0] : '');

  const toggleRegion = (o) => setForm((f) => {
    const has = f.regions.some((r) => String(r.id) === o.id);
    const regions = has ? f.regions.filter((r) => String(r.id) !== o.id) : [...f.regions, { id: o.id, name: o.name }];
    const ids = new Set(regions.map((r) => String(r.id)));
    return { ...f, regions, uks: f.uks.filter((u) => ids.has(String(u.region_id))) };
  });
  const ukKey = (u) => `${u.region_id}:${u.id}`;
  const toggleUk = (o) => setForm((f) => ({ ...f, uks: f.uks.some((u) => ukKey(u) === ukKey(o)) ? f.uks.filter((u) => ukKey(u) !== ukKey(o)) : [...f.uks, { id: o.id, name: o.name, region_id: o.region_id }] }));

  async function save() {
    setSaving(true); setErrors({}); setError('');
    const payload = { login: form.login.trim(), name: form.name.trim(), role: form.role, is_active: Boolean(form.is_active),
      regions: form.role === 'user' ? form.regions.map((r) => ({ id: String(r.id), name: r.name || '' })) : [],
      uks: form.role === 'user' ? form.uks.map((u) => ({ id: Number(u.id), name: u.name || '', region_id: String(u.region_id) })) : [] };
    if (form.password) payload.password = form.password;
    try { if (isNew) await api.createUser(payload); else await api.updateUser(id, payload); navigation.goBack(); }
    catch (e) { if (e.errors) setErrors(e.errors); setError(e.errors ? Object.values(e.errors).flat()[0] || '' : e.message); }
    finally { setSaving(false); }
  }
  function remove() {
    Alert.alert('Удалить пользователя?', `«${form.login}» будет удалён без возможности восстановления.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => { try { await api.deleteUser(id); navigation.goBack(); } catch (e) { setError(e.message); } } },
    ]);
  }

  const qq = q.trim().toLowerCase();
  const sheetItems = sheet === 'regions'
    ? regionOptions.filter((o) => !qq || o.name.toLowerCase().includes(qq)).map((o) => ({ key: o.id, label: o.name, selected: form.regions.some((r) => String(r.id) === o.id), onPress: () => toggleRegion(o) }))
    : ukOptions.filter((o) => !qq || o.name.toLowerCase().includes(qq) || o.region_name.toLowerCase().includes(qq)).map((o) => ({ key: ukKey(o), label: orgCase(o.name), group: orgCase(o.region_name), selected: form.uks.some((u) => ukKey(u) === ukKey(o)), onPress: () => toggleUk(o) }));
  let lastGroup = null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar title={isNew ? 'Новый пользователь' : form.name || '…'} subtitle={isNew ? 'Создание учётной записи' : 'Редактирование пользователя'} onBack={() => navigation.goBack()}
        right={<Button title={saving ? '…' : 'Сохранить'} small onPress={save} disabled={saving || loading} />} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: fs(13), fontWeight: '600', color: t.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Учётная запись</Text>
          <Input label="Логин" value={form.login} onChangeText={(v) => set('login', v)} autoCapitalize="none" error={err('login')} />
          <Input label="Имя" value={form.name} onChangeText={(v) => set('name', v)} error={err('name')} />
          <Input label={isNew ? 'Пароль' : 'Новый пароль (пусто — не менять)'} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry error={err('password')} />
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: fs(13), color: t.colors.textSecondary }}>Роль</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[['user', 'Пользователь'], ['superadmin', 'superadmin']].map(([k, l]) => (
                <Pressable key={k} disabled={isSelf} onPress={() => set('role', k)} style={{ flex: 1, height: 44, borderRadius: t.radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: form.role === k ? t.colors.accent : t.colors.field, borderWidth: 1, borderColor: form.role === k ? t.colors.accent : t.colors.fieldBorder, opacity: isSelf ? 0.6 : 1 }}>
                  <Text style={{ fontWeight: '500', color: form.role === k ? '#fff' : t.colors.text }}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {form.role === 'user' ? (
            <>
              <Text style={{ fontSize: fs(13), fontWeight: '600', color: t.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>Область видимости</Text>
              <Picker label="Регионы" addLabel="Регион" chips={form.regions.map((r) => ({ key: String(r.id), label: r.name || r.id, o: { id: String(r.id), name: r.name } }))} onRemove={(c) => toggleRegion(c.o)} onAdd={() => { setQ(''); setSheet('regions'); }} hint="Пользователь видит все перечисленные регионы." error={err('regions')} />
              <Picker label="Управляющие компании" addLabel="УК" disabled={!form.regions.length} chips={form.uks.map((u) => ({ key: ukKey(u), label: orgCase(u.name) || `#${u.id}`, o: u }))} onRemove={(c) => toggleUk(c.o)} onAdd={() => { setQ(''); setSheet('uks'); }} hint="Пусто — все УК выбранных регионов. Если для региона выбраны УК, он увидит только их." error={err('uks')} />
            </>
          ) : null}
          <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <Text style={{ fontSize: fs(t.size.body), color: t.colors.text }}>Активен</Text>
            <Switch value={Boolean(form.is_active)} onValueChange={(v) => set('is_active', v)} disabled={isSelf} />
          </Card>
          {error ? <ErrorCard message={error} /> : null}
          {!isNew && !isSelf ? <Button title="Удалить пользователя" variant="danger" onPress={remove} /> : null}
        </ScrollView>
      )}

      <Sheet visible={Boolean(sheet)} onClose={() => setSheet(null)} title={sheet === 'regions' ? 'Регионы' : 'Управляющие компании'} headerRight={<Button title="Готово" variant="text" small onPress={() => setSheet(null)} />}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <TextInput value={q} onChangeText={setQ} placeholder="Поиск" placeholderTextColor={t.colors.textMuted} style={{ height: 44, borderWidth: 1, borderColor: t.colors.fieldBorder, borderRadius: t.radius.sm, paddingHorizontal: 14, backgroundColor: t.colors.field, color: t.colors.text }} />
        </View>
        {optLoading ? <Loading /> : null}
        {!optLoading && sheetItems.length === 0 ? <Text style={{ textAlign: 'center', color: t.colors.textSecondary, padding: 24 }}>Нет вариантов</Text> : null}
        {sheetItems.map((it) => {
          const head = it.group && it.group !== lastGroup ? <Text key={`g-${it.group}`} style={{ fontSize: fs(13), fontWeight: '600', color: t.colors.textSecondary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>{it.group}</Text> : null;
          lastGroup = it.group;
          return <React.Fragment key={it.key}>{head}<SheetOption label={it.label} selected={it.selected} onPress={it.onPress} /></React.Fragment>;
        })}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
