import React, { useState, useMemo } from 'react';
import { X, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import { useStudents } from '../context/StudentsContext';

export default function CrearEvaluacionModal({ onClose, onSave, user }) {
    const { students } = useStudents();
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [curso, setCurso] = useState('');
    const [asignatura, setAsignatura] = useState('');
    const [numQuestions, setNumQuestions] = useState('5');
    const [driveLink, setDriveLink] = useState('');

    const numQuestionsInt = parseInt(numQuestions, 10);
    const formValid = name.trim() && curso && asignatura && numQuestionsInt >= 1 && numQuestionsInt <= 50;

    const cursoStudents = useMemo(() => {
        if (!curso) return [];
        return students
            .filter(s => s.curso === curso)
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    }, [students, curso]);

    const handleSubmit = async () => {
        if (!formValid) return;
        setSaving(true);
        try {
            const count = numQuestionsInt;
            const questions = Array.from({ length: count }, (_, i) => ({
                number: i + 1,
                oaCode: '',
            }));
            await onSave({
                name: name.trim(),
                curso,
                asignatura,
                date: new Date().toISOString().slice(0, 10),
                questions,
                driveLink: driveLink.trim() || '',
                createdBy: { id: user.uid, name: user.name },
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Nueva Evaluacion</h3>
                        <p className="text-xs text-slate-400">Completa los datos de la evaluacion</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de la evaluacion *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Prueba Unidad 1"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Curso + Asignatura */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Curso *</label>
                            <select
                                value={curso}
                                onChange={e => setCurso(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Asignatura *</label>
                            <select
                                value={asignatura}
                                onChange={e => setAsignatura(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Number of questions */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">N° de preguntas * (max 50)</label>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={numQuestions}
                            onChange={e => setNumQuestions(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                        />
                    </div>

                    {/* Drive link */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Link a la prueba (Google Drive)</label>
                        <input
                            type="url"
                            value={driveLink}
                            onChange={e => setDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Opcional — permite a jefa UTP revisar el documento de la prueba</p>
                    </div>

                    <p className="text-xs text-slate-400">Podras asignar Objetivos de Aprendizaje a cada pregunta despues de crear la evaluacion.</p>

                    {/* Student list preview */}
                    {curso && (
                        <div className="bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600">
                                    {cursoStudents.length} alumno{cursoStudents.length !== 1 ? 's' : ''} en {curso}
                                </span>
                            </div>
                            {cursoStudents.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {cursoStudents.map((s, i) => (
                                        <div key={s.id} className="flex items-center gap-2 text-xs text-slate-600 py-1 px-2 bg-white rounded-lg">
                                            <span className="text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
                                            <span className="truncate">{s.fullName}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-amber-600">No hay alumnos registrados en este curso</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end px-5 py-4 border-t border-slate-100 shrink-0 bg-white">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={!formValid || saving}
                        className="px-5 py-2.5 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Creando...' : 'Crear Evaluacion'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
