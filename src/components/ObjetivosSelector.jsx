// src/components/ObjetivosSelector.jsx
// Selector de Objetivos de Aprendizaje para usar al crear evaluaciones.
// Usa los mismos datos estáticos que CoberturaOA (objetivosAprendizaje.js).
//
// Props:
//   onSeleccion(oas: Array) — se llama cada vez que el profesor selecciona/deselecciona OA
//   seleccionados?: Array<string> — códigos de OA ya seleccionados (para editar una evaluación existente)
//   maxSeleccion?: number — límite de OA seleccionables (default: sin límite)
//   soloBasales?: boolean — si true, muestra solo los OA basales EYR

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { getOAsForCursoAsignatura, ASIGNATURAS, CURSOS } from "../data/objetivosAprendizaje";
import { BASALES_MINEDUC } from "../lib/coverageConstants";
import { cn } from "../lib/utils";

// Asignatura code → clave en BASALES_MINEDUC
const ASIG_TO_SUBJECT = {
  MA: "matematica",
  LE: "lenguaje",
  CN: "ciencias",
  HI: "historia",
  IN: "ingles",
  EF: "educacion_fisica",
  MU: "musica",
  AV: "artes",
  TE: "tecnologia",
  OR: "orientacion",
  RE: "religion_evangelica",
  RC: "religion_catolica",
};

// Curso nombre → código de grado para BASALES_MINEDUC
const CURSO_TO_GRADE = {
  "1° Básico": "1A",
  "2° Básico": "2A",
  "3° Básico": "3A",
  "4° Básico": "4A",
  "5° Básico": "5A",
  "6° Básico": "6A",
  "7° Básico": "7A",
  "8° Básico": "8A",
};

const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Extrae la clave basal de un código OA estático ("MA01-OA01" → "OA01")
const toBasalKey = (code) => {
  const parts = code.split("-");
  return parts.length > 1 ? parts[1] : null;
};

// Para LE en 7B/8B usar lengua_y_literatura
const getSubjectKey = (asigCode, gradeCode) => {
  if (asigCode === "LE" && (gradeCode === "7A" || gradeCode === "8A"))
    return "lengua_y_literatura";
  return ASIG_TO_SUBJECT[asigCode] || null;
};

