import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useTheme, fs } from '../theme';

/**
 * Столбчатый график движения фонда: вверх зелёным — пришло, вниз красным — ушло,
 * серая линия — разность. Используется и по регионам (отчёт «Сводка»),
 * и по корзинам времени (отчёт «Тренд»).
 *
 * items: [{ key, label, in, out, delta }]
 */
export function DeltaChart({ items, unit, showDeltaLine = true, minColumn = 30, height = 170 }) {
  const { theme: t } = useTheme();
  const [width, setWidth] = useState(0);

  const data = items || [];
  const max = Math.max(1, ...data.map((d) => Math.max(Math.abs(d.in || 0), Math.abs(d.out || 0), Math.abs(d.delta || 0))));
  const upH = Math.round(height * 0.42);
  const downH = height - upH - 18;          // 18 px под подписи
  const colW = Math.max(minColumn, width ? (width - 26) / Math.max(data.length, 1) : minColumn);
  const chartW = Math.max(width - 26, colW * data.length);
  const barW = Math.min(12, Math.max(6, colW / 3));

  const y0 = upH;
  const pointX = (i) => i * colW + colW / 2;
  const deltaPoints = data.map((d, i) => {
    const v = Number(d.delta) || 0;
    const y = v >= 0 ? y0 - (v / max) * upH : y0 + (Math.abs(v) / max) * downH;
    return `${pointX(i).toFixed(1)},${(Number.isFinite(y) ? y : y0).toFixed(1)}`;
  }).join(' ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 8 }}>
        <Legend color={t.colors.green} label="пришло" />
        <Legend color={t.colors.red} label="ушло" />
        {showDeltaLine ? <Legend color={t.colors.textSecondary} label="разность" line /> : null}
        <Text style={{ marginLeft: 'auto', fontSize: fs(12), color: t.colors.textSecondary }}>{unit}</Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 26, height: upH + downH }}>
          <Text style={{ position: 'absolute', top: -5, fontSize: fs(10), color: t.colors.textMuted }}>{fmtAxis(max)}</Text>
          <Text style={{ position: 'absolute', top: y0 - 7, fontSize: fs(10), color: t.colors.textMuted }}>0</Text>
          <Text style={{ position: 'absolute', top: upH + downH - 12, fontSize: fs(10), color: t.colors.textMuted }}>−{fmtAxis(max)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={chartW > width - 26}>
          <View>
            <Svg width={chartW} height={upH + downH}>
              <Line x1={0} y1={y0} x2={chartW} y2={y0} stroke={t.colors.gray} strokeWidth={1} />
              {data.flatMap((d, i) => {
                const inH = (Math.abs(Number(d.in) || 0) / max) * upH;
                const outH = (Math.abs(Number(d.out) || 0) / max) * downH;
                const cx = pointX(i);
                const bars = [];
                if (Number.isFinite(inH) && inH > 0) bars.push(<Rect key={`in${i}`} x={cx - barW - 1} y={y0 - inH} width={barW} height={inH} rx={2} fill={t.colors.green} />);
                if (Number.isFinite(outH) && outH > 0) bars.push(<Rect key={`out${i}`} x={cx + 1} y={y0} width={barW} height={outH} rx={2} fill={t.colors.red} />);
                return bars;
              })}
              {showDeltaLine && data.length > 1 ? (
                <Polyline points={deltaPoints} fill="none" stroke={t.colors.textSecondary} strokeWidth={1.5} />
              ) : null}
              {showDeltaLine && data.length === 1 ? (
                <Circle cx={pointX(0)} cy={y0 - ((Number(data[0].delta) || 0) / max) * upH} r={3} fill={t.colors.textSecondary} />
              ) : null}
            </Svg>
            <View style={{ flexDirection: 'row', width: chartW }}>
              {data.map((d, i) => (
                <Text key={d.key || i} numberOfLines={1} style={{ width: colW, textAlign: 'center', fontSize: fs(9), color: t.colors.textSecondary }}>{d.label}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function fmtAxis(v) {
  const n = Number(v) || 0;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

function Legend({ color, label, line }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: line ? 14 : 10, height: line ? 2 : 10, borderRadius: line ? 1 : 2, backgroundColor: color }} />
      <Text style={{ fontSize: fs(12), color: t.colors.textSecondary }}>{label}</Text>
    </View>
  );
}

/** Полоса баланса: доля пришедшего и ушедшего в общем объёме движения. */
export function BalanceBar({ inValue, outValue, height = 10 }) {
  const { theme: t } = useTheme();
  const a = Math.abs(Number(inValue) || 0);
  const b = Math.abs(Number(outValue) || 0);
  const sum = a + b;
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: t.colors.line }}>
      {sum > 0 ? <View style={{ flex: a, backgroundColor: t.colors.green }} /> : null}
      {sum > 0 ? <View style={{ flex: b, backgroundColor: t.colors.red }} /> : null}
    </View>
  );
}

/** Горизонтальная мини-полоса «пришло/ушло» в карточке региона. */
export function MiniBar({ label, value, max, color, textColor }) {
  const { theme: t } = useTheme();
  const share = max > 0 ? Math.min(1, Math.abs(Number(value) || 0) / max) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ width: 54, fontSize: fs(11), color: t.colors.textSecondary }}>{label}</Text>
      <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: t.colors.chip, overflow: 'hidden' }}>
        <View style={{ width: `${share * 100}%`, height: 8, backgroundColor: color }} />
      </View>
      <Text style={{ fontSize: fs(11), fontWeight: t.font.weightMedium, color: textColor }}>{value}</Text>
    </View>
  );
}
