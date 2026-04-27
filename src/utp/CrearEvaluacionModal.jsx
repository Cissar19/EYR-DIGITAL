import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { ASIGNATURAS, CURSOS, CURSO_TO_LEVEL } from '../data/objetivosAprendizaje';
import ObjetivosSelector from '../components/ObjetivosSelector';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { useSchedule, SCHEDULE_BLOCKS, SUBJECT_TO_ASIG } from '../context/ScheduleContext';

const getAsigName = (code) => ASIGNATURAS.find(a => a.code === code)?.name || code;

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie'];
const DIA_TO_DOW = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };

function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = new Date(firstDay);
    const startDow = start.getDay();
    start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));
    const end = new Date(lastDay);
    const endDow = end.getDay();
    if (endDow === 0) end.setDate(end.getDate() - 2);
    else if (endDow === 6) end.setDate(end.getDate() - 1);
    else if (endDow < 5) end.setDate(end.getDate() + (5 - endDow));
    const weeks = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        const week = [];
        for (let d = 0; d < 5; d++) {
            const day = new Date(cursor);
            day.setDate(cursor.getDate() + d);
            week.push({ dateStr: day.toISOString().slice(0, 10), inMonth: day.getMonth() === month && day.getFullYear() === year });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

function DatePickerField({ value, onChange, inputCls, allowedWeekdays }) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const initDate = value ? new Date(value + 'T12:00:00') : new Date();
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(initDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initDate.getMonth());
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const btnRef = useRef(null);
    const pickerRef = useRef(null);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Modo lista: próximas fechas válidas cuando hay días restringidos
    const nextValidDates = useMemo(() => {
        if (!allowedWeekdays || allowedWeekdays.length === 0) return null;
        const dates = [];
        const cursor = new Date(todayStr + 'T12:00:00');
        while (dates.length < 8) {
            if (allowedWeekdays.includes(cursor.getDay()))
                dates.push(cursor.toISOString().slice(0, 10));
            cursor.setDate(cursor.getDate() + 1);
        }
        return dates;
    }, [allowedWeekdays, todayStr]);

    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openPicker = () => {
        if (value && !nextValidDates) {
            const d = new Date(value + 'T12:00:00');
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const pickerH = nextValidDates ? 340 : 360;
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const top = spaceBelow >= pickerH ? rect.bottom + 4 : rect.top - pickerH - 4;
            setPos({ top, left: rect.left, width: Math.max(rect.width, nextValidDates ? 280 : 320) });
        }
        setOpen(o => !o);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };
    const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);
    const weeks = buildMonthGrid(viewYear, viewMonth);

    const displayLabel = value
        ? new Date(value + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
        : null;
    const diff = value
        ? Math.round((new Date(value + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / 86400000)
        : null;
    const restoLabel = diff === null ? null
        : diff === 0 ? 'es hoy'
        : diff === 1 ? 'queda 1 día'
        : diff > 1 ? `quedan ${diff} días`
        : `hace ${-diff} día${-diff !== 1 ? 's' : ''}`;

    return (
        <>
            <button ref={btnRef} type="button" onClick={openPicker}
                className={`${inputCls} flex items-center justify-between text-left`}>
                <span className={value ? 'text-eyr-on-surface capitalize' : 'text-eyr-on-variant/50'}>
                    {displayLabel ?? 'Seleccionar fecha'}
                </span>
                <ChevronDown className={`w-4 h-4 text-eyr-on-variant shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {displayLabel && (
                <p className="text-sm font-semibold text-eyr-primary capitalize ml-1">
                    {displayLabel} · <span className={diff < 0 ? 'text-red-400' : 'text-eyr-on-variant'}>{restoLabel}</span>
                </p>
            )}

            {open && createPortal(
                <div ref={pickerRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white rounded-3xl shadow-2xl border border-eyr-outline-variant/10 overflow-hidden">

                    {/* MODO LISTA — slots seleccionados */}
                    {nextValidDates ? (
                        <div className="overflow-hidden">
                            <div className="px-5 py-3 bg-eyr-primary">
                                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Próximas fechas disponibles</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-3">
                                {nextValidDates.map(dateStr => {
                                    const isSelected = dateStr === value;
                                    const d = Math.round((new Date(dateStr + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / 86400000);
                                    const lbl = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
                                    const resto = d === 0 ? 'hoy' : d === 1 ? '1 día' : `${d} días`;
                                    return (
                                        <button key={dateStr} type="button"
                                            onClick={() => { onChange(dateStr); setOpen(false); }}
                                            className={`flex flex-col items-start px-3 py-2.5 rounded-2xl border-2 transition-all text-left
                                                ${isSelected
                                                    ? 'border-eyr-primary bg-eyr-primary/10'
                                                    : 'border-eyr-outline-variant/20 hover:border-eyr-primary/40 hover:bg-eyr-surface-high'}`}>
                                            <span className={`capitalize text-xs font-bold leading-tight ${isSelected ? 'text-eyr-primary' : 'text-eyr-on-surface'}`}>{lbl}</span>
                                            <span className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-eyr-primary/70' : 'text-eyr-on-variant'}`}>{resto}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* MODO CALENDARIO — sin restricción de día */
                        <>
                            <div className="flex items-center justify-between px-4 py-3 bg-eyr-primary">
                                <button type="button" onClick={prevMonth} disabled={!canGoPrev}
                                    className="p-1.5 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-white tracking-wide">{MESES[viewMonth]} {viewYear}</span>
                                <button type="button" onClick={nextMonth}
                                    className="p-1.5 rounded-xl text-white/80 hover:bg-white/20 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-5 border-b border-eyr-outline-variant/10">
                                {DIAS_CORTOS.map(d => (
                                    <div key={d} className="py-2 text-center text-xs font-bold text-eyr-on-variant uppercase tracking-wider bg-eyr-surface-high/40">{d}</div>
                                ))}
                            </div>
                            {weeks.map((week, wi) => (
                                <div key={wi} className={`grid grid-cols-5 ${wi < weeks.length - 1 ? 'border-b border-eyr-outline-variant/10' : ''}`}>
                                    {week.map(({ dateStr, inMonth }) => {
                                        if (!inMonth) return <div key={dateStr} />;
                                        const isPast = dateStr < todayStr;
                                        const isToday = dateStr === todayStr;
                                        const isSelected = dateStr === value;
                                        const clickable = !isPast;
                                        const dayNum = parseInt(dateStr.split('-')[2]);
                                        return (
                                            <button key={dateStr} type="button" disabled={!clickable}
                                                onClick={() => { onChange(dateStr); setOpen(false); }}
                                                className={`py-2.5 flex items-center justify-center transition-colors
                                                    ${!clickable ? 'cursor-not-allowed' : 'hover:bg-eyr-primary-container/20 cursor-pointer'}
                                                    ${isSelected ? 'bg-eyr-primary/10' : ''}`}>
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold
                                                    ${isSelected ? 'bg-eyr-primary text-white font-extrabold' : ''}
                                                    ${isToday && !isSelected ? 'ring-2 ring-eyr-primary text-eyr-primary font-extrabold' : ''}
                                                    ${!isSelected && !isToday && clickable ? 'text-eyr-on-surface' : ''}
                                                    ${!clickable ? 'text-slate-300' : ''}`}>
                                                    {dayNum}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

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
        if (teacherBlocks === null) return CURSOS; // no es teacher → todos
        if (teacherBlocks.length === 0) return []; // teacher sin horario → ninguno
        return [...new Set(teacherBlocks.map(b => b.course))].sort((a, b) => CURSOS.indexOf(a) - CURSOS.indexOf(b));
    }, [teacherBlocks]);

    const [curso, setCurso] = useState(initialData?.curso || '');
    const [asignatura, setAsignatura] = useState(initialData?.asignatura || '');
    const [selectedSlots, setSelectedSlots] = useState(initialData?.slots || []);
    const [name, setName] = useState(initialData?.name || '');
    const [selectedOas, setSelectedOas] = useState(initialData?.oaCodes || []);
    const [editDate, setEditDate] = useState(initialData?.date || defaultDate || '');


    const date = defaultDate || editDate;

    // Asignaturas disponibles para el curso seleccionado
    const asignaturasForCurso = useMemo(() => {
        if (teacherBlocks === null) return ASIGNATURAS; // no es teacher → todas
        if (teacherBlocks.length === 0 || !curso) return []; // teacher sin horario → ninguna
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
            if (teacherBlocks === null) return ASIGNATURAS;
            if (teacherBlocks.length === 0 || !newCurso) return [];
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

    // Días de semana permitidos en el picker según los slots seleccionados
    const allowedWeekdays = useMemo(() => {
        if (selectedSlots.length === 0) return null;
        return [...new Set(selectedSlots.map(s => DIA_TO_DOW[s.day]).filter(Boolean))];
    }, [selectedSlots]);

    // Determina si un slot puede ser seleccionado dado el estado actual
    const canSelectSlot = (day, startTime, endTime) => {
        if (selectedSlots.length === 0) return true;
        // Debe ser el mismo día
        if (day !== selectedSlots[0].day) return false;
        // Debe ser adyacente al rango actual (antes o después)
        const minStart = selectedSlots.reduce((m, s) => s.startTime < m ? s.startTime : m, selectedSlots[0].startTime);
        const maxEnd   = selectedSlots.reduce((m, s) => s.endTime   > m ? s.endTime   : m, selectedSlots[0].endTime);
        return startTime === maxEnd || endTime === minStart;
    };

    // Toggle slot: solo permite mismo día y bloques consecutivos
    const toggleSlot = (day, label, startTime, endTime) => {
        const isSelected = selectedSlots.some(s => s.day === day && s.startTime === startTime);
        if (!isSelected && !canSelectSlot(day, startTime, endTime)) return;
        const newSlots = isSelected
            ? selectedSlots.filter(s => !(s.day === day && s.startTime === startTime))
            : [...selectedSlots, { day, label, startTime, endTime }];
        setSelectedSlots(newSlots);
        if (editDate && newSlots.length > 0) {
            const dow = new Date(editDate + 'T12:00:00').getDay();
            const newAllowed = new Set(newSlots.map(s => DIA_TO_DOW[s.day]).filter(Boolean));
            if (!newAllowed.has(dow)) setEditDate('');
        }
    };

    const hasConflict = useMemo(() => {
        if (!curso || !date || isEditing) return false;
        return evaluaciones.some(e => e.date === date && e.curso === curso);
    }, [evaluaciones, curso, date, isEditing]);

    const formValid = curso && asignatura && name.trim() && date && !hasConflict;

    const handleSubmit = async () => {
        if (!formValid) return;
        setSaving(true);
        try {
            if (isEditing) {
                const changes = {
                    name: name.trim(),
                    date: editDate,
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

                {/* Aviso: profesor sin horario configurado */}
                {isTeacher && teacherBlocks !== null && teacherBlocks.length === 0 && (
                    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        No tienes horario configurado. Contacta a la jefa UTP para que asigne tus cursos y asignaturas.
                    </div>
                )}

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
                                const isBlocked = !isSelected && !canSelectSlot(day, startTime, endTime);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={isBlocked}
                                        onClick={() => toggleSlot(day, label, startTime, endTime)}
                                        className={`flex flex-col items-start px-3 py-2 rounded-xl text-xs border-2 transition-all ${
                                            isSelected
                                                ? 'border-eyr-primary bg-eyr-primary-container/30'
                                                : isBlocked
                                                ? 'border-eyr-outline-variant/10 bg-eyr-surface-low opacity-30 cursor-not-allowed'
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

                {/* Fecha — en edición o cuando no viene de un clic en el calendario */}
                {(isEditing || !defaultDate) && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">Fecha</label>
                        <DatePickerField
                            value={editDate}
                            onChange={setEditDate}
                            inputCls={inputCls}
                            allowedWeekdays={allowedWeekdays}
                        />
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
                <ObjetivosSelector
                    onSeleccion={(oas) => setSelectedOas(oas.map(oa => oa.codigo))}
                    seleccionados={selectedOas}
                    cursoNombreExterno={curso || undefined}
                    asignaturaNombreExterno={asignatura ? getAsigName(asignatura) : undefined}
                />

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
