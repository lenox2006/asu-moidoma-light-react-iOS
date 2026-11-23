import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../api/client';
import { BalanceBar, DeltaChart, MiniBar } from '../components/charts';
import { Button, Card, CardHead, EmptyState, ErrorCard, IconButton, Input, Loading, NavBar, ScreenBoundary, Segment, Sheet, SheetOption } from '../components/ui';
import {
  bucketLabel, flattenUks, fmtDate, fmtDelta, fmtMetric, METRICS, metricFields, netDelta,
  PERIODS, periodLabel, REPORTS, shortRegion, STEPS, toArray,
} from '../lib/analytics';
import { orgCase } from '../lib/format';
import { useTheme, fs } from '../theme';

const PREFS_KEY = 'asu_light_analytics';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Вкладка «Аналитика: движение жилого фонда».
 * Три отчёта по одним и тем же данным: «Сводка», «Сравнение регионов», «Тренд».
 * Источник — GET /api/analytics/housing-movement (метод analyticsHousingMoving кондуктора).
 */
export default function AnalyticsScreen() {
  const { theme: t } = useTheme();

  const [report, setReport] = useState('summary');
  const [period, setPeriod] = useState('month');
  const [step, setStep] = useState('week');
  const [range, setRange] = useState({ from: '', to: '' });
  const [metric, setMetric] = useState('houses');   // метрика динамики в отчёте «Тренд»
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(null);         // настройки периода в шторке

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // восстановление выбора пользователя
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        if (p.report) setReport(p.report);
        if (p.period) setPeriod(p.period);
        if (p.step) setStep(p.step);
        if (p.metric) setMetric(p.metric);
        if (p.range) setRange(p.range);
      } catch { /* настройки повреждены — остаются значения по умолчанию */ }
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ report, period, step, metric, range })).catch(() => {});
  }, [report, period, step, metric, range]);

  const load = useCallback(async (silent) => {
    if (period === 'custom' && !(DATE_RE.test(range.from) && DATE_RE.test(range.to))) {
      setError({ message: 'Укажите даты периода в формате ГГГГ-ММ-ДД' });
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.analytics({
        period,
        step,
        group_by: 'region',
        include: 'series',
        ...(period === 'custom' ? { from: range.from, to: range.to } : {}),
      });
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, step, range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(
    () => toArray(data?.groups).map((g) => ({ ...g, name: orgCase(g.name), top_uks: toArray(g.top_uks) })),
    [data],
  );
  const summary = data?.summary || {};
  const uks = useMemo(
    () => flattenUks(groups).map((u) => ({ ...u, name: orgCase(u.name) })),
    [groups],
  );

  const openSheet = () => { setDraft({ period, step, range }); setSheet(true); };
  const applySheet = () => {
    setPeriod(draft.period);
    setStep(draft.step);
    setRange(draft.range);
    setSheet(false);
  };

  const subtitle = data?.period
    ? `${periodLabel(data.period)}${data?.scope?.regions ? ` · ${data.scope.regions} рег.` : ''}`
    : 'Движение жилого фонда';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar
        title="Аналитика"
        subtitle={subtitle}
        right={<IconButton icon="filter" onPress={openSheet} label="Период отчёта" />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
          {REPORTS.map((r) => (
            <Segment key={r.key} label={r.label} active={report === r.key} onPress={() => setReport(r.key)} />
          ))}
        </ScrollView>
      </NavBar>

      {loading ? <Loading /> : error ? (
        <View style={{ padding: 16 }}><ErrorCard message={error.message} onRetry={() => load()} /></View>
      ) : groups.length === 0 ? (
        <EmptyState title="Нет данных за период" text="Измените период отчёта" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={t.colors.accent} />}
        >
          <ScreenBoundary key={report}>
            {report === 'summary' ? <SummaryReport summary={summary} groups={groups} period={data?.period} /> : null}
            {report === 'regions' ? <RegionsReport summary={summary} groups={groups} /> : null}
            {report === 'trend' ? (
              <TrendReport
                summary={summary}
                groups={groups}
                uks={uks}
                series={toArray(data?.series)}
                step={data?.period?.step || step}
                metric={metric}
                onMetric={setMetric}
              />
            ) : null}
          </ScreenBoundary>
        </ScrollView>
      )}

      <PeriodSheet
        visible={sheet}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setSheet(false)}
        onApply={applySheet}
      />
    </View>
  );
}

/* ---------- Отчёт 1: «Сводка» ---------- */

