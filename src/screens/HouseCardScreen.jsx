import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../api/client';
import { Button, Card, CardHead, ErrorCard, Field, Loading, NavBar } from '../components/ui';
import { buildCardModel } from '../lib/houseFields';
import { useTheme, fs } from '../theme';

/** Карточка МКД — «Общие сведения» (данные getHouseById через backend). params: { buildId, mark, row, crumbs } */
export default function HouseCardScreen({ navigation, route }) {
  const { buildId, mark, row, crumbs = [] } = route.params;
  const { theme: t } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.houseCard(buildId, mark).then((d) => !cancelled && setData(d)).catch((e) => !cancelled && setError(e.message)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [buildId, mark, reload]);

  const h = useMemo(() => buildCardModel(data?.house, row), [data, row]);
  const ready = !loading || row;
  const Stat = ({ v, l }) => <View style={{ flex: 1, gap: 2 }}><Text style={{ fontSize: fs(24), fontWeight: t.font.weightBold, color: t.colors.statValue }}>{v}</Text><Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{l}</Text></View>;
  const Grid2 = ({ children }) => <View style={{ flexDirection: 'row', gap: 10 }}>{React.Children.map(children, (c) => <View style={{ flex: 1 }}>{c}</View>)}</View>;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <NavBar title={h.short || 'Дом'} subtitle={[h.city, h.company].filter(Boolean).join(' · ')} onBack={() => navigation.goBack()}>
        <View style={{ flexDirection: 'row' }}><View style={{ paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: t.colors.accent }}><Text style={{ fontSize: fs(15), fontWeight: t.font.weightMedium, color: t.colors.accent }}>Общие сведения</Text></View></View>
      </NavBar>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {error ? <ErrorCard message={error} onRetry={() => setReload((n) => n + 1)} /> : null}
        {!ready ? <Loading /> : (
          <>
            <Card style={{ flexDirection: 'row', paddingVertical: 14 }}><Stat v={h.floors} l="этажей" /><Stat v={h.entrances} l="подъездов" /><Stat v={h.elevators} l="лифтов" /></Card>
            <Card>
              <CardHead>Жилые помещения</CardHead>
              <Grid2><Field label="Количество" value={h.flats} /><Field label="Площадь, м²" value={h.livingArea} /></Grid2>
              <CardHead>Нежилые помещения</CardHead>
              <Grid2><Field label="Количество" value={h.nonFlats} /><Field label="Площадь, м²" value={h.nonLivingArea} /></Grid2>
              <Field label="Общая площадь объекта, м²" value={h.totalArea} />
              <Field label="Площадь жилых и нежилых помещений, м²" value={h.premisesArea} />
              <Field label="Общая площадь МОП, м²" value={h.mopArea} />
            </Card>
            <Card>
              <CardHead>Управляющая компания</CardHead>
              <Field label="Наименование" value={h.company} />
              <Grid2><Field label="Дата начала управления" value={h.maintenanceStart} /><Field label="Вид обслуживания" value={h.managementType} /></Grid2>
              <Field label="Основание для управления" value={h.basis} />
              <Field label="Филиал" value={h.branch} />
            </Card>
            <Card>
              <CardHead>Сведения об объекте</CardHead>
              <Grid2><Field label="Год постройки" value={h.buildYear} /><Field label="Год ввода в эксплуатацию" value={h.entryYear} /></Grid2>
              <Grid2><Field label="Серия проекта" value={h.projectSeries} /><Field label="Тип проекта" value={h.projectType} /></Grid2>
              <Grid2><Field label="Тип объекта" value={h.objectType} /><View /></Grid2>
            </Card>
            <Card><CardHead>Расчётный центр</CardHead><Field label="Биллинг" value={h.billing} /></Card>
            <Button title="К списку домов" variant="outline" onPress={() => navigation.goBack()} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
