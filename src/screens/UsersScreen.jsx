import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { Avatar, EmptyState, ErrorCard, IconButton, Loading, NavBar, Row } from '../components/ui';
import { useAuth } from '../lib/auth';
import { orgCase } from '../lib/format';
import { useTheme } from '../theme';

const initials = (name) => (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function UsersScreen({ navigation }) {
  const { user: me } = useAuth();
  const { theme: t } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    api.users().then((d) => setUsers(Array.isArray(d) ? d : d.data || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const scope = (u) => u.role === 'superadmin' ? 'все регионы' : [(u.regions || []).map((x) => x.name || x.id).join(', ') || 'нет региона', (u.uks || []).length ? (u.uks || []).map((x) => orgCase(x.name) || `#${x.id}`).join(', ') : 'все УК'].join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar title="Пользователи" subtitle={`Учётные записи${loading ? '' : ` · ${users.length}`}`} right={<IconButton icon="plus" filled label="Добавить пользователя" onPress={() => navigation.push('UserEdit', { id: null })} />} />
      {error ? <View style={{ padding: 16 }}><ErrorCard message={error} onRetry={load} /></View> : null}
      {loading ? <Loading /> : (
        <FlatList data={users} keyExtractor={(u) => String(u.id)} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState title="Пользователей нет" text="" />}
          renderItem={({ item: u }) => (
            <Row onPress={() => navigation.push('UserEdit', { id: u.id })} left={<Avatar text={initials(u.name)} />} title={`${u.name}${u.id === me?.id ? ' (вы)' : ''}`} subtitle={`${u.login} · ${scope(u)}`}
              tags={[u.role === 'superadmin' ? ['superadmin', 'accent'] : u.is_active ? ['активен', 'ok'] : ['отключён', 'muted']]} />
          )} />
      )}
    </View>
  );
}