function SummaryReport({ summary, groups, period }) {
  const { theme: t } = useTheme();
  const chart = groups.map((g) => ({
    key: g.id, label: shortRegion(g.name), in: g.area_in, out: g.area_out, delta: netDelta(g, 'area'),
  }));
  const sorted = [...groups].sort((a, b) => Math.abs(netDelta(b, 'area')) - Math.abs(netDelta(a, 'area')));

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Kpi label="Обслуживаемая площадь" value={fmtMetric(summary.area_total, 'area')} sub={fmtDelta(netDelta(summary, 'area'), 'area')} subTone={tone(netDelta(summary, 'area'), t)} />
        <Kpi label="Домов в обслуживании" value={fmtMetric(summary.houses_total, 'houses')} sub={fmtDelta(netDelta(summary, 'houses'), 'houses')} subTone={tone(netDelta(summary, 'houses'), t)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Kpi label="Пришло" value={fmtDelta(summary.area_in, 'area')} sub={`${summary.houses_in || 0} д.`} bg={t.colors.greenBg} fg={t.colors.green} />
        <Kpi label="Ушло" value={fmtDelta(-Math.abs(summary.area_out || 0), 'area')} sub={`${summary.houses_out || 0} д.`} bg={t.colors.redBg} fg={t.colors.red} />
      </View>

      <Card>
        <CardHead>Изменение площади по регионам</CardHead>
        <DeltaChart items={chart} unit="м²" />
      </Card>

      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <Text style={{ fontSize: fs(17), fontWeight: t.font.weightMedium, color: t.colors.text, padding: 16, paddingBottom: 10 }}>По регионам</Text>
        {sorted.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.colors.line }}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.text }}>{g.name}</Text>
              <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{fmtMetric(g.area_total, 'area')} · {g.houses_total || 0} домов</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: tone(netDelta(g, 'area'), t) }}>{fmtDelta(netDelta(g, 'area'), 'area')}</Text>
              <Text style={{ fontSize: fs(12), fontWeight: t.font.weightMedium, color: tone(netDelta(g, 'houses'), t) }}>{fmtDelta(netDelta(g, 'houses'), 'houses')}</Text>
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: t.colors.accentBg }}>
          <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.text }}>Итого · {groups.length} рег.</Text>
          <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: tone(netDelta(summary, 'area'), t) }}>
            {fmtDelta(netDelta(summary, 'area'), 'area')} · {fmtDelta(netDelta(summary, 'houses'), 'houses')}
          </Text>
        </View>
      </Card>

      {period?.as_of ? (
        <Text style={{ fontSize: fs(12), color: t.colors.textSecondary, paddingHorizontal: 2 }}>
          Остатки — на {fmtDate(period.as_of)}. Переходы между УК внутри холдинга не учитываются.
        </Text>
      ) : null}
    </>
  );
}

/* ---------- Отчёт 2: «Сравнение регионов» ---------- */

const FILTERS = [
  { key: 'all', label: 'Все регионы' },
  { key: 'changed', label: 'С изменениями' },
  { key: 'up', label: 'Рост' },
  { key: 'down', label: 'Убыль' },
];

