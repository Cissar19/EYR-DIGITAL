import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Save, Trash2, ChevronDown, Lock, AlertCircle, Eye, Edit3, User, GraduationCap, Calendar, Coffee } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES } from '../context/AuthContext';
import { useSchedule, SCHEDULE_BLOCKS, DAYS, COURSES_LIST, SUBJECTS_LIST } from '../context/ScheduleContext';

export default function ScheduleAdminView() {
    const { user, getAllUsers } = useAuth();
    const { getSchedule, updateSchedule, deleteSchedule } = useSchedule();

    // State
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDay, setSelectedDay] = useState('Lunes');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [scheduleData, setScheduleData] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);

    // Memoize teachers to prevent unnecessary re-renders
    const teachers = React.useMemo(() => {
        return getAllUsers().filter(u => u.role === ROLES.TEACHER);
    }, [getAllUsers]);

    // Load schedule when teacher is selected
    useEffect(() => {
        if (selectedTeacherId) {
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            setSelectedTeacher(teacher);

            const schedule = getSchedule(selectedTeacherId);

            // Convert array to object format for easier editing
            const scheduleObj = {};
            schedule.forEach(block => {
                const key = `${block.day}-${block.startTime}`;
                scheduleObj[key] = block;
            });

            setScheduleData(scheduleObj);
        } else {
            setSelectedTeacher(null);
            setScheduleData({});
            setSelectedCourse('');
        }
    }, [selectedTeacherId, getSchedule, teachers]);

    // Get cell status for collision detection
    const getCellStatus = (day, startTime) => {
        const key = `${day}-${startTime}`;
        const cellData = scheduleData[key];

        if (!cellData || !cellData.subject) {
            return { status: 'available' };
        }

        // If cell has data, check if it matches selected course
        if (cellData.course === selectedCourse) {
            return { status: 'assigned', subject: cellData.subject };
        }

        // Cell is occupied by another course
        return { status: 'occupied', course: cellData.course };
    };

    // Handle subject change in cell
    const updateCellSubject = (day, startTime, subject) => {
        const key = `${day}-${startTime}`;

        if (!subject) {
            // Remove the assignment if subject is cleared
            setScheduleData(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
        } else {
            setScheduleData(prev => ({
                ...prev,
                [key]: {
                    day,
                    startTime,
                    subject,
                    course: selectedCourse
                }
            }));
        }
    };

    // Handle save
    const handleSave = () => {
        if (!selectedTeacherId) return;

        // Convert object back to array, filtering out empty blocks
        const scheduleArray = Object.values(scheduleData).filter(block =>
            block.subject && block.subject.trim() !== ''
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

    // Check if teacher has any classes for selected course
    const hasClassesInCourse = () => {
        return Object.values(scheduleData).some(block =>
            block.course === selectedCourse && block.subject
        );
    };

    const canShowSchedule = selectedTeacherId && selectedCourse;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Glassmorphism Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-300/50">
                                <CalendarClock className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-slate-900 tracking-tight">
                                    Gestión de Horarios
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    Timeline diario • Asignación inteligente
                                </p>
                            </div>
                        </div>

                        {/* Segmented Control - Mode Toggle */}
                        {canShowSchedule && (
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
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200"
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
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200"
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

                {/* Glassmorphism Selector Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 mb-10"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Teacher Selector */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <User className="w-4 h-4 text-blue-500" />
                                Docente
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all appearance-none bg-white text-sm font-medium text-slate-900 shadow-sm hover:border-slate-300"
                                >
                                    <option value="">Seleccionar docente...</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>

                        {/* Course Selector */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <GraduationCap className="w-4 h-4 text-purple-500" />
                                Curso
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    disabled={!selectedTeacherId}
                                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all appearance-none bg-white text-sm font-medium text-slate-900 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300"
                                >
                                    <option value="">Seleccionar curso...</option>
                                    {COURSES_LIST.map(course => (
                                        <option key={course} value={course}>
                                            {course}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>

                        {/* Day Selector */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Día
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    disabled={!canShowSchedule}
                                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none bg-white text-sm font-medium text-slate-900 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300"
                                >
                                    {DAYS.map(day => (
                                        <option key={day} value={day}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Empty State Message */}
                {canShowSchedule && !hasClassesInCourse() && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-3xl p-6 mb-8 flex items-start gap-4"
                    >
                        <AlertCircle className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-900 leading-relaxed">
                            <strong className="font-semibold">{selectedTeacher?.name}</strong> no tiene carga académica en <strong className="font-semibold">{selectedCourse}</strong>.
                        </p>
                    </motion.div>
                )}

                {/* Timeline View */}
                {canShowSchedule ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        {/* Timeline Header */}
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                                    {selectedDay}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {selectedTeacher?.name} • {selectedCourse}
                                </p>
                            </div>
                            {isEditMode && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium shadow-lg">
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Modo Edición Activo
                                </div>
                            )}
                        </div>

                        {/* Timeline Container */}
                        <div className="relative pl-20">
                            {/* Vertical Timeline Spine */}
                            <div className="absolute left-10 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-slate-300" />

                            {/* Timeline Blocks */}
                            <div className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {SCHEDULE_BLOCKS.map((block, index) => {
                                        const isBreak = block.type === 'break';
                                        const isSpecial = block.type === 'special';
                                        const cellStatus = getCellStatus(selectedDay, block.start);
                                        const isOccupied = cellStatus.status === 'occupied';
                                        const isAssigned = cellStatus.status === 'assigned';
                                        const isEmpty = cellStatus.status === 'available';

                                        return (
                                            <motion.div
                                                key={block.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="relative"
                                            >
                                                {/* Timeline Anchor Point */}
                                                <div className={cn(
                                                    "absolute -left-[43px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-md z-10",
                                                    isBreak && "bg-amber-400",
                                                    isSpecial && "bg-orange-400",
                                                    isOccupied && "bg-red-400",
                                                    isAssigned && "bg-green-400",
                                                    isEmpty && "bg-slate-300"
                                                )} />

                                                {/* Time Display (Outside Card) */}
                                                <div className="absolute -left-10 top-4 -translate-x-full pr-8 text-right">
                                                    <div className="text-2xl font-light text-slate-400 tabular-nums leading-none">
                                                        {block.start}
                                                    </div>
                                                    <div className="text-xs text-slate-400 tabular-nums mt-1">
                                                        {block.end}
                                                    </div>
                                                </div>

                                                {/* Block Card */}
                                                <motion.div
                                                    whileHover={{ scale: isBreak ? 1 : 1.01, y: -2 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={cn(
                                                        "rounded-3xl p-6 transition-all duration-300 relative overflow-hidden",
                                                        // Break styling
                                                        isBreak && "bg-gradient-to-br from-amber-50 to-yellow-50/50 border-2 border-amber-100 shadow-sm",
                                                        // Special (Jefatura) styling
                                                        isSpecial && !isBreak && "bg-gradient-to-br from-orange-50 to-red-50/30 border-2 border-orange-100",
                                                        // Occupied styling - striped pattern
                                                        !isBreak && isOccupied && "bg-stripe-pattern bg-white border-2 border-slate-200 border-l-4 border-l-red-400",
                                                        // Assigned styling
                                                        !isBreak && !isOccupied && isAssigned && "bg-white border-2 border-green-200 shadow-md hover:shadow-lg",
                                                        // Empty styling
                                                        !isBreak && !isOccupied && !isAssigned && isEditMode && "bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:border-solid shadow-sm hover:shadow-md",
                                                        !isBreak && !isOccupied && !isAssigned && !isEditMode && "bg-white border-2 border-slate-200 shadow-sm"
                                                    )}
                                                >
                                                    {/* Card Content */}
                                                    <div className="flex items-center gap-4">
                                                        {/* Block Label */}
                                                        <div className="min-w-[100px]">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-2 text-sm font-semibold",
                                                                isBreak && "text-amber-700",
                                                                isSpecial && !isBreak && "text-orange-600",
                                                                !isBreak && !isSpecial && "text-slate-700"
                                                            )}>
                                                                {isBreak && <Coffee className="w-4 h-4" />}
                                                                {block.label}
                                                            </span>
                                                        </div>

                                                        {/* Subject Assignment Area */}
                                                        <div className="flex-1">
                                                            {isBreak ? (
                                                                <span className="text-sm text-amber-600/70 italic font-light">
                                                                    Tiempo libre
                                                                </span>
                                                            ) : isOccupied ? (
                                                                <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border-2 border-red-100 shadow-sm">
                                                                    <Lock className="w-4 h-4 text-red-500" />
                                                                    <div>
                                                                        <div className="text-xs text-red-600 font-medium">No disponible</div>
                                                                        <div className="text-sm text-slate-700 font-semibold">
                                                                            Asignado a {cellStatus.course}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : isEditMode ? (
                                                                // EDIT MODE: Show Dropdown
                                                                <div className="relative">
                                                                    <select
                                                                        value={cellStatus.subject || ''}
                                                                        onChange={(e) => updateCellSubject(selectedDay, block.start, e.target.value)}
                                                                        className={cn(
                                                                            "w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all appearance-none bg-white text-sm font-medium shadow-sm",
                                                                            cellStatus.subject
                                                                                ? "border-green-200 text-slate-900 focus:border-green-400 focus:ring-green-100"
                                                                                : "border-slate-200 text-slate-400 focus:border-blue-400 focus:ring-blue-100",
                                                                            isSpecial && "border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                                                                        )}
                                                                    >
                                                                        <option value="">Seleccionar asignatura...</option>
                                                                        {SUBJECTS_LIST.map(subject => (
                                                                            <option key={subject} value={subject}>
                                                                                {subject}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                                </div>
                                                            ) : (
                                                                // PREVIEW MODE: Show Plain Text
                                                                <div className="px-4 py-3">
                                                                    {cellStatus.subject ? (
                                                                        <span className="text-base font-semibold text-slate-900">
                                                                            {cellStatus.subject}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm text-slate-400 italic font-light">
                                                                            Libre
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
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
                            Selecciona un docente y curso para comenzar
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            La línea de tiempo aparecerá aquí
                        </p>
                    </motion.div>
                )}

                {/* Action Buttons - Floating */}
                {canShowSchedule && isEditMode && (
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
                )}
            </div>

            {/* Custom CSS for striped pattern */}
            <style jsx>{`
                .bg-stripe-pattern {
                    background-image: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        rgba(148, 163, 184, 0.03) 10px,
                        rgba(148, 163, 184, 0.03) 20px
                    );
                }
            `}</style>
        </div>
    );
}
