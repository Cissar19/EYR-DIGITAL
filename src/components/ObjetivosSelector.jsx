// src/components/ObjetivosSelector.jsx
// Selector de Objetivos de Aprendizaje para usar al crear evaluaciones.
//
// Props:
//   onSeleccion(oas: Array) — se llama cada vez que el profesor selecciona/deselecciona OA
//   seleccionados?: Array<string> — códigos de OA ya seleccionados (para editar una evaluación existente)
//   maxSeleccion?: number — límite de OA seleccionables (default: sin límite)

import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useObjetivos } from "../hooks/useObjetivos";
import { cn } from "../lib/utils";
import { BASALES_MINEDUC, SLUG_TO_GRADE, SUBJECT_TO_CURRICULUM_SLUG } from "../lib/coverageConstants";

// Mapeo inverso: slug currículum → clave de asignatura en BASALES_MINEDUC
const CURRICULUM_TO_SUBJECT = Object.fromEntries(
  Object.entries(SUBJECT_TO_CURRICULUM_SLUG).map(([k, v]) => [v, k])
);

const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Convierte código Firestore ("MA01 OA 03") al formato BASALES_MINEDUC ("OA03")
const toBasalKey = (codigo) => {
  const m = codigo.match(/OA\s*0*(\d+)/i);
  return m ? "OA" + String(m[1]).padStart(2, "0") : null;
};

const ASIGNATURAS_EXCLUIDAS = new Set([
  "ingles-propuesta",
  "lengua-cultura-pueblos-originarios-ancestrales",
]);

const CURSOS_ORDEN = [
  "1-basico", "2-basico", "3-basico", "4-basico", "5-basico", "6-basico",
  "7-basico", "8-basico", "1-medio", "2-medio", "3-medio-fg", "4-medio-fg",
];