function RegionsReport({ summary, groups }) {
  const { theme: t } = useTheme();
  const [filter, setFilter] = useState('all');

  const list = groups.filter((g) => {
    const d = netDelta(g, 'area');
    const moved = d !== 0 || (g.area_in || 0) !== 0 || (g.area_out || 0) !== 0;
    if (filter === 'changed') return moved;
    if (filter === 'up') return d > 0;
    if (filter === 'down') return d < 0;
    return true;
  }).sort((a, b) => netDelta(a, 'area') - netDelta(b, 'area'));

  const max = Math.max(1, ...groups.map((g) => Math.max(Math.abs(g.area_in || 0), Math.abs(g.area_out || 0))));

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: fs(14), color: t.colors.textSecondary }}>Всего в обслуживании</Text>
          <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{groups.length} регионов</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(22), fontWeight: t.font.weightMedium, color: t.colors.text }}>{fmtMetric(summary.area_total, 'area')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(22), fontWeight: t.font.weightMedium, color: t.colors.text }}>{summary.houses_total || 0}</Text>
            <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>домов</Text>
          </View>
        </View>
        <BalanceBar inValue={summary.area_in} outValue={summary.area_out} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fs(13), fontWeight: t.font.weightMedium, color: t.colors.green }}>{fmtDelta(summary.area_in, 'area')} · {summary.houses_in || 0} д.</Text>
          <Text style={{ fontSize: fs(13), fontWeight: t.font.weightMedium, color: t.colors.red }}>{fmtDelta(-Math.abs(summary.area_out || 0), 'area')} · {summary.houses_out || 0} д.</Text>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FILTERS.map((f) => <Segment key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
      </ScrollView>

      {list.length === 0 ? (
        <Card><Text style={{ fontSize: fs(14), color: t.colors.textSecondary }}>За период в этих регионах движения не было.</Text></Card>
      ) : list.map((g) => (
        <Card key={g.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: fs(16), fontWeight: t.font.weightMedium, color: t.colors.text }}>{g.name}</Text>
              <Text style={{ fontSize: fs(12), color: t.colors.textSecondary, marginTop: 2 }}>
                {fmtMetric(g.area_total, 'area')} · {g.houses_total || 0} домов · {g.top_uks.length} УК
              </Text>
            </View>
            <View style={{ backgroundColor: toneBg(netDelta(g, 'area'), t), borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
              <Text style={{ fontSize: fs(13), fontWeight: t.font.weightMedium, color: tone(netDelta(g, 'area'), t) }}>{fmtDelta(netDelta(g, 'area'), 'area')}</Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <MiniBar label="пришло" value={fmtDelta(g.area_in, 'area')} max={max} color={t.colors.green} textColor={t.colors.green} />
            <MiniBar label="ушло" value={fmtDelta(-Math.abs(g.area_out || 0), 'area')} max={max} color={t.colors.red} textColor={t.colors.red} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text numberOfLines={2} style={{ flex: 1, fontSize: fs(12), color: t.colors.textSecondary }}>
              {g.top_uks.length ? g.top_uks.slice(0, 3).map((u) => orgCase(u.name)).join(' · ') : 'УК не указаны'}
            </Text>
            <Text style={{ fontSize: fs(12), fontWeight: t.font.weightMedium, color: tone(netDelta(g, 'houses'), t) }}>{fmtDelta(netDelta(g, 'houses'), 'houses')}</Text>
          </View>
        </Card>
      ))}
    </>
  );
}

/* ---------- Отчёт 3: «Тренд» ---------- */

