import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  getCoverageLevel,
  getPorcentajeFallback,
  getPorcentajeLegacy,
  LEVEL_CLASSES,
} from '../../lib/coverageMath';
import { GRADE_ORDER, SUBJECT_ORDER, GRADE_LABELS, SUBJECT_LABELS } from '../../lib/coverageConstants';

/**
 * Grid global curso × asignatura.
 * Celdas coloreadas por nivel: rojo <50%, amarillo 50-80%, verde >80%.
 *
 * @param {import('../../types/coverage').CoverageDoc[]} blocks - todos los docs del año
 * @param {string} [filterUnit] - si está seteado, muestra % de esa unidad específica
 */
export default function CoverageGrid({ blocks = [], filterUnit }) {
  // Construir mapa { grade: { subject: block } }
  const map = {};
  for (const b of blocks) {
    if (!map[b.grade]) map[b.grade] = {};
    map[b.grade][b.subject] = b;
  }

  // Subjects presentes en los datos
  const subjectsPresent = SUBJECT_ORDER.filter(s =>
    GRADE_ORDER.some(g => map[g]?.[s])
  );

  if (!blocks.length) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        Sin datos de cobertura para este año.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-slate-500 font-medium px-2 py-1 min-w-[72px]">Curso</th>
            {subjectsPresent.map(s => (
              <th key={s} className="text-center text-slate-500 font-medium px-1 py-1 min-w-[68px]">
                {SUBJECT_LABELS[s] ?? s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRADE_ORDER.filter(g => map[g]).map(grade => (
            <tr key={grade}>
              <td className="font-medium text-slate-700 px-2 py-1 whitespace-nowrap">
                <Link
                  to={`/cobertura/curso/${grade}`}
                  className="hover:text-eyr-primary transition-colors"
                >
                  {GRADE_LABELS[grade] ?? grade}
                </Link>
              </td>
              {subjectsPresent.map(subject => {
                const block = map[grade]?.[subject];
                if (!block) {
                  return <td key={subject} className="rounded-lg bg-slate-50 text-center text-slate-300">—</td>;
                }

                const isComplete = block.migrationStatus === 'complete';
                const pct = isComplete
                  ? getPorcentajeFallback(block.unitTracking, block.excelTotalBasales)
                  : getPorcentajeLegacy(block.legacyOaStatus, block.excelTotalBasales);

                const level  = getCoverageLevel(pct);
                const colors = LEVEL_CLASSES[level];

                return (
                  <td key={subject} className="p-0">
                    <Link
                      to={`/cobertura/curso/${grade}`}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-lg px-1 py-2 transition-opacity hover:opacity-80',
                        colors.light, colors.border, 'border'
                      )}
                    >
                      <span className={cn('font-bold text-sm', colors.text)}>
                        {Math.round(pct * 100)}%
                      </span>
                      {block.migrationStatus === 'pending' && (
                        <span className="text-[9px] text-amber-500 mt-0.5">Excel</span>
                      )}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
