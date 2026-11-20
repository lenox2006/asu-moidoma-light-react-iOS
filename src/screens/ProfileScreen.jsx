import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Card, Icon, NavBar } from '../components/ui';
import { useAuth } from '../lib/auth';
import { orgCase } from '../lib/format';
import { THEMES, useTheme, fs } from '../theme';

const initials = (name) => (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function ProfileScreen() {
  const { user, isSuperadmin, logout } = useAuth();
  const { theme: t, themeKey, setThemeKey } = useTheme();
  const regions = (user?.regions || []).map((r) => r.name || r.id);
  const uks = (user?.uks || []).map((u) => orgCase(u.name) || `#${u.id}`);
  const KV = ({ k, v, last }) => <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.line }}><Text style={{ fontSize: fs(14), color: t.colors.textSecondary }}>{k}</Text><Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.text, flexShrink: 1, textAlign: 'right' }}>{v}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar title="Профиль" subtitle="Текущая учётная запись" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20 }}>
          <Avatar text={initials(user?.name)} size={56} />
          <View style={{ flex: 1 }}><Text style={{ fontSize: fs(18), fontWeight: t.font.weightBold, color: t.colors.text }}>{user?.name}</Text><Text style={{ fontSize: fs(13), color: t.colors.textSecondary }}>{user?.login} · {isSuperadmin ? 'superadmin' : 'пользователь'}</Text></View>
        </Card>
        <Card style={{ padding: 0, gap: 0 }}>
          <KV k="Регионы" v={isSuperadmin ? 'Все' : regions.join(', ') || '—'} />
          <KV k="Управляющие компании" v={isSuperadmin ? 'Все' : uks.join(', ') || 'Все УК регионов'} last />
        </Card>
        <Card style={{ padding: 0, gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: t.colors.line }}>{Icon.palette(t.colors.textSecondary)}<Text style={{ fontSize: fs(t.size.body), color: t.colors.text }}>Оформление</Text></View>
          {Object.values(THEMES).map((th, i, arr) => (
            <Pressable key={th.key} onPress={() => setThemeKey(th.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, paddingLeft: 50, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: t.colors.line }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: th.colors.accent }} />
              <Text style={{ flex: 1, fontSize: fs(t.size.body), color: t.colors.text, fontWeight: themeKey === th.key ? t.font.weightMedium : '400' }}>{th.name}</Text>
              {themeKey === th.key ? Icon.check(t.colors.accent) : null}
            </Pressable>
          ))}
        </Card>
        <Card style={{ padding: 0, gap: 0 }}>
          <Pressable onPress={logout} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>{Icon.logout(t.colors.red)}<Text style={{ fontSize: fs(t.size.body), fontWeight: t.font.weightMedium, color: t.colors.red }}>Выйти</Text></Pressable>
        </Card>
        <Text style={{ textAlign: 'center', fontSize: fs(12), color: t.colors.textMuted, marginTop: 8 }}>АСУ «Мои Дома» Light · версия 1.0</Text>
      </ScrollView>
    </View>
  );
}