export default function ObjetivosSelector({
  onSeleccion,
  seleccionados: seleccionadosProp = [],
  maxSeleccion,
  cursoNombreExterno,
  asignaturaNombreExterno,
  soloBasales = false,
  embedded = false,
}) {
  const [cursoActivo, setCursoActivo] = useState("");
  const [asigActivo, setAsigActivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ejeActivo, setEjeActivo] = useState("Todos");
  const [seleccionados, setSeleccionados] = useState(new Set(seleccionadosProp));
  const [isCursoOpen, setIsCursoOpen] = useState(false);
  const [isAsigOpen, setIsAsigOpen] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());

  const cursoRef = useRef(null);
  const asigRef = useRef(null);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (cursoRef.current && !cursoRef.current.contains(e.target)) setIsCursoOpen(false);
      if (asigRef.current && !asigRef.current.contains(e.target)) setIsAsigOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Obtener OA del archivo estático y normalizarlos a { codigo, eje, descripcion }
  const objetivos = useMemo(() => {
    if (!cursoActivo || !asigActivo) return [];
    return getOAsForCursoAsignatura(asigActivo, cursoActivo).map((oa) => ({
      codigo: oa.code,
      eje: oa.eje,
      descripcion: oa.description,
    }));
  }, [cursoActivo, asigActivo]);

  // Sincronizar con curso externo (modal)
  useEffect(() => {
    if (!cursoNombreExterno) return;
    const match = CURSOS.find((c) => c === cursoNombreExterno);
    if (match && match !== cursoActivo) {
      setCursoActivo(match); // eslint-disable-line react-hooks/set-state-in-effect
      setAsigActivo(""); // eslint-disable-line react-hooks/set-state-in-effect
      setEjeActivo("Todos"); // eslint-disable-line react-hooks/set-state-in-effect
      setBusqueda(""); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [cursoNombreExterno]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar con asignatura externa (modal)
  useEffect(() => {
    if (!asignaturaNombreExterno) return;
    const match = ASIGNATURAS.find(
      (a) => normalize(a.name) === normalize(asignaturaNombreExterno)
    );
    if (match && match.code !== asigActivo) {
      setAsigActivo(match.code); // eslint-disable-line react-hooks/set-state-in-effect
      setEjeActivo("Todos"); // eslint-disable-line react-hooks/set-state-in-effect
      setBusqueda(""); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [asignaturaNombreExterno]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set de OA basales para el curso+asignatura actual (siempre, para marcar visualmente)
  const basalesSet = useMemo(() => {
    if (!cursoActivo || !asigActivo) return null;
    const grade = CURSO_TO_GRADE[cursoActivo];
    const subject = getSubjectKey(asigActivo, grade);
    if (!grade || !subject) return null;
    const codes = BASALES_MINEDUC[subject]?.[grade];
    return codes ? new Set(codes) : null;
  }, [cursoActivo, asigActivo]);

  // Ejes únicos del curso+asignatura actual
  const ejes = useMemo(() => {
    const nombres = [...new Set(objetivos.map((oa) => oa.eje))];
    return ["Todos", ...nombres];
  }, [objetivos]);

  // OA filtrados por búsqueda y eje (soloBasales como filtro opcional)
  const oaFiltrados = useMemo(() => {
    return objetivos.filter((oa) => {
      if (soloBasales && basalesSet && !basalesSet.has(toBasalKey(oa.codigo))) return false;
      const matchEje = ejeActivo === "Todos" || oa.eje === ejeActivo;
      const termino = busqueda.toLowerCase();
      const matchBusqueda =
        !termino ||
        oa.codigo.toLowerCase().includes(termino) ||
        oa.descripcion.toLowerCase().includes(termino);
      return matchEje && matchBusqueda;
    });
  }, [objetivos, ejeActivo, busqueda, basalesSet, soloBasales]);

  function toggleOA(codigo) {
    const next = new Set(seleccionados);
    if (next.has(codigo)) {
      next.delete(codigo);
    } else {
      if (maxSeleccion && next.size >= maxSeleccion) return;
      next.add(codigo);
    }
    setSeleccionados(next);
    const oasSeleccionados = objetivos.filter((oa) => next.has(oa.codigo));
    onSeleccion?.(oasSeleccionados);
  }

  function handleCursoSelect(curso) {
    setCursoActivo(curso);
    setAsigActivo("");
    setEjeActivo("Todos");
    setBusqueda("");
    setIsCursoOpen(false);
  }

  function handleAsigSelect(code) {
    setAsigActivo(code);
    setEjeActivo("Todos");
    setBusqueda("");
    setIsAsigOpen(false);
  }

  function toggleExpandir(codigo) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }

  // ── Sección de filtros (compartida) ──────────────────────────────────────────
  const filtros = (
    <div className={cn("space-y-3", embedded ? "mb-4" : "px-6 py-4 border-b border-eyr-outline-variant/10")}>
      <div className="grid grid-cols-2 gap-3">

        {/* Dropdown Curso */}
        <div ref={cursoRef} className="relative">
          <label className="block text-xs font-medium text-eyr-on-variant mb-1">Curso</label>
          <button
            type="button"
            onClick={() => setIsCursoOpen((p) => !p)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium",
              isCursoOpen
                ? "border-eyr-primary bg-white shadow-sm"
                : "border-eyr-outline-variant/20 bg-eyr-surface-low hover:border-eyr-outline-variant/40",
              cursoActivo ? "text-eyr-on-surface" : "text-eyr-on-variant/50"
            )}
          >
            <span className="truncate">{cursoActivo || "Seleccionar curso"}</span>
            <ChevronDown className={cn("w-4 h-4 text-eyr-on-variant shrink-0 transition-transform", isCursoOpen && "rotate-180")} />
          </button>
          {isCursoOpen && (
            <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-eyr-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                {CURSOS.map((c) => (
                  <button key={c} type="button" onClick={() => handleCursoSelect(c)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                      cursoActivo === c ? "bg-eyr-surface-mid text-eyr-primary" : "text-eyr-on-surface hover:bg-eyr-surface-low"
                    )}
                  >
                    <span>{c}</span>
                    {cursoActivo === c && <Check className="w-4 h-4 shrink-0 text-eyr-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Asignatura */}
        <div ref={asigRef} className="relative">
          <label className="block text-xs font-medium text-eyr-on-variant mb-1">Asignatura</label>
          <button
            type="button"
            disabled={!cursoActivo}
            onClick={() => setIsAsigOpen((p) => !p)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium",
              isAsigOpen ? "border-eyr-primary bg-white shadow-sm" : "border-eyr-outline-variant/20 bg-eyr-surface-low hover:border-eyr-outline-variant/40",
              asigActivo ? "text-eyr-on-surface" : "text-eyr-on-variant/50",
              !cursoActivo && "opacity-50 cursor-not-allowed hover:border-eyr-outline-variant/20"
            )}
          >
            <span className="truncate">
              {asigActivo
                ? (ASIGNATURAS.find((a) => a.code === asigActivo)?.name || asigActivo)
                : "Seleccionar asignatura"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-eyr-on-variant shrink-0 transition-transform", isAsigOpen && "rotate-180")} />
          </button>
          {isAsigOpen && (
            <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-eyr-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                {ASIGNATURAS.map((a) => (
                  <button key={a.code} type="button" onClick={() => handleAsigSelect(a.code)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                      asigActivo === a.code ? "bg-eyr-surface-mid text-eyr-primary" : "text-eyr-on-surface hover:bg-eyr-surface-low"
                    )}
                  >
                    <span>{a.name}</span>
                    {asigActivo === a.code && <Check className="w-4 h-4 shrink-0 text-eyr-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      {asigActivo && (
        <div className="relative">
          <svg className="absolute left-3 top-2.5 text-eyr-on-variant w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-eyr-outline-variant/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-eyr-primary/20 bg-eyr-surface-low text-eyr-on-surface placeholder:text-eyr-on-variant/40"
          />
        </div>
      )}

      {/* Filtro por Eje */}
      {asigActivo && ejes.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {ejes.map((eje) => (
            <button key={eje} onClick={() => setEjeActivo(eje)}
              className={cn(
                "text-xs px-3 py-1 rounded-full border transition-colors",
                ejeActivo === eje
                  ? "bg-eyr-primary text-white border-eyr-primary"
                  : "bg-white text-eyr-on-variant border-eyr-outline-variant/30 hover:border-eyr-primary/50"
              )}
            >
              {eje}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Lista + footer (compartidos) ──────────────────────────────────────────────
  const itemPx = embedded ? "px-4" : "px-6";
  const footerPx = embedded ? "px-4" : "px-6";

  const lista = (
    <div className="overflow-y-auto" style={{ maxHeight: embedded ? "380px" : "420px" }}>
      {!asigActivo && (
        <div className="py-12 text-center text-gray-400 text-sm">
          Selecciona un curso y asignatura para ver los OA disponibles
        </div>
      )}
      {asigActivo && oaFiltrados.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">
          No se encontraron objetivos con ese filtro
        </div>
      )}
      {oaFiltrados.map((oa) => {
        const isSelected = seleccionados.has(oa.codigo);
        const isDisabled = !isSelected && maxSeleccion && seleccionados.size >= maxSeleccion;
        const isExpandido = expandidos.has(oa.codigo);

        return (
          <div
            key={oa.codigo}
            className={cn(
              `flex items-start gap-3 ${itemPx} py-3 border-b border-eyr-outline-variant/10 transition-colors last:border-b-0`,
              isSelected ? "bg-eyr-surface-low" : isDisabled ? "opacity-50 bg-white" : "bg-white"
            )}
          >
            <div className="mt-0.5 shrink-0" onClick={(e) => { e.stopPropagation(); if (!isDisabled) toggleOA(oa.codigo); }}>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && toggleOA(oa.codigo)}
                className="w-4 h-4 rounded border-eyr-outline-variant text-eyr-primary focus:ring-eyr-primary/30 cursor-pointer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded",
                    isSelected ? "bg-eyr-primary text-white" : "bg-eyr-surface-mid text-eyr-on-variant"
                  )}>
                    {oa.codigo}
                  </span>
                  {basalesSet?.has(toBasalKey(oa.codigo)) && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 tracking-wide">
                      BASAL
                    </span>
                  )}
                  {oa.eje && oa.eje !== "General" && (
                    <span className="text-xs text-eyr-on-variant/60 italic">{oa.eje}</span>
                  )}
                </div>
                {oa.descripcion && (
                  <button
                    type="button"
                    onClick={() => toggleExpandir(oa.codigo)}
                    className="flex items-center gap-1 text-xs font-medium text-eyr-primary/70 hover:text-eyr-primary shrink-0 transition-colors"
                  >
                    {isExpandido ? "Ocultar" : "Ver detalle"}
                    <ChevronDown className={cn("w-3 h-3 transition-transform", isExpandido && "rotate-180")} />
                  </button>
                )}
              </div>
              {isExpandido && oa.descripcion && (
                <div className="mt-2">
                  <p className="text-sm text-eyr-on-surface leading-relaxed">{oa.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const footer = seleccionados.size > 0 ? (
    <div className={cn(`${footerPx} py-3 bg-eyr-surface-low border-t border-eyr-outline-variant/15 flex items-center justify-between`)}>
      <span className="text-sm text-eyr-primary font-medium">
        {seleccionados.size} OA seleccionado{seleccionados.size !== 1 ? "s" : ""}
      </span>
      <button
        onClick={() => { setSeleccionados(new Set()); onSeleccion?.([]); }}
        className="text-xs text-eyr-on-variant hover:text-eyr-primary underline"
      >
        Limpiar selección
      </button>
    </div>
  ) : null;

  // ── Modo embedded: sin card ni encabezado ─────────────────────────────────────
  if (embedded) {
    return (
      <div>
        {filtros}
        <div className="rounded-xl border border-eyr-outline-variant/15 overflow-hidden">
          {lista}
          {footer}
        </div>
      </div>
    );
  }

  // ── Modo standalone: con card y encabezado ────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #4e45e4, #742fe5)" }}>
        <h2 className="text-white font-semibold text-lg" style={{ fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif" }}>
          Objetivos de Aprendizaje
        </h2>
        <p className="text-white/70 text-sm mt-0.5">
          Selecciona los OA que evaluará esta prueba
          {maxSeleccion ? ` (máx. ${maxSeleccion})` : ""}
          {soloBasales && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
              Solo OA Basales
            </span>
          )}
        </p>
      </div>
      {filtros}
      {lista}
      {footer}
    </div>
  );
}
