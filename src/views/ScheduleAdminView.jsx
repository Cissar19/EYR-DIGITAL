import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Save, Trash2, ChevronDown, Eye, Edit3, User, Coffee, X, ClipboardList, Search, BarChart2, BookOpen, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, canEdit as canEditHelper } from '../context/AuthContext';
import { useSchedule, SCHEDULE_BLOCKS, DAYS, COURSES_LIST, SUBJECTS_LIST } from '../context/ScheduleContext';

export default function ScheduleAdminView() {
    const { user, getAllUsers } = useAuth();
    const { getSchedule, updateSchedule, deleteSchedule, loadDefaultIfNeeded } = useSchedule();
    const userCanEdit = canEditHelper(user);

    // State — only teacher selector needed now
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [scheduleData, setScheduleData] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [showFullTime, setShowFullTime] = useState(false);
    const [ftCourse, setFtCourse] = useState('');
    const [ftSubject, setFtSubject] = useState('');

    const teachers = React.useMemo(() => {
        return getAllUsers().filter(u => u.role === ROLES.TEACHER);
    }, [getAllUsers]);

    // Load schedule when teacher is selected
    useEffect(() => {
        if (selectedTeacherId) {
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            setSelectedTeacher(teacher);

            loadDefaultIfNeeded(selectedTeacherId, teacher?.email);

            const schedule = getSchedule(selectedTeacherId);
            const scheduleObj = {};
            schedule.forEach(block => {
                const key = `${block.day}-${block.startTime}`;
                scheduleObj[key] = block;
            });
            setScheduleData(scheduleObj);
        } else {
            setSelectedTeacher(null);
            setScheduleData({});
        }
    }, [selectedTeacherId, getSchedule, teachers, loadDefaultIfNeeded]);

    // Update a cell with course + subject
    const updateCell = (day, startTime, course, subject) => {
        const key = `${day}-${startTime}`;

        if (!course) {
            // Clear entire cell if course is removed
            setScheduleData(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
        } else {
            setScheduleData(prev => ({
                ...prev,
                [key]: { day, startTime, subject: subject || '', course }
            }));
        }
    };

    // Clear a cell completely
    const clearCell = (day, startTime) => {
        const key = `${day}-${startTime}`;
        setScheduleData(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    // Fill all class blocks with a single course + subject
    const fillFullTime = () => {
        if (!ftCourse) return;
        const newData = { ...scheduleData };
        for (const block of displayBlocks) {
            if (block.type === 'break') continue;
            for (const day of DAYS) {
                const key = `${day}-${block.start}`;
                newData[key] = {
                    day,
                    startTime: block.start,
                    course: ftCourse,
                    subject: block.type === 'special' ? 'Jefatura' : (ftSubject || ''),
                };
            }
        }
        setScheduleData(newData);
        setShowFullTime(false);
        setFtCourse('');
        setFtSubject('');
    };

    // Handle save
    const handleSave = () => {
        if (!selectedTeacherId) return;
        const scheduleArray = Object.values(scheduleData).filter(block =>
            block.course && block.course.trim() !== ''
        );
        updateSchedule(selectedTeacherId, scheduleArray, selectedTeacher?.name);
    };

    // Handle delete
    const handleDelete = () => {
        if (!selectedTeacherId || !window.confirm(`¿Estás seguro de eliminar el horario de ${selectedTeacher?.name}?`)) {
            return;
        }
        deleteSchedule(selectedTeacherId, selectedTeacher?.name);
        setScheduleData({});
    };

    const canShowSchedule = !!selectedTeacherId;

    // Compute which blocks to show — dynamically derived when teacher has non-standard times (Pre-K/Kinder)
    const displayBlocks = React.useMemo(() => {
        if (!selectedTeacherId || Object.keys(scheduleData).length === 0) return SCHEDULE_BLOCKS;

        const standardTimes = new Set(SCHEDULE_BLOCKS.map(b => b.start));
        const teacherTimes = new Set(
            Object.keys(scheduleData).map(k => k.split('-').slice(1).join('-'))
        );
        const hasNonStandard = [...teacherTimes].some(t => !standardTimes.has(t));
        if (!hasNonStandard) return SCHEDULE_BLOCKS;

        const sorted = [...teacherTimes].sort();
        return sorted.map((t, i) => ({
            id: `t_${t.replace(':', '')}`,
            start: t,
            end: sorted[i + 1] || '',
            label: `${i + 1}°`,
            type: 'class',
        }));
    }, [selectedTeacherId, scheduleData]);

    // Get cell data helper
    const getCellData = (day, startTime) => {
        const key = `${day}-${startTime}`;
        return scheduleData[key] || null;
    };

    // Calcular horas en aula y horas libres
    const calcularHoras = () => {
        const bloquesClase = displayBlocks.filter(b => b.type === 'class');
        const totalBloques = bloquesClase.length * DAYS.length; // 8 × 5 = 40
        const minutosPorBloque = 45;

        let bloquesOcupados = 0;
        for (const block of bloquesClase) {
            for (const day of DAYS) {
                const key = `${day}-${block.start}`;
                if (scheduleData[key]?.course) {
                    bloquesOcupados++;
                }
            }
        }

        const bloquesLibres = totalBloques - bloquesOcupados;
        const horasAula = (bloquesOcupados * minutosPorBloque) / 60;
        const horasLibres = (bloquesLibres * minutosPorBloque) / 60;
        const porcentajeOcupacion = totalBloques > 0 ? Math.round((bloquesOcupados / totalBloques) * 100) : 0;

        return { totalBloques, bloquesOcupados, bloquesLibres, horasAula, horasLibres, porcentajeOcupacion };
    };

    const horasInfo = canShowSchedule ? calcularHoras() : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-300/50 shrink-0">
                                <CalendarClock className="w-6 h-6 md:w-8 md:h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-light text-slate-900 tracking-tight">
                                    Gestión de Horarios
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    Vista semanal • Curso + Asignatura por bloque
                                </p>
                            </div>
                        </div>

                        {/* Mode Toggle */}
                        {canShowSchedule && userCanEdit && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 shadow-lg"
                            >
                                <button
                                    onClick={() => setIsEditMode(false)}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                                        !isEditMode
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Eye className="w-4 h-4" />
                                    Vista
                                </button>
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                                        isEditMode
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Editar
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Teacher Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative z-20 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 mb-10"
                >
                    <div className="max-w-md">
                        <TeacherCombobox
                            teachers={teachers}
                            selectedTeacherId={selectedTeacherId}
                            onSelect={setSelectedTeacherId}
                        />
                    </div>
                </motion.div>

                {/* Weekly Grid */}
                {canShowSchedule ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Grid Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                                        Horario Semanal
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedTeacher?.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEditMode && (
                                        <>
                                            <button
                                                onClick={() => setShowFullTime(v => !v)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-md border",
                                                    showFullTime
                                                        ? "bg-teal-500 text-white border-teal-500"
                                                        : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                                                )}
                                            >
                                                <ClipboardList className="w-3.5 h-3.5" />
                                                Tiempo Completo
                                            </button>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-medium shadow-lg">
                                                <Edit3 className="w-3.5 h-3.5" />
                                                Modo Edición Activo
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Full-time assignment panel */}
                            {isEditMode && showFullTime && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-6 bg-teal-50 border-2 border-teal-200 rounded-2xl p-5"
                                >
                                    <p className="text-sm font-semibold text-teal-800 mb-3">
                                        Asignar tiempo completo — llena todos los bloques de clase con un solo curso
                                    </p>
                                    <div className="flex flex-wrap items-end gap-4">
                                        <div className="flex-1 min-w-0 w-full md:min-w-[180px]">
                                            <label className="text-xs font-medium text-teal-700 mb-1 block">Curso</label>
                                            <div className="relative">
                                                <select
                                                    value={ftCourse}
                                                    onChange={(e) => setFtCourse(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border-2 border-teal-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none text-sm appearance-none bg-white"
                                                >
                                                    <option value="">Seleccionar curso...</option>
                                                    {COURSES_LIST.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 w-full md:min-w-[180px]">
                                            <label className="text-xs font-medium text-teal-700 mb-1 block">Asignatura (opcional)</label>
                                            <div className="relative">
                                                <select
                                                    value={ftSubject}
                                                    onChange={(e) => setFtSubject(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border-2 border-teal-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none text-sm appearance-none bg-white"
                                                >
                                                    <option value="">Sin asignatura fija</option>
                                                    {SUBJECTS_LIST.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={fillFullTime}
                                                disabled={!ftCourse}
                                                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                                            >
                                                Aplicar
                                            </button>
                                            <button
                                                onClick={() => { setShowFullTime(false); setFtCourse(''); setFtSubject(''); }}
                                                className="px-4 py-2 rounded-xl text-sm font-medium text-teal-700 bg-white border border-teal-200 hover:bg-teal-50 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-teal-600 mt-3">
                                        Esto reemplazará todos los bloques existentes. La Jefatura se mantiene automáticamente. Luego puedes ajustar celdas individuales.
                                    </p>
                                </motion.div>
                            )}

                            {/* Schedule Table */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200 min-w-[120px]">
                                                    Bloque
                                                </th>
                                                {DAYS.map(day => (
                                                    <th key={day} className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border-b-2 border-slate-200 min-w-[160px]">
                                                        {day}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayBlocks.map((block) => {
                                                const isBreak = block.type === 'break';
                                                const isSpecial = block.type === 'special';

                                                // Break / lunch rows — merged, non-editable
                                                if (isBreak) {
                                                    return (
                                                        <tr key={block.id}>
                                                            <td className="sticky left-0 z-10 bg-amber-50 px-4 py-2 border-b border-amber-100">
                                                                <div className="flex items-center gap-2">
                                                                    <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                                                    <span className="text-xs font-semibold text-amber-700">{block.label}</span>
                                                                </div>
                                                                <div className="text-[10px] text-amber-500 tabular-nums">{block.start} - {block.end}</div>
                                                            </td>
                                                            <td colSpan={5} className="bg-amber-50/50 px-4 py-2 border-b border-amber-100 text-center">
                                                                <span className="text-xs text-amber-500 italic">{block.label === 'Almuerzo' ? 'Almuerzo' : 'Recreo'}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return (
                                                    <tr key={block.id}>
                                                        {/* Block label column */}
                                                        <td className={cn(
                                                            "sticky left-0 z-10 px-4 py-2 border-b border-slate-100",
                                                            isSpecial ? "bg-orange-50" : "bg-white"
                                                        )}>
                                                            <div className={cn(
                                                                "text-xs font-semibold",
                                                                isSpecial ? "text-orange-600" : "text-slate-700"
                                                            )}>
                                                                {block.label}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 tabular-nums">{block.start} - {block.end}</div>
                                                        </td>

                                                        {/* Day cells */}
                                                        {DAYS.map(day => {
                                                            const cellData = getCellData(day, block.start);
                                                            const hasData = cellData && cellData.course;

                                                            return (
                                                                <td key={day} className="px-1.5 py-1.5 border-b border-slate-100 border-l border-slate-50">
                                                                    {isEditMode ? (
                                                                        <EditCell
                                                                            cellData={cellData}
                                                                            day={day}
                                                                            startTime={block.start}
                                                                            isSpecial={isSpecial}
                                                                            updateCell={updateCell}
                                                                            clearCell={clearCell}
                                                                        />
                                                                    ) : (
                                                                        <ViewCell
                                                                            cellData={cellData}
                                                                            isSpecial={isSpecial}
                                                                            hasData={hasData}
                                                                        />
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>

                        {/* Panel de resumen de horas */}
                        {horasInfo && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="mt-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6"
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <BarChart2 className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-base font-semibold text-slate-800">Resumen de Carga Horaria Semanal</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                                    {/* Horas en aula */}
                                    <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">Horas en Aula</p>
                                            <p className="text-2xl font-bold text-blue-800">
                                                {Number.isInteger(horasInfo.horasAula) ? horasInfo.horasAula : horasInfo.horasAula.toFixed(1)}
                                                <span className="text-sm font-normal text-blue-500 ml-1">hrs</span>
                                            </p>
                                            <p className="text-[11px] text-blue-400">{horasInfo.bloquesOcupados} bloques ocupados</p>
                                        </div>
                                    </div>

                                    {/* Horas libres */}
                                    <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-emerald-500 uppercase tracking-wide">Horas Libres</p>
                                            <p className="text-2xl font-bold text-emerald-800">
                                                {Number.isInteger(horasInfo.horasLibres) ? horasInfo.horasLibres : horasInfo.horasLibres.toFixed(1)}
                                                <span className="text-sm font-normal text-emerald-500 ml-1">hrs</span>
                                            </p>
                                            <p className="text-[11px] text-emerald-400">{horasInfo.bloquesLibres} bloques disponibles</p>
                                        </div>
                                    </div>

                                    {/* Ocupación */}
                                    <div className="flex items-center gap-4 bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <CalendarClock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-purple-500 uppercase tracking-wide">Ocupación</p>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {horasInfo.porcentajeOcupacion}
                                                <span className="text-sm font-normal text-purple-500 ml-0.5">%</span>
                                            </p>
                                            <p className="text-[11px] text-purple-400">{horasInfo.bloquesOcupados} / {horasInfo.totalBloques} bloques</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de progreso */}
                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                                        <span>Bloques ocupados</span>
                                        <span>{horasInfo.bloquesOcupados} / {horasInfo.totalBloques}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                            style={{ width: `${horasInfo.porcentajeOcupacion}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] mt-1.5">
                                        <span className="text-blue-500 font-medium">En aula: {Number.isInteger(horasInfo.horasAula) ? horasInfo.horasAula : horasInfo.horasAula.toFixed(1)} hrs</span>
                                        <span className="text-emerald-500 font-medium">Libres: {Number.isInteger(horasInfo.horasLibres) ? horasInfo.horasLibres : horasInfo.horasLibres.toFixed(1)} hrs</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CalendarClock className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg">
                            Selecciona un docente para ver su horario semanal
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            La grilla semanal aparecerá aquí
                        </p>
                    </motion.div>
                )}
                {/* Action Buttons */}
                {
                    canShowSchedule && isEditMode && userCanEdit && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-between items-center gap-6 mt-12"
                        >
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3.5 rounded-2xl font-semibold text-sm text-red-600 bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 transition-all shadow-lg shadow-red-100 hover:shadow-xl"
                            >
                                <Trash2 className="w-4 h-4 inline mr-2" />
                                Eliminar Horario
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-8 py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-2xl shadow-purple-300 hover:shadow-purple-400 transition-all hover:scale-105"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                Guardar Cambios
                            </button>
                        </motion.div>
                    )
                }
            </div >
        </div >
    );
}

// ─── Subject color palette ─────────────────────────────────
const SUBJECT_COLORS = {
    'Lenguaje': { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', sub: 'text-blue-500' },
    'Leng. y Lit.': { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', sub: 'text-blue-500' },
    'Taller Len': { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', sub: 'text-blue-500' },
    'T. Lenguaje': { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', sub: 'text-blue-500' },
    'Matemática': { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-800', sub: 'text-indigo-500' },
    'T. Matemática': { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-800', sub: 'text-indigo-500' },
    'Historia': { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-800', sub: 'text-amber-500' },
    'H. G. y Cs. S.': { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-800', sub: 'text-amber-500' },
    'For. Ciud.': { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800', sub: 'text-yellow-500' },
    'Ciencias': { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', sub: 'text-green-500' },
    'C. Nat': { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', sub: 'text-green-500' },
    'T. Ciencias': { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', sub: 'text-green-500' },
    'Inglés': { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', sub: 'text-red-500' },
    'Artes': { bg: 'bg-pink-50', border: 'border-pink-200', title: 'text-pink-800', sub: 'text-pink-500' },
    'Música': { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-800', sub: 'text-violet-500' },
    'Música/Arte': { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-800', sub: 'text-violet-500' },
    'Ed. Física': { bg: 'bg-cyan-50', border: 'border-cyan-200', title: 'text-cyan-800', sub: 'text-cyan-500' },
    'Tecnología': { bg: 'bg-slate-100', border: 'border-slate-300', title: 'text-slate-800', sub: 'text-slate-500' },
    'Orientación': { bg: 'bg-teal-50', border: 'border-teal-200', title: 'text-teal-800', sub: 'text-teal-500' },
    'Religión': { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-800', sub: 'text-purple-500' },
    'Religión / FC': { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-800', sub: 'text-purple-500' },
    'PAE': { bg: 'bg-lime-50', border: 'border-lime-200', title: 'text-lime-800', sub: 'text-lime-500' },
    'Jefatura': { bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-700', sub: 'text-orange-500' },
};

const DEFAULT_COLOR = { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-800', sub: 'text-emerald-500' };

function getSubjectColor(subject) {
    return SUBJECT_COLORS[subject] || DEFAULT_COLOR;
}

// ─── View-mode cell ────────────────────────────────────────
function ViewCell({ cellData, isSpecial, hasData }) {
    if (!hasData) {
        return (
            <div className="rounded-xl px-2 py-2.5 bg-slate-50 text-center min-h-[44px] flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic">Libre</span>
            </div>
        );
    }

    const color = getSubjectColor(cellData.subject);

    return (
        <div className={cn(
            "rounded-xl px-2 py-2 min-h-[44px] flex flex-col items-center justify-center text-center border",
            color.bg,
            color.border
        )}>
            <span className={cn("text-[11px] font-bold leading-tight", color.title)}>
                {cellData.course}
            </span>
            <span className={cn("text-[10px] leading-tight mt-0.5", color.sub)}>
                {cellData.subject}
            </span>
        </div>
    );
}

// ─── Edit-mode cell ────────────────────────────────────────
function EditCell({ cellData, day, startTime, isSpecial, updateCell, clearCell }) {
    const currentCourse = cellData?.course || '';
    const currentSubject = cellData?.subject || '';

    const editColor = currentSubject ? getSubjectColor(currentSubject) : null;

    return (
        <div className={cn(
            "rounded-xl p-1.5 min-h-[44px] border",
            currentCourse && editColor
                ? cn(editColor.bg, editColor.border)
                : currentCourse
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-dashed border-slate-200"
        )}>
            {/* Course dropdown */}
            <div className="relative">
                <select
                    value={currentCourse}
                    onChange={(e) => updateCell(day, startTime, e.target.value, e.target.value ? currentSubject : '')}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none text-[11px] font-semibold appearance-none bg-white text-slate-800 truncate"
                >
                    <option value="">Curso...</option>
                    {COURSES_LIST.map(course => (
                        <option key={course} value={course}>{course}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Subject dropdown — only visible when course selected */}
            {currentCourse && (
                <div className="relative mt-1">
                    <select
                        value={currentSubject}
                        onChange={(e) => updateCell(day, startTime, currentCourse, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none text-[11px] appearance-none bg-white text-slate-700 truncate"
                    >
                        <option value="">Asignatura...</option>
                        {SUBJECTS_LIST.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
            )}

            {/* Clear button */}
            {currentCourse && (
                <button
                    onClick={() => clearCell(day, startTime)}
                    className="mt-1 w-full flex items-center justify-center gap-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg py-0.5 transition-colors"
                >
                    <X className="w-3 h-3" />
                    Limpiar
                </button>
            )}
        </div>
    );
}

// ─── Teacher combobox with search ──────────────────────────
function normalizeStr(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function TeacherCombobox({ teachers, selectedTeacherId, onSelect }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = teachers.find(t => t.id === selectedTeacherId);

    const filtered = query
        ? teachers.filter(t => normalizeStr(t.name).includes(normalizeStr(query)))
        : teachers;

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelect = (teacher) => {
        onSelect(teacher.id);
        setQuery('');
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect('');
        setQuery('');
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-blue-500" />
                Docente
            </label>

            {/* Trigger / display */}
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left bg-white shadow-sm",
                    open
                        ? "border-blue-400 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-slate-300"
                )}
            >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className={cn("flex-1 text-sm truncate", selected ? "font-medium text-slate-900" : "text-slate-400")}>
                    {selected ? selected.name : 'Seleccionar docente...'}
                </span>
                {selected ? (
                    <X onClick={handleClear} className="w-4 h-4 text-slate-400 hover:text-red-500 flex-shrink-0 cursor-pointer" />
                ) : (
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 flex-shrink-0 transition-transform", open && "rotate-180")} />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                    >
                        {/* Search input */}
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar docente..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border-none focus:outline-none focus:bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setOpen(false);
                                        if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
                                    }}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-64 overflow-y-auto py-1">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-slate-400">
                                    Sin resultados
                                </div>
                            ) : (
                                filtered.map(teacher => {
                                    const isActive = teacher.id === selectedTeacherId;
                                    return (
                                        <button
                                            key={teacher.id}
                                            type="button"
                                            onClick={() => handleSelect(teacher)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                                                isActive
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-slate-100 text-slate-500"
                                            )}>
                                                {teacher.name.charAt(0)}
                                            </div>
                                            <span className="text-sm truncate">{teacher.name}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