export default function ObjetivosSelector({
  onSeleccion,
  seleccionados: seleccionadosProp = [],
  maxSeleccion,
  cursoNombreExterno,
  asignaturaNombreExterno,
  soloBasales = false,
  embedded = false,
}) {
  const [cursoSlug, setCursoSlug] = useState("");
  const [asignaturaSlug, setAsignaturaSlug] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ejeActivo, setEjeActivo] = useState("Todos");
  const [seleccionados, setSeleccionados] = useState(new Set(seleccionadosProp));
  const [isCursoOpen, setIsCursoOpen] = useState(false);
  const [isAsigOpen, setIsAsigOpen] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());

  const cursoRef = useRef(null);
  const asigRef = useRef(null);

  const { cursos, asignaturas, objetivos, loading, error } = useObjetivos({
    cursoSlug: cursoSlug || null,
    asignaturaSlug: asignaturaSlug || null,
  });

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (cursoRef.current && !cursoRef.current.contains(e.target)) setIsCursoOpen(false);
      if (asigRef.current && !asigRef.current.contains(e.target)) setIsAsigOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Ordenar cursos según el orden curricular
  const cursosOrdenados = useMemo(() =>
    [...cursos].sort(
      (a, b) => CURSOS_ORDEN.indexOf(a.slug) - CURSOS_ORDEN.indexOf(b.slug)
    ), [cursos]);

  const asignaturasFiltradas = useMemo(() =>
    asignaturas.filter((a) => !ASIGNATURAS_EXCLUIDAS.has(a.slug)),
    [asignaturas]);

  // Sincronizar con curso externo (modal) — guard prevents cascades
  useEffect(() => {
    if (!cursoNombreExterno || cursosOrdenados.length === 0) return;
    const match = cursosOrdenados.find((c) => c.nombre === cursoNombreExterno);
    if (match && match.slug !== cursoSlug) {
      setCursoSlug(match.slug); // eslint-disable-line react-hooks/set-state-in-effect
      setAsignaturaSlug(""); // eslint-disable-line react-hooks/set-state-in-effect
      setEjeActivo("Todos"); // eslint-disable-line react-hooks/set-state-in-effect
      setBusqueda(""); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [cursoNombreExterno, cursosOrdenados]);

  // Sincronizar con asignatura externa (modal) — guard prevents cascades
  useEffect(() => {
    if (!asignaturaNombreExterno || asignaturasFiltradas.length === 0) return;
    const match = asignaturasFiltradas.find(
      (a) => normalize(a.nombre) === normalize(asignaturaNombreExterno)
    );
    if (match && match.slug !== asignaturaSlug) {
      setAsignaturaSlug(match.slug); // eslint-disable-line react-hooks/set-state-in-effect
      setEjeActivo("Todos"); // eslint-disable-line react-hooks/set-state-in-effect
      setBusqueda(""); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [asignaturaNombreExterno, asignaturasFiltradas]);

  // Set de OA basales para el curso+asignatura actual (solo si soloBasales=true)
  const basalesSet = useMemo(() => {
    if (!soloBasales || !cursoSlug || !asignaturaSlug) return null;
    const grade = SLUG_TO_GRADE[cursoSlug];
    const subject = CURRICULUM_TO_SUBJECT[asignaturaSlug];
    if (!grade || !subject) return null;
    const codes = BASALES_MINEDUC[subject]?.[grade];
    return codes ? new Set(codes) : null;
  }, [soloBasales, cursoSlug, asignaturaSlug]);

  // Ejes únicos del curso+asignatura actual (solo de los OA visibles)
  const ejes = useMemo(() => {
    const base = basalesSet
      ? objetivos.filter((oa) => basalesSet.has(toBasalKey(oa.codigo)))
      : objetivos;
    const nombres = [...new Set(base.map((oa) => oa.eje))];
    return ["Todos", ...nombres];
  }, [objetivos, basalesSet]);

  // OA filtrados por búsqueda, eje y (si aplica) solo basales
  const oaFiltrados = useMemo(() => {
    return objetivos.filter((oa) => {
      if (basalesSet && !basalesSet.has(toBasalKey(oa.codigo))) return false;
      const matchEje = ejeActivo === "Todos" || oa.eje === ejeActivo;
      const termino = busqueda.toLowerCase();
      const matchBusqueda =
        !termino ||
        oa.codigo.toLowerCase().includes(termino) ||
        oa.descripcion.toLowerCase().includes(termino);
      return matchEje && matchBusqueda;
    });
  }, [objetivos, ejeActivo, busqueda, basalesSet]);

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

  function handleCursoSelect(slug) {
    setCursoSlug(slug);
    setAsignaturaSlug("");
    setEjeActivo("Todos");
    setBusqueda("");
    setIsCursoOpen(false);
  }

  function handleAsigSelect(slug) {
    setAsignaturaSlug(slug);
    setEjeActivo("Todos");
    setBusqueda("");
    setIsAsigOpen(false);
  }

  function toggleExpandir(codigo) {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }

  const cursoSeleccionado = cursosOrdenados.find((c) => c.slug === cursoSlug);
  const asigSeleccionada = asignaturasFiltradas.find((a) => a.slug === asignaturaSlug);

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
              cursoSlug ? "text-eyr-on-surface" : "text-eyr-on-variant/50"
            )}
          >
            <span className="truncate">
              {cursoSeleccionado ? cursoSeleccionado.nombre : "Seleccionar curso"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-eyr-on-variant shrink-0 transition-transform", isCursoOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isCursoOpen && (
              <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-eyr-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  {cursosOrdenados.map((c) => (
                    <button key={c.slug} type="button" onClick={() => handleCursoSelect(c.slug)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                        cursoSlug === c.slug ? "bg-eyr-surface-mid text-eyr-primary" : "text-eyr-on-surface hover:bg-eyr-surface-low"
                      )}
                    >
                      <span>{c.nombre}</span>
                      {cursoSlug === c.slug && <Check className="w-4 h-4 shrink-0 text-eyr-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown Asignatura */}
        <div ref={asigRef} className="relative">
          <label className="block text-xs font-medium text-eyr-on-variant mb-1">Asignatura</label>
          <button
            type="button"
            disabled={!cursoSlug || asignaturasFiltradas.length === 0}
            onClick={() => setIsAsigOpen((p) => !p)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium",
              isAsigOpen ? "border-eyr-primary bg-white shadow-sm" : "border-eyr-outline-variant/20 bg-eyr-surface-low hover:border-eyr-outline-variant/40",
              asignaturaSlug ? "text-eyr-on-surface" : "text-eyr-on-variant/50",
              (!cursoSlug || asignaturasFiltradas.length === 0) && "opacity-50 cursor-not-allowed hover:border-eyr-outline-variant/20"
            )}
          >
            <span className="truncate">
              {asigSeleccionada ? asigSeleccionada.nombre : "Seleccionar asignatura"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-eyr-on-variant shrink-0 transition-transform", isAsigOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isAsigOpen && (
              <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-eyr-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  {asignaturasFiltradas.map((a) => (
                    <button key={a.slug} type="button" onClick={() => handleAsigSelect(a.slug)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                        asignaturaSlug === a.slug ? "bg-eyr-surface-mid text-eyr-primary" : "text-eyr-on-surface hover:bg-eyr-surface-low"
                      )}
                    >
                      <span>{a.nombre}</span>
                      {asignaturaSlug === a.slug && <Check className="w-4 h-4 shrink-0 text-eyr-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Búsqueda */}
      {asignaturaSlug && (
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
      {asignaturaSlug && ejes.length > 2 && (
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
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando objetivos...
        </div>
      )}
      {error && (
        <div className="m-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          Error al cargar: {error}
        </div>
      )}
      {!loading && !error && !asignaturaSlug && (
        <div className="py-12 text-center text-gray-400 text-sm">
          Selecciona un curso y asignatura para ver los OA disponibles
        </div>
      )}
      {!loading && !error && asignaturaSlug && oaFiltrados.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">
          No se encontraron objetivos con ese filtro
        </div>
      )}
      {!loading && oaFiltrados.map((oa) => {
        const isSelected = seleccionados.has(oa.codigo);
        const isDisabled = !isSelected && maxSeleccion && seleccionados.size >= maxSeleccion;
        const isExpandido = expandidos.has(oa.codigo);
        const tieneDetalle = oa.descripcion || oa.indicadores_estructurales?.length > 0;

        return (
          <div
            key={oa.codigo}
            className={cn(
              `flex items-start gap-3 ${itemPx} py-3 border-b border-eyr-outline-variant/10 transition-colors last:border-b-0`,
              isSelected ? "bg-eyr-surface-low" : isDisabled ? "opacity-50 bg-white" : "bg-white"
            )}
          >
            <div className="mt-0.5 shrink-0" onClick={e => { e.stopPropagation(); if (!isDisabled) toggleOA(oa.codigo); }}>
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
                  {oa.eje && oa.eje !== "General" && (
                    <span className="text-xs text-eyr-on-variant/60 italic">{oa.eje}</span>
                  )}
                </div>
                {tieneDetalle && (
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
              {isExpandido && (
                <div className="mt-2">
                  <p className="text-sm text-eyr-on-surface leading-relaxed">{oa.descripcion}</p>
                  {oa.indicadores_estructurales?.length > 0 && (
                    <ul className="mt-2 space-y-1 pl-3 border-l-2 border-eyr-outline-variant/30">
                      {oa.indicadores_estructurales.map((ind, i) => (
                        <li key={i} className="text-xs text-eyr-on-variant/70 leading-relaxed">{ind}</li>
                      ))}
                    </ul>
                  )}
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
      {/* Encabezado */}
      <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #4e45e4, #742fe5)' }}>
        <h2 className="text-white font-semibold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif' }}>
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