function TrendReport({ summary, groups, uks, series, step, metric, onMetric }) {
  const { theme: t } = useTheme();
  const [tab, setTab] = useState('regions');
  const f = metricFields(metric);

  const chart = (series || []).map((s, i) => ({
    key: s.bucket || i, label: bucketLabel(s, step), in: s[f.in], out: s[f.out], delta: netDelta(s, metric),
  }));

  // защита от явно некорректного ряда: движение не может превышать весь фонд
  const suspicious = (series || []).some((x) => (
    Math.max(Number(x.houses_in) || 0, Number(x.houses_out) || 0) > (Number(summary.houses_total) || 0)
  ));

  const rows = tab === 'regions'
    ? groups.map((g) => ({ key: g.id, name: g.name, sub: `${fmtMetric(g[f.total], metric)} в обслуживании`, delta: netDelta(g, metric) }))
    : uks.map((u) => ({ key: u.key, name: u.name, sub: u.region, delta: netDelta(u, metric) }));
  const sorted = [...rows].sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0));

  return (
    <>
      <Card>
        <Text style={{ fontSize: fs(14), color: t.colors.textSecondary }}>Баланс за период</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text style={{ fontSize: fs(30), fontWeight: t.font.weightMedium, color: tone(netDelta(summary, 'area'), t) }}>{fmtDelta(netDelta(summary, 'area'), 'area')}</Text>
          <Text style={{ marginLeft: 'auto', fontSize: fs(14), fontWeight: t.font.weightMedium, color: tone(netDelta(summary, 'houses'), t) }}>{fmtDelta(netDelta(summary, 'houses'), 'houses')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Kpi flat label="Пришло" value={fmtDelta(summary.area_in, 'area')} sub={`${summary.houses_in || 0} д.`} bg={t.colors.greenBg} fg={t.colors.green} />
          <Kpi flat label="Ушло" value={fmtDelta(-Math.abs(summary.area_out || 0), 'area')} sub={`${summary.houses_out || 0} д.`} bg={t.colors.redBg} fg={t.colors.red} />
        </View>
      </Card>

      <Card>
        <CardHead>Динамика по периодам</CardHead>
        {chart.length ? (
          <>
            <DeltaChart items={chart} unit={metric === 'area' ? 'м²' : 'домов'} minColumn={34} />
            {suspicious ? (
              <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>
                Ряд по периодам выглядит некорректным: движение превышает весь фонд. Проверьте расчёт на стороне кондуктора.
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ fontSize: fs(14), color: t.colors.textSecondary }}>Кондуктор не вернул ряд по периодам для этого шага.</Text>
        )}
      </Card>

      {/* Разрез: регионы или УК + метрика динамики */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.colors.line }}>
          <TabLabel label="Регионы" active={tab === 'regions'} onPress={() => setTab('regions')} />
          <TabLabel label="Управляющие компании" active={tab === 'uks'} onPress={() => setTab('uks')} />
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: t.colors.line, borderRadius: t.radius.md, padding: 3 }}>
          {METRICS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => onMetric(m.key)}
              style={{ flex: 1, height: 34, borderRadius: t.radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: metric === m.key ? t.colors.surface : 'transparent' }}
            >
              <Text style={{ fontSize: fs(14), fontWeight: t.font.weightMedium, color: metric === m.key ? t.colors.text : t.colors.textSecondary }}>
                {m.key === 'area' ? 'Площадь, м²' : 'Количество домов'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <Text style={{ fontSize: fs(14), color: t.colors.textSecondary, padding: 16 }}>Нет данных по этому разрезу.</Text>
        ) : sorted.map((r, i) => (
          <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.colors.line }}>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.text }}>{r.name}</Text>
              <Text numberOfLines={1} style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{r.sub}</Text>
            </View>
            <View style={{ backgroundColor: toneBg(r.delta, t), borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: fs(13), fontWeight: t.font.weightMedium, color: tone(r.delta, t) }}>{fmtDelta(r.delta, metric)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

/* ---------- Общие части ---------- */

function Kpi({ label, value, sub, subTone, bg, fg, flat }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: bg || t.colors.surface, borderRadius: flat ? t.radius.md : t.radius.card, padding: flat ? 12 : 16, gap: 4 }}>
      <Text style={{ fontSize: fs(12), color: fg || t.colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: fs(flat ? 16 : 20), fontWeight: t.font.weightMedium, color: fg || t.colors.text }}>{value}</Text>
      {sub ? <Text style={{ fontSize: fs(13), fontWeight: t.font.weightMedium, color: subTone || fg || t.colors.textSecondary }}>{sub}</Text> : null}
    </View>
  );
}

function TabLabel({ label, active, onPress }) {
  const { theme: t } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, marginRight: 20, borderBottomWidth: 2, borderBottomColor: active ? t.colors.accent : 'transparent' }}>
      <Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: active ? t.colors.accent : t.colors.textSecondary }}>{label}</Text>
    </Pressable>
  );
}

function PeriodSheet({ visible, draft, setDraft, onClose, onApply }) {
  const { theme: t } = useTheme();
  if (!draft) return null;
  const custom = draft.period === 'custom';
  const valid = !custom || (DATE_RE.test(draft.range.from) && DATE_RE.test(draft.range.to) && draft.range.from <= draft.range.to);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Период отчёта"
      footer={<Button title="Применить" onPress={onApply} disabled={!valid} />}
    >
      {PERIODS.map((p) => (
        <SheetOption
          key={p.key}
          label={p.title}
          selected={draft.period === p.key}
          onPress={() => setDraft({ ...draft, period: p.key, step: p.step })}
        />
      ))}

      {custom ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Input label="с (ГГГГ-ММ-ДД)" placeholder="2026-06-01" value={draft.range.from} onChangeText={(v) => setDraft({ ...draft, range: { ...draft.range, from: v } })} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="по (ГГГГ-ММ-ДД)" placeholder="2026-11-30" value={draft.range.to} onChangeText={(v) => setDraft({ ...draft, range: { ...draft.range, to: v } })} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
      ) : null}

      <Text style={{ fontSize: fs(13), color: t.colors.textSecondary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>Шаг графика в отчёте «Тренд»</Text>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        {STEPS.map((s) => <Segment key={s.key} label={s.label} active={draft.step === s.key} onPress={() => setDraft({ ...draft, step: s.key })} />)}
      </View>
    </Sheet>
  );
}

const tone = (v, t) => ((Number(v) || 0) > 0 ? t.colors.green : (Number(v) || 0) < 0 ? t.colors.red : t.colors.textSecondary);
const toneBg = (v, t) => ((Number(v) || 0) > 0 ? t.colors.greenBg : (Number(v) || 0) < 0 ? t.colors.redBg : t.colors.chip);
