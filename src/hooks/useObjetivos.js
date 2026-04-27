// src/hooks/useObjetivos.js
// Hook para consultar Objetivos de Aprendizaje desde Firestore.
// Uso: const { cursos, asignaturas, objetivos, loading, error } = useObjetivos({ cursoSlug, asignaturaSlug })

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const COLLECTION = "curriculum";

// Cache en memoria: una sola carga de todos los docs por sesión
let allDocsCache = null;
let fetchPromise = null;

function fetchAll() {
  if (allDocsCache) return Promise.resolve(allDocsCache);
  if (fetchPromise) return fetchPromise;
  fetchPromise = getDocs(collection(db, COLLECTION))
    .then((snap) => {
      allDocsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return allDocsCache;
    });
  return fetchPromise;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useObjetivos({ cursoSlug = null, asignaturaSlug = null } = {}) {
  const [data, setData] = useState(allDocsCache || []);
  const [loading, setLoading] = useState(!allDocsCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (allDocsCache) return;
    let cancelled = false;
    fetchAll()
      .then((docs) => { if (!cancelled) setData(docs); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Lista única de cursos disponibles
  const cursos = useMemo(() => {
    const seen = new Set();
    return data
      .filter((d) => {
        if (seen.has(d.curso_slug)) return false;
        seen.add(d.curso_slug);
        return true;
      })
      .map((d) => ({ slug: d.curso_slug, nombre: d.curso_nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  // Lista única de asignaturas dentro del curso seleccionado
  const asignaturas = useMemo(() => {
    const seen = new Set();
    return data
      .filter((d) => {
        if (cursoSlug && d.curso_slug !== cursoSlug) return false;
        if (seen.has(d.asignatura_slug)) return false;
        seen.add(d.asignatura_slug);
        return true;
      })
      .map((d) => ({ slug: d.asignatura_slug, nombre: d.asignatura_nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data, cursoSlug]);

  // OA aplanados: [{codigo, descripcion, eje, indicadores_estructurales, ...}]
  const objetivos = useMemo(() => {
    const doc = data.find(
      (d) =>
        (!cursoSlug || d.curso_slug === cursoSlug) &&
        (!asignaturaSlug || d.asignatura_slug === asignaturaSlug)
    );
    if (!doc) return [];

    return (doc.ejes || []).flatMap((eje) =>
      (eje.objetivos || []).map((oa) => ({
        ...oa,
        eje: eje.nombre,
        curso: doc.curso_nombre,
        asignatura: doc.asignatura_nombre,
      }))
    );
  }, [data, cursoSlug, asignaturaSlug]);

  return { cursos, asignaturas, objetivos, loading, error };
}

// ─── Hook auxiliar para todos los cursos ─────────────────────────────────────
export function useCursos() {
  const [docs, setDocs] = useState(allDocsCache || []);
  const [loading, setLoading] = useState(!allDocsCache);

  useEffect(() => {
    if (allDocsCache) return;
    fetchAll()
      .then((d) => setDocs(d))
      .finally(() => setLoading(false));
  }, []);

  const cursos = useMemo(() => {
    const seen = new Set();
    return docs
      .filter((d) => {
        if (seen.has(d.curso_slug)) return false;
        seen.add(d.curso_slug);
        return true;
      })
      .map((d) => ({ slug: d.curso_slug, nombre: d.curso_nombre, nivel: d.nivel_nombre }));
  }, [docs]);

  return { cursos, loading };
}
