'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const SAPIENS_COLORS = {
  blue: '#0435da',
  navy: '#021e5d',
  teal: '#7acbcc',
  green: '#3ab54b',
  yellow: '#f5b41c',
};

type Datum = { label: string; value: number };

type HBarProps = {
  data: Datum[];
  height?: number | `${number}%`;
  fontSize?: number;
  valueFontSize?: number;
  suffix?: string;
  /** Destaca a primeira barra em verde (como no banner). */
  highlightFirst?: boolean;
  /** Largura reservada aos rótulos, em múltiplos do fontSize. */
  labelWidthEm?: number;
  tooltipUnit?: string;
};

/** Barras horizontais com valores ao final. */
export function HBarChart({
  data,
  height = 260,
  fontSize = 13,
  valueFontSize,
  suffix = '',
  highlightFirst = false,
  labelWidthEm = 12,
  tooltipUnit = 'participantes',
}: HBarProps) {
  const vfs = valueFontSize ?? fontSize;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: vfs * 2.6, bottom: 4, left: 4 }} barCategoryGap="22%">
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={fontSize * labelWidthEm * 0.55}
          tickLine={false}
          axisLine={{ stroke: '#94a3b8' }}
          tick={{ fontSize, fill: '#1e293b' }}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: 'rgba(4,53,218,0.06)' }}
          formatter={(v) => [`${v}${suffix} ${tooltipUnit}`.trim(), '']}
          separator=""
        />
        <Bar dataKey="value" isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={d.label} fill={highlightFirst && i === 0 ? SAPIENS_COLORS.green : SAPIENS_COLORS.blue} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v}${suffix}`}
            style={{ fontSize: vfs, fontWeight: 800, fill: '#000' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Compatibilidade: gráfico de adoção (versão 1 do banner e página do relatório). */
export function AdoptionChart({
  data,
  height = 260,
  fontSize = 13,
}: {
  data: Datum[];
  height?: number | `${number}%`;
  fontSize?: number;
}) {
  return <HBarChart data={data} height={height} fontSize={fontSize} labelWidthEm={13} />;
}

type ColumnsProps = {
  data: Datum[];
  height?: number | `${number}%`;
  fontSize?: number;
  valueFontSize?: number;
  suffix?: string;
  /** Destaca a maior coluna em verde. */
  highlightMax?: boolean;
};

/** Colunas verticais com valor no topo (ex.: percentuais). */
export function ColumnsChart({
  data,
  height = 260,
  fontSize = 13,
  valueFontSize,
  suffix = '',
  highlightMax = true,
}: ColumnsProps) {
  const vfs = valueFontSize ?? fontSize;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: vfs * 1.5, right: 4, bottom: 4, left: 4 }} barCategoryGap="18%">
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: '#94a3b8' }}
          tick={{ fontSize, fill: '#1e293b' }}
          interval={0}
        />
        <YAxis hide domain={[0, suffix === '%' ? 100 : 'dataMax']} />
        <Tooltip
          cursor={{ fill: 'rgba(4,53,218,0.06)' }}
          formatter={(v) => [`${v}${suffix}`, '']}
          separator=""
        />
        <Bar dataKey="value" isAnimationActive={false}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={highlightMax && d.value === max ? SAPIENS_COLORS.green : SAPIENS_COLORS.blue}
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) => `${v}${suffix}`}
            style={{ fontSize: vfs, fontWeight: 800, fill: '#000' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
