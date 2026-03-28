import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const GRUPOS = [
  {
    label: 'Operaciones',
    simbolos: [
      { s: '×', tip: 'Multiplicación' },
      { s: '÷', tip: 'División' },
      { s: '±', tip: 'Más/menos' },
      { s: '≠', tip: 'Distinto' },
      { s: '≈', tip: 'Aproximado' },
      { s: '∞', tip: 'Infinito' },
    ],
  },
  {
    label: 'Potencias y raíces',
    simbolos: [
      { s: '²', tip: 'Cuadrado' },
      { s: '³', tip: 'Cubo' },
      { s: '⁴', tip: 'Cuarta' },
      { s: '⁵', tip: 'Quinta' },
      { s: '√', tip: 'Raíz cuadrada' },
      { s: '∛', tip: 'Raíz cúbica' },
      { s: '∜', tip: 'Raíz cuarta' },
    ],
  },
  {
    label: 'Fracciones',
    simbolos: [
      { s: '½', tip: 'Un medio' },
      { s: '⅓', tip: 'Un tercio' },
      { s: '⅔', tip: 'Dos tercios' },
      { s: '¼', tip: 'Un cuarto' },
      { s: '¾', tip: 'Tres cuartos' },
      { s: '⅛', tip: 'Un octavo' },
      { s: '⅜', tip: 'Tres octavos' },
      { s: '⅝', tip: 'Cinco octavos' },
      { s: '⅞', tip: 'Siete octavos' },
    ],
  },
  {
    label: 'Comparación',
    simbolos: [
      { s: '≤', tip: 'Menor o igual' },
      { s: '≥', tip: 'Mayor o igual' },
      { s: '<', tip: 'Menor' },
      { s: '>', tip: 'Mayor' },
    ],
  },
  {
    label: 'Geometría',
    simbolos: [
      { s: '°', tip: 'Grado' },
      { s: 'π', tip: 'Pi' },
      { s: '∠', tip: 'Ángulo' },
      { s: '⊥', tip: 'Perpendicular' },
      { s: '∥', tip: 'Paralelo' },
      { s: '△', tip: 'Triángulo' },
      { s: '□', tip: 'Cuadrado' },
      { s: '○', tip: 'Círculo' },
    ],
  },
  {
    label: 'Conjuntos',
    simbolos: [
      { s: '∈', tip: 'Pertenece' },
      { s: '∉', tip: 'No pertenece' },
      { s: '⊂', tip: 'Subconjunto' },
      { s: '∪', tip: 'Unión' },
      { s: '∩', tip: 'Intersección' },
      { s: '∅', tip: 'Conjunto vacío' },
    ],
  },
  {
    label: 'Letras griegas',
    simbolos: [
      { s: 'α', tip: 'Alfa' },
      { s: 'β', tip: 'Beta' },
      { s: 'γ', tip: 'Gamma' },
      { s: 'θ', tip: 'Theta' },
      { s: 'λ', tip: 'Lambda' },
      { s: 'μ', tip: 'Mu' },
      { s: 'σ', tip: 'Sigma' },
      { s: 'Δ', tip: 'Delta' },
      { s: 'Σ', tip: 'Sigma may.' },
    ],
  },
];

export default function MathKeyboard({ onInsert }) {
  const [open, setOpen] = useState(true);
  const [grupoActivo, setGrupoActivo] = useState(0);

  return (
    <div className="border border-indigo-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()} // no robar el foco
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <span className="text-xs font-semibold text-indigo-700">Teclado matemático</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />}
      </button>

      {open && (
        <div className="px-3 py-2 space-y-2">
          {/* Tabs de grupos */}
          <div className="flex gap-1 flex-wrap">
            {GRUPOS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setGrupoActivo(i)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors
                  ${grupoActivo === i
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Símbolos del grupo activo */}
          <div className="flex gap-1 flex-wrap">
            {GRUPOS[grupoActivo].simbolos.map(({ s, tip }) => (
              <button
                key={s}
                type="button"
                title={tip}
                onMouseDown={e => e.preventDefault()} // no robar el foco
                onClick={() => onInsert(s)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-sm transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
