import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Loader2, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { ASIGNATURAS, CURSOS, CURSO_TO_LEVEL, OA_DATA } from '../data/objetivosAprendizaje';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { useSchedule, SCHEDULE_BLOCKS } from '../context/ScheduleContext';

const SUBJECT_TO_ASIG = {
    'Lenguaje': 'LE', 'Leng. y Lit.': 'LE', 'T. Lenguaje': 'LE', 'Taller Len': 'LE',
    'Matemática': 'MA', 'T. Matemática': 'MA',
    'Historia': 'HI', 'H. G. y Cs. S.': 'HI', 'For. Ciud.': 'HI',
    'Ciencias': 'CN', 'C. Nat': 'CN', 'T. Ciencias': 'CN',
    'Inglés': 'IN',
    'Artes': 'AV',
    'Música': 'MU', 'Música/Arte': 'MU',
    'Ed. Física': 'EF',
    'Tecnología': 'TE',
    'Orientación': 'OR', 'Religión': 'OR', 'Religión / FC': 'OR',
};

const getAsigName = (code) => ASIGNATURAS.find(a => a.code === code)?.name || code;

export default function CrearEvaluacionModal({ onClose, onCreated, user, defaultDate, evalId, initialData }) {
    const { addEvaluacion, updateEvaluacion, submitTeacherEdit, evaluaciones } = useEvaluaciones();
    const isEditing = !!evalId;
    const isTeacherEdit = isEditing && user?.role === 'teacher';
    const { getSchedule } = useSchedule();
    const [saving, setSaving] = useState(false);
    const [cursoDropdownOpen, setCursoDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const cursoButtonRef = useRef(null);
    const cursoDropdownRef = useRef(null);

    const openCursoDropdown = () => {
        if (cursoButtonRef.current) {
            const rect = cursoButtonRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setCursoDropdownOpen(true);
    };

    useEffect(() => {
        const handler = (e) => {
            if (
                cursoDropdownRef.current && !cursoDropdownRef.current.contains(e.target) &&
                cursoButtonRef.current && !cursoButtonRef.current.contains(e.target)
            ) setCursoDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isTeacher = user?.role === 'teacher';

    // Bloques del horario del profesor (solo cursos básicos con asignatura reconocida)
    const teacherBlocks = useMemo(() => {
        if (!isTeacher) return null;
        return getSchedule(user.uid).filter(b => CURSOS.includes(b.course) && SUBJECT_TO_ASIG[b.subject]);
    }, [isTeacher, getSchedule, user?.uid]);

    const availableCursos = useMemo(() => {
        if (!teacherBlocks || teacherBlocks.length === 0) return CURSOS;
        return [...new Set(teacherBlocks.map(b => b.course))].sort((a, b) => CURSOS.indexOf(a) - CURSOS.indexOf(b));
    }, [teacherBlocks]);

    const [curso, setCurso] = useState(initialData?.curso || '');
    const [asignatura, setAsignatura] = useState(initialData?.asignatura || '');
    const [selectedSlots, setSelectedSlots] = useState(initialData?.slots || []);
    const [name, setName] = useState(initialData?.name || '');
    const [selectedOas, setSelectedOas] = useState(initialData?.oaCodes || []);

    const oaList = useMemo(() => {
        if (!curso || !asignatura) return [];
        const level = CURSO_TO_LEVEL[curso];
        return OA_DATA[`${asignatura}${level}`] || [];
    }, [curso, asignatura]);

    const toggleOa = (code) =>
        setSelectedOas(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

    const date = defaultDate || new Date().toISOString().slice(0, 10);

    // Asignaturas disponibles para el curso seleccionado
    const asignaturasForCurso = useMemo(() => {
        if (!teacherBlocks || teacherBlocks.length === 0 || !curso) return ASIGNATURAS;
        const codes = [...new Set(
            teacherBlocks.filter(b => b.course === curso).map(b => SUBJECT_TO_ASIG[b.subject]).filter(Boolean)
        )];
        return ASIGNATURAS.filter(a => codes.includes(a.code));
    }, [teacherBlocks, curso]);

    // Auto-seleccionar asignatura si solo hay una opción
    const handleCursoChange = (newCurso) => {
        setCurso(newCurso);
        setSelectedOas([]);
        setSelectedSlots([]);
        const options = (() => {
            if (!teacherBlocks || teacherBlocks.length === 0 || !newCurso) return ASIGNATURAS;
            const codes = [...new Set(
                teacherBlocks.filter(b => b.course === newCurso).map(b => SUBJECT_TO_ASIG[b.subject]).filter(Boolean)
            )];
            return ASIGNATURAS.filter(a => codes.includes(a.code));
        })();
        setAsignatura(options.length === 1 ? options[0].code : '');
    };

    const handleAsignaturaChange = (code) => {
        setAsignatura(code);
        setSelectedSlots([]);
        setSelectedOas([]);
    };

    const availableSlots = useMemo(() => {
        if (!isTeacher || !teacherBlocks || !curso || !asignatura) return null;
        const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const relevant = teacherBlocks
            .filter(b => b.course === curso && SUBJECT_TO_ASIG[b.subject] === asignatura)
            .sort((a, b) => {
                const dayDiff = DIAS_ORDER.indexOf(a.day) - DIAS_ORDER.indexOf(b.day);
                return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
            });
        if (relevant.length === 0) return null;
        return relevant.map(b => {
            const block = SCHEDULE_BLOCKS.find(sb => sb.start === b.startTime);
            return { day: b.day, label: block?.label || b.startTime, startTime: b.startTime, endTime: block?.end || '' };
        });
    }, [isTeacher, teacherBlocks, curso, asignatura]);

    const hasConflict = useMemo(() => {
        if (!curso || !date || isEditing) return false;
        return evaluaciones.some(e => e.date === date && e.curso === curso);
    }, [evaluaciones, curso, date, isEditing]);

    const formValid = curso && asignatura && name.trim() && !hasConflict;

    const handleSubmit = async () => {
        if (!formValid) return;
        setSaving(true);
        try {
            if (isEditing) {
                const changes = {
                    name: name.trim(),
                    oa: selectedOas.join(', '),
                    oaCodes: selectedOas,
                    slots: selectedSlots.length > 0 ? selectedSlots : null,
                };
                const ok = isTeacherEdit
                    ? await submitTeacherEdit(evalId, changes, { id: user.uid, name: user.name })
                    : await updateEvaluacion(evalId, changes);
                if (!ok) return;
                onCreated?.(evalId, false);
                onClose();
            } else {
                const newId = await addEvaluacion({
                    name: name.trim(),
                    curso,
                    asignatura,
                    date,
                    slots: selectedSlots.length > 0 ? selectedSlots : null,
                    oa: selectedOas.join(', '),
                    oaCodes: selectedOas,
                    driveLink: '',
                    createdBy: { id: user.uid, name: user.name },
                    questions: [],
                });
                if (!newId) return;
                onCreated?.(newId, true);
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    const inputCls = 'w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-transparent focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface';

    return (
        <ModalContainer onClose={onClose}>
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                <div>
                    <h2 className="text-2xl font-headline font-extrabold text-eyr-on-surface tracking-tight">{isEditing ? 'Editar Evaluación' : 'Nueva Evaluación'}</h2>
                    {defaultDate && (
                        <p className="text-sm text-eyr-primary font-semibold mt-0.5">
                            {new Date(defaultDate + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    )}
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="px-8 py-4 overflow-y-auto space-y-5">

                {/* Curso */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-eyr-on-variant ml-1">Curso *</label>
                    <button
                        ref={cursoButtonRef}
                        type="button"
                        onClick={() => cursoDropdownOpen ? setCursoDropdownOpen(false) : openCursoDropdown()}
                        className={`${inputCls} flex items-center justify-between text-left`}
                    >
                        <span className={curso ? 'text-eyr-on-surface' : 'text-eyr-on-variant/50'}>
                            {curso || 'Seleccionar curso...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-eyr-on-variant shrink-0 transition-transform duration-200 ${cursoDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {cursoDropdownOpen && createPortal(
                        <div
                            ref={cursoDropdownRef}
                            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
                            className="bg-white rounded-2xl shadow-xl border border-eyr-outline-variant/10 overflow-hidden max-h-64 overflow-y-auto"
                        >
                            {availableCursos.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => { handleCursoChange(c); setCursoDropdownOpen(false); }}
                                    className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${
                                        curso === c
                                            ? 'bg-eyr-primary text-white'
                                            : 'text-eyr-on-surface hover:bg-eyr-surface-high'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>,
                        document.body
                    )}
                </div>

                {/* Asignatura — automática o seleccionable */}
                {curso && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">Asignatura</label>
                        {asignaturasForCurso.length === 1 ? (
                            <div className="px-5 py-4 rounded-2xl bg-eyr-primary-container/30 font-semibold text-eyr-primary">
                                {getAsigName(asignaturasForCurso[0].code)}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {asignaturasForCurso.map(a => (
                                    <button
                                        key={a.code}
                                        type="button"
                                        onClick={() => handleAsignaturaChange(a.code)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                            asignatura === a.code
                                                ? 'border-eyr-primary bg-eyr-primary-container/30 text-eyr-primary'
                                                : 'border-eyr-outline-variant/20 bg-eyr-surface-low text-eyr-on-variant hover:border-eyr-primary/40'
                                        }`}
                                    >
                                        {a.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Horarios disponibles — multi-seleccionables */}
                {availableSlots && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">
                            Horario de la evaluación
                            {selectedSlots.length > 0 && (
                                <span className="ml-2 text-xs font-semibold text-eyr-primary">
                                    ({selectedSlots.length} bloque{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''})
                                </span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSlots.map(({ day, label, startTime, endTime }) => {
                                const key = `${day}-${startTime}`;
                                const isSelected = selectedSlots.some(s => s.day === day && s.startTime === startTime);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedSlots(prev =>
                                            isSelected
                                                ? prev.filter(s => !(s.day === day && s.startTime === startTime))
                                                : [...prev, { day, label, startTime, endTime }]
                                        )}
                                        className={`flex flex-col items-start px-3 py-2 rounded-xl text-xs border-2 transition-all ${
                                            isSelected
                                                ? 'border-eyr-primary bg-eyr-primary-container/30'
                                                : 'border-eyr-outline-variant/20 bg-eyr-surface-low hover:border-eyr-primary/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-extrabold ${isSelected ? 'text-eyr-primary' : 'text-eyr-on-surface'}`}>
                                                {day.slice(0, 3).toUpperCase()}
                                            </span>
                                            <span className="opacity-30">·</span>
                                            <span className={`font-bold ${isSelected ? 'text-eyr-primary' : 'text-eyr-on-variant'}`}>{label}</span>
                                        </div>
                                        <span className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-eyr-primary/70' : 'text-eyr-on-variant/60'}`}>
                                            {startTime}{endTime ? `–${endTime}` : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Título */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-eyr-on-variant ml-1">Título de la Evaluación *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value.toUpperCase())}
                        placeholder="Ej: CONTROL DE LECTURA MENSUAL"
                        className={inputCls}
                    />
                </div>

                {/* OA */}
                {asignatura && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">
                            OA a evaluar
                            {selectedOas.length > 0 && (
                                <span className="ml-2 text-xs font-semibold text-eyr-primary">({selectedOas.length} seleccionado{selectedOas.length > 1 ? 's' : ''})</span>
                            )}
                        </label>
                        {oaList.length === 0 ? (
                            <p className="text-sm text-eyr-on-variant px-1">No hay OAs registrados para este curso y asignatura.</p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                {oaList.map(oa => {
                                    const selected = selectedOas.includes(oa.code);
                                    return (
                                        <button
                                            key={oa.code}
                                            type="button"
                                            onClick={() => toggleOa(oa.code)}
                                            className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                                                selected
                                                    ? 'border-eyr-primary bg-eyr-primary-container/30'
                                                    : 'border-eyr-outline-variant/20 bg-eyr-surface-low hover:border-eyr-primary/30'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className={`shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${selected ? 'bg-eyr-primary text-white' : 'bg-eyr-surface-high text-eyr-on-variant'}`}>
                                                    {oa.code.split('-').pop()}
                                                </span>
                                                <span className={`text-sm leading-snug ${selected ? 'text-eyr-on-surface font-medium' : 'text-eyr-on-variant'}`}>
                                                    {oa.description}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {hasConflict && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-xs text-amber-700">Ya hay una evaluación de <strong>{curso}</strong> programada para esta fecha.</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-eyr-surface-mid flex items-center justify-end gap-3 shrink-0">
                {isTeacherEdit && (
                    <p className="text-xs text-eyr-on-variant mr-auto">Los cambios quedarán en revisión hasta ser aprobados.</p>
                )}
                <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-all disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || saving}
                    className="px-8 py-3 rounded-2xl font-extrabold bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white shadow-lg shadow-eyr-primary/30 hover:shadow-eyr-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                >
                    {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? 'Guardando…' : 'Creando…'}</>
                        : isEditing ? <>Guardar cambios <Zap className="w-4 h-4" /></> : <>Crear Evaluación <Zap className="w-4 h-4" /></>
                    }
                </button>
            </div>
        </ModalContainer>
    );
}
