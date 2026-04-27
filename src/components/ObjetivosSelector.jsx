// src/components/ObjetivosSelector.jsx
// Selector de Objetivos de Aprendizaje para usar al crear evaluaciones.
//
// Props:
//   onSeleccion(oas: Array) — se llama cada vez que el profesor selecciona/deselecciona OA
//   seleccionados?: Array<string> — códigos de OA ya seleccionados (para editar una evaluación existente)
//   maxSeleccion?: number — límite de OA seleccionables (default: sin límite)

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useObjetivos } from "../hooks/useObjetivos";
import { cn } from "../lib/utils";

const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
}) {
  const [cursoSlug, setCursoSlug] = useState("");
  const [asignaturaSlug, setAsignaturaSlug] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ejeActivo, setEjeActivo] = useState("Todos");
  const [seleccionados, setSeleccionados] = useState(new Set(seleccionadosProp));
  const [isCursoOpen, setIsCursoOpen] = useState(false);
  const [isAsigOpen, setIsAsigOpen] = useState(false);

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

  // Sincronizar con curso externo (modal)
  useEffect(() => {
    if (!cursoNombreExterno || cursosOrdenados.length === 0) return;
    const match = cursosOrdenados.find((c) => c.nombre === cursoNombreExterno);
    if (match && match.slug !== cursoSlug) {
      setCursoSlug(match.slug);
      setAsignaturaSlug("");
      setEjeActivo("Todos");
      setBusqueda("");
    }
  }, [cursoNombreExterno, cursosOrdenados]);

  // Sincronizar con asignatura externa (modal)
  useEffect(() => {
    if (!asignaturaNombreExterno || asignaturasFiltradas.length === 0) return;
    const match = asignaturasFiltradas.find(
      (a) => normalize(a.nombre) === normalize(asignaturaNombreExterno)
    );
    if (match && match.slug !== asignaturaSlug) {
      setAsignaturaSlug(match.slug);
      setEjeActivo("Todos");
      setBusqueda("");
    }
  }, [asignaturaNombreExterno, asignaturasFiltradas]);

  // Ejes únicos del curso+asignatura actual
  const ejes = useMemo(() => {
    const nombres = [...new Set(objetivos.map((oa) => oa.eje))];
    return ["Todos", ...nombres];
  }, [objetivos]);

  // OA filtrados por búsqueda y eje
  const oaFiltrados = useMemo(() => {
    return objetivos.filter((oa) => {
      const matchEje = ejeActivo === "Todos" || oa.eje === ejeActivo;
      const termino = busqueda.toLowerCase();
      const matchBusqueda =
        !termino ||
        oa.codigo.toLowerCase().includes(termino) ||
        oa.descripcion.toLowerCase().includes(termino);
      return matchEje && matchBusqueda;
    });
  }, [objetivos, ejeActivo, busqueda]);

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

  const cursoSeleccionado = cursosOrdenados.find((c) => c.slug === cursoSlug);
  const asigSeleccionada = asignaturasFiltradas.find((a) => a.slug === asignaturaSlug);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
        <h2 className="text-white font-semibold text-lg">
          Objetivos de Aprendizaje
        </h2>
        <p className="text-indigo-200 text-sm mt-0.5">
          Selecciona los OA que evaluará esta prueba
          {maxSeleccion ? ` (máx. ${maxSeleccion})` : ""}
        </p>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <div className="grid grid-cols-2 gap-3">

          {/* Dropdown Curso */}
          <div ref={cursoRef} className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Curso
            </label>
            <button
              type="button"
              onClick={() => setIsCursoOpen((p) => !p)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium",
                isCursoOpen
                  ? "border-indigo-500 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200",
                cursoSlug ? "text-slate-800" : "text-slate-400"
              )}
            >
              <span className="truncate">
                {cursoSeleccionado ? cursoSeleccionado.nombre : "Seleccionar curso"}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", isCursoOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isCursoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="max-h-56 overflow-y-auto">
                    {cursosOrdenados.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => handleCursoSelect(c.slug)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                          cursoSlug === c.slug
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{c.nombre}</span>
                        {cursoSlug === c.slug && <Check className="w-4 h-4 shrink-0 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown Asignatura */}
          <div ref={asigRef} className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Asignatura
            </label>
            <button
              type="button"
              disabled={!cursoSlug || asignaturasFiltradas.length === 0}
              onClick={() => setIsAsigOpen((p) => !p)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium",
                isAsigOpen
                  ? "border-indigo-500 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200",
                asignaturaSlug ? "text-slate-800" : "text-slate-400",
                (!cursoSlug || asignaturasFiltradas.length === 0) && "opacity-50 cursor-not-allowed hover:border-slate-100"
              )}
            >
              <span className="truncate">
                {asigSeleccionada ? asigSeleccionada.nombre : "Seleccionar asignatura"}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", isAsigOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isAsigOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="max-h-56 overflow-y-auto">
                    {asignaturasFiltradas.map((a) => (
                      <button
                        key={a.slug}
                        type="button"
                        onClick={() => handleAsigSelect(a.slug)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                          asignaturaSlug === a.slug
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{a.nombre}</span>
                        {asignaturaSlug === a.slug && <Check className="w-4 h-4 shrink-0 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Búsqueda */}
        {asignaturaSlug && (
          <div className="relative">
            <svg
              className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
        )}

        {/* Filtro por Eje */}
        {asignaturaSlug && ejes.length > 2 && (
          <div className="flex gap-2 flex-wrap">
            {ejes.map((eje) => (
              <button
                key={eje}
                onClick={() => setEjeActivo(eje)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border transition-colors",
                  ejeActivo === eje
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                )}
              >
                {eje}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de OA */}
      <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z" />
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

          return (
            <label
              key={oa.codigo}
              className={cn(
                "flex items-start gap-3 px-6 py-4 cursor-pointer border-b border-gray-50 transition-colors last:border-b-0",
                isSelected
                  ? "bg-indigo-50"
                  : isDisabled
                  ? "opacity-50 cursor-not-allowed bg-white"
                  : "hover:bg-gray-50 bg-white"
              )}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && toggleOA(oa.codigo)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />

              {/* Contenido del OA */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded",
                    isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                  )}>
                    {oa.codigo}
                  </span>
                  {oa.eje && oa.eje !== "General" && (
                    <span className="text-xs text-gray-400 italic">{oa.eje}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {oa.descripcion}
                </p>

                {/* Sub-ítems del OA (si los tiene) */}
                {oa.indicadores_estructurales?.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-3 border-l-2 border-gray-200">
                    {oa.indicadores_estructurales.map((ind, i) => (
                      <li key={i} className="text-xs text-gray-500 leading-relaxed">
                        {ind}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Footer: OA seleccionados */}
      {seleccionados.size > 0 && (
        <div className="px-6 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
          <span className="text-sm text-indigo-700 font-medium">
            {seleccionados.size} OA seleccionado{seleccionados.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              setSeleccionados(new Set());
              onSeleccion?.([]);
            }}
            className="text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            Limpiar selección
          </button>
        </div>
      )}
    </div>
  );
}
