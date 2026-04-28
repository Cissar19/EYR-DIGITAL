import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getCoverageLevel } from '../../lib/coverageMath';

const LEVEL_FILL = { green: '#10b981', yellow: '#f59e0b', red: '#f43f5e' };
const PREV_FILL  = '#cbd5e1'; // slate-300

const CustomTooltip = ({ active, payload, label, prevYear, currentYear }) => {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.dataKey === 'pct');
  const prev = payload.find(p => p.dataKey === 'prevPct');
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-soft px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {curr && (
        <p className="text-slate-700">{currentYear ?? 'Este año'}: <strong>{Math.round(curr.value * 100)}%</strong></p>
      )}
      {prev && prev.value != null && (
        <p className="text-slate-500">{prevYear ?? 'Año anterior'}: {Math.round(prev.value * 100)}%</p>
      )}
    </div>
  );
};

/**
 * Gráfico de barras de cobertura.
 * @param {{ label: string, pct: number }[]} data         - pct en 0-1
 * @param {{ label: string, pct: number }[]} [prevData]   - datos año anterior (opcional)
 * @param {number} [height]
 * @param {number} [currentYear]
 * @param {number} [prevYear]
 */
export default function CoverageBarChart({ data = [], prevData, height = 220, currentYear, prevYear }) {
  if (!data.length) return null;

  const hasComparison = Array.isArray(prevData) && prevData.length > 0;

  // Merge datasets: asignar prevPct a cada entrada según su label
  const mergedData = data.map(entry => ({
    ...entry,
    prevPct: hasComparison
      ? (prevData.find(p => p.label === entry.label)?.pct ?? null)
      : undefined,
  }));

  const barSize = hasComparison ? 14 : 28;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={mergedData}
        margin={{ top: 4, right: 4, left: -20, bottom: 4 }}
        barCategoryGap="25%"
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={v => `${Math.round(v * 100)}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip prevYear={prevYear} currentYear={currentYear} />}
          cursor={{ fill: '#f8fafc' }}
        />
        {hasComparison && (
          <Bar dataKey="prevPct" radius={[4, 4, 0, 0]} fill={PREV_FILL} barSize={barSize} />
        )}
        <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={barSize}>
          {mergedData.map((entry, i) => (
            <Cell key={i} fill={LEVEL_FILL[getCoverageLevel(entry.pct)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
