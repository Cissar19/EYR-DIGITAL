import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, User } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAuth } from '../../context/AuthContext';
import { useCoverageByTeacher } from '../../hooks/useCoverage';
import CoverageCard from '../../components/coverage/CoverageCard';
import YearSelector from '../../components/coverage/YearSelector';
import { GRADE_ORDER, SUBJECT_ORDER, GRADE_LABELS } from '../../lib/coverageConstants';

export default function CoberturaTeacherView() {
  const { teacherId: paramTeacherId } = useParams();
  const { user } = useAuth();
  const { year } = useAcademicYear();

  // Sin parámetro → usar el usuario logueado
  const teacherId = paramTeacherId || user?.id;
  const { data, loading, error } = useCoverageByTeacher(year, teacherId);

  const teacherName = data[0]?.teacherName ?? user?.name ?? 'Docente';

  // Ordenar: primero por curso, luego por asignatura
  const sorted = [...data].sort((a, b) => {
    const gi = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
    if (gi !== 0) return gi;
    return SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject);
  });

  // Agrupar por curso para mostrar secciones
  const byGrade = sorted.reduce((acc, b) => {
    if (!acc[b.grade]) acc[b.grade] = [];
    acc[b.grade].push(b);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/cobertura/dashboard"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-eyr-primary/10 flex items-center justify-center">
              <User size={16} className="text-eyr-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-eyr-on-surface">{teacherName}</h1>
              <p className="text-sm text-slate-500">Cobertura curricular {year}</p>
            </div>
          </div>
        </div>
        <YearSelector />
      </div>

      {/* Bloques por curso */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorMsg msg={error} />
      ) : sorted.length === 0 ? (
        <EmptyState year={year} />
      ) : (
        <div className="space-y-6">
          {GRADE_ORDER.filter(g => byGrade[g]).map(grade => (
            <section key={grade}>
              <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <Link
                  to={`/cobertura/curso/${grade}`}
                  className="hover:text-eyr-primary transition-colors"
                >
                  {GRADE_LABELS[grade] ?? grade}
                </Link>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 font-normal">{byGrade[grade].length} asignatura{byGrade[grade].length !== 1 ? 's' : ''}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byGrade[grade].map(block => (
                  <CoverageCard key={block.id} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ year }) {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-500 text-sm">No hay bloques asignados para este docente en {year}.</p>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
      Error al cargar datos: {msg}
    </div>
  );
}
