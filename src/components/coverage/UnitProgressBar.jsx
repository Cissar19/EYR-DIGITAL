import React from 'react';
import { cn } from '../../lib/utils';

const UNIT_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-400'];
const UNIT_LIGHT  = ['bg-violet-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100'];

/**
 * Barra de progreso segmentada en 4 unidades.
 * Muestra el avance de cada unidad respecto a totalBasales.
 *
 * @param {{ u1: number, u2: number, u3: number, u4: number }} pctPorUnidad - 0-1 por unidad
 * @param {boolean} showLabels
 * @param {'sm'|'md'} size
 */
export default function UnitProgressBar({ pctPorUnidad = {}, showLabels = true, size = 'sm' }) {
  const units = ['u1', 'u2', 'u3', 'u4'];
  const h = size === 'md' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {units.map((u, i) => {
          const pct = Math.min(1, Math.max(0, pctPorUnidad[u] ?? 0));
          return (
            <div key={u} className="flex-1 flex flex-col gap-0.5">
              <div className={cn('w-full rounded-full overflow-hidden', h, UNIT_LIGHT[i])}>
                <div
                  className={cn('h-full rounded-full transition-all duration-500', UNIT_COLORS[i])}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              {showLabels && (
                <span className="text-[10px] text-slate-400 text-center">
                  {u.toUpperCase()} {Math.round(pct * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
