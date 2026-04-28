import React from 'react';
import { BookOpen, Calculator, FlaskConical, Globe, Activity, Music, Palette, Cpu, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import UnitProgressBar from './UnitProgressBar';
import {
  getCoverageLevel,
  getPorcentaje,
  getTotalPasados,
  getPorcentajeFallback,
  getPorcentajeLegacy,
  getPorcentajePorUnidadFallback,
  LEVEL_CLASSES,
} from '../../lib/coverageMath';

const SUBJECT_ICONS = {
  lenguaje:            BookOpen,
  lengua_y_literatura: BookOpen,
  matematica:          Calculator,
  ciencias:            FlaskConical,
  historia:            Globe,
  educacion_fisica:    Activity,
  musica:              Music,
  artes:               Palette,
  tecnologia:          Cpu,
};

/**
 * Tarjeta de cobertura para una asignatura dentro de un curso.
 *
 * @param {import('../../types/coverage').CoverageDoc & { id: string }} block
 * @param {string[]} [basalesOas] - OA codes del currículum oficial (opcional)
 * @param {boolean} [compact]
 */
export default function CoverageCard({ block, basalesOas, compact = false }) {
  const {
    subject, subjectLabel, teacherName,
    unitTracking, legacyOaStatus,
    migrationStatus, evaluaciones, excelTotalBasales,
  } = block;

  const Icon = SUBJECT_ICONS[subject] ?? BookOpen;

  // Cálculo de progreso
  const isComplete  = migrationStatus === 'complete';
  const totalBase   = basalesOas?.length || excelTotalBasales || 0;

  let pct, pasados;
  if (isComplete) {
    if (basalesOas?.length) {
      pct    = getPorcentaje(unitTracking, basalesOas);
      pasados = getTotalPasados(unitTracking, basalesOas);
    } else {
      pct    = getPorcentajeFallback(unitTracking, excelTotalBasales);
      pasados = Math.round(pct * (excelTotalBasales || 0));
    }
  } else {
    pct    = getPorcentajeLegacy(legacyOaStatus, excelTotalBasales);
    pasados = Object.values(legacyOaStatus || {}).filter(Boolean).length;
  }

  const level   = getCoverageLevel(pct);
  const colors  = LEVEL_CLASSES[level];
  const pctStr  = `${Math.round(pct * 100)}%`;

  const pctPorUnidad = isComplete
    ? getPorcentajePorUnidadFallback(unitTracking, excelTotalBasales)
    : { u1: 0, u2: 0, u3: 0, u4: 0 };

  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-shadow p-4 flex flex-col gap-3',
      colors.border
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', colors.light)}>
          <Icon size={18} className={colors.text} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {subjectLabel}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{teacherName}</p>
        </div>
        <span className={cn('text-sm font-bold shrink-0', colors.text)}>{pctStr}</span>
      </div>

      {/* Barra de progreso total */}
      <div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>{pasados} / {totalBase} OA</span>
          {isComplete ? null : (
            <span className="text-amber-500 flex items-center gap-1">
              <AlertTriangle size={10} /> Dato del Excel
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colors.bg)}
            style={{ width: `${Math.min(100, pct * 100)}%` }}
          />
        </div>
      </div>

      {/* Barras por unidad (solo si complete) */}
      {!compact && isComplete && (
        <UnitProgressBar pctPorUnidad={pctPorUnidad} showLabels size="sm" />
      )}

      {/* Badge migración pendiente */}
      {migrationStatus === 'pending' && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={11} />
          <span>Pendiente de migración</span>
        </div>
      )}

      {/* Evaluaciones */}
      {!compact && evaluaciones && (
        <div className="flex gap-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>Sem 1: <strong className="text-slate-700">{evaluaciones.sem1 ?? '—'}</strong></span>
          <span>Sem 2: <strong className="text-slate-700">{evaluaciones.sem2 ?? '—'}</strong></span>
        </div>
      )}
    </div>
  );
}
