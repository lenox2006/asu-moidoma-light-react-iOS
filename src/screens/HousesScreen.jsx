import React, { useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { Button, Crumb, EmptyState, ErrorCard, IconButton, Loading, NavBar, Row, SearchField, Segment, Sheet, SheetOption, Switch } from '../components/ui';
import { cleanName, isHouseRow, UK_TABS, useHousesList } from '../hooks/useHousesList';
import { useAuth } from '../lib/auth';
import { fmtArea, fmtInt, LEVEL_TITLES } from '../lib/format';
import { useTheme, fs } from '../theme';

/**
 * Один экран для всех уровней: Регионы → УК → Улицы → Дома.
 * params: { mark, crumbs } — переход на следующий уровень = push этого же экрана (нативный стек, назад — свайп/кнопка).
 */
export default function HousesScreen({ navigation, route }) {
  const { start } = useAuth();
  const { theme: t } = useTheme();
  const mark = route.params?.mark ?? (start.mark || '');
  const crumbs = route.params?.crumbs ?? (start.crumbs || []);
  const isRoot = !route.params;

  const L = useHousesList(mark);
  const [sheet, setSheet] = useState(false);
  const [showTotals, setShowTotals] = useState(true);

  function open(row) {
    if (isHouseRow(row, L.level)) {
      const buildId = row.build_id ?? row.buildId ?? row.next_value ?? row.id ?? row.house_id;
      if (buildId == null || buildId === '') return;
      navigation.push('HouseCard', { buildId: String(buildId), mark: row.mark || mark, row, crumbs });
      return;
    }
    if (!row.mark || row.mark === mark) return;
    navigation.push('Houses', { mark: row.mark, crumbs: [...crumbs, { level: row.next_level, text: cleanName(row.next_text || row.address), mark: row.mark }] });
  }

  const last = crumbs[crumbs.length - 1];
  const title = last ? cleanName(last.text) : 'Мои дома';
  const subtitle = `${L.level ? LEVEL_TITLES[L.level] || L.level : '…'}${L.loading ? '' : ` · ${L.filtered.length}`}`;

  const renderRow = ({ item: r }) => {
    const name = cleanName(r.address || r.next_text || '');
    if (L.level === 'region') return <Row title={name} onPress={() => open(r)} meta={[['УК', fmtInt(r.company) || '0'], ['МКД', fmtInt(r.house_cnt) || '0'], ['Площадь', fmtArea(r.full_area) || '—']]} />;
    if (L.isHouses) return <Row title={name} onPress={() => open(r)} tags={[[`${r.build_years || '—'} г.`, 'accent'], [`${r.floors || '—'} эт.`], [`${fmtInt(r.entrances) || 0} под. · ${fmtInt(r.elevators) || 0} лифт.`], [`${fmtArea(r.full_area) || '—'} м²`]]} />;
    return <Row title={name} onPress={() => open(r)} subtitle={L.isUk && typeof r.company === 'string' ? cleanName(r.company) : undefined}
      tags={[[`${fmtInt(r.house_cnt) || 0} МКД`, 'accent'], ...(r.build_years ? [[r.build_years]] : []), ...(r.floors ? [[`${r.floors} эт.`]] : []), ...(r.full_area ? [[`${fmtArea(r.full_area)} м²`]] : [])]} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar brand={isRoot} title={title} subtitle={subtitle} onBack={isRoot ? undefined : () => navigation.goBack()}
        right={L.isUk ? <IconButton icon="filter" label="Фильтр по статусу УК" onPress={() => setSheet(true)} badge={L.ukTab !== 'all' ? '1' : null} /> : null}>
        <SearchField value={L.search} onChangeText={L.setSearch} placeholder={L.isHouses ? 'Поиск по номеру дома' : L.isUk ? 'Поиск по названию УК' : 'Поиск'} />
        {crumbs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {crumbs.map((c, i) => <Crumb key={c.mark || i} label={cleanName(c.text)} current={i === crumbs.length - 1} onPress={() => navigation.pop(crumbs.length - 1 - i)} />)}
          </ScrollView>
        ) : null}
        {L.isUk ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {UK_TABS.map(([k, lbl]) => <Segment key={k} label={`${lbl} · ${L.counts[k]}`} active={L.ukTab === k} onPress={() => L.setUkTab(k)} />)}
          </ScrollView>
        ) : null}
      </NavBar>

      {L.error ? <View style={{ padding: 16 }}><ErrorCard message={L.error} onRetry={L.retry} /></View> : null}
      {L.loading ? <Loading /> : null}
      {!L.loading && !L.error ? (
        <FlatList
          data={L.filtered}
          keyExtractor={(r, i) => r.mark || String(r.next_value ?? i)}
          renderItem={renderRow}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, paddingBottom: 2 }}>
              <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>Найдено: <Text style={{ color: t.colors.text, fontWeight: '500' }}>{L.filtered.length}</Text></Text>
              {showTotals && L.filtered.length ? <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>Итого: <Text style={{ color: t.colors.text, fontWeight: '500' }}>{fmtInt(L.totals.mkd) || 0} МКД{L.totals.area ? ` · ${fmtArea(L.totals.area)} м²` : ''}</Text></Text> : null}
            </View>
          )}
          ListEmptyComponent={<EmptyState action={L.search || (L.isUk && L.ukTab !== 'our') ? <Button title="Сбросить фильтр" variant="outline" small onPress={() => { L.setSearch(''); L.setUkTab('our'); }} style={{ marginTop: 6 }} /> : null} />}
        />
      ) : null}

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Статус УК" headerRight={<Button title="Сбросить" variant="text" small onPress={() => L.setUkTab('our')} />}
        footer={(
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
              <Text style={{ fontSize: fs(t.size.body), color: t.colors.text }}>Показывать сводные итоги</Text>
              <Switch value={showTotals} onValueChange={setShowTotals} />
            </View>
            <Button title={`Показать ${L.counts[L.ukTab]} УК`} onPress={() => setSheet(false)} />
          </>
        )}>
        {UK_TABS.map(([k, lbl]) => <SheetOption key={k} label={lbl} count={L.counts[k]} selected={L.ukTab === k} onPress={() => L.setUkTab(k)} />)}
      </Sheet>
    </View>
  );
}
