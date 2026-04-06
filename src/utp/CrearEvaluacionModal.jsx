import React, { useState, useMemo, useRef, useCallback } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, RefreshCw, Pencil, Users, FilePlus2, Sparkles, Zap } from 'lucide-react';
import ModalContainer from '../components/ModalContainer';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import { useStudents } from '../context/StudentsContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { extractTextFromPDF } from '../lib/pdfTextExtractor';
import { parseEvaluacion } from '../lib/evaluacionParser';

const DASHED_BORDER = `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%234e45e4' stroke-width='2' stroke-dasharray='8%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`;

export default function CrearEvaluacionModal({ onClose, onCreated, user }) {
    const { students } = useStudents();
    const { addEvaluacion } = useEvaluaciones();
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [name, setName] = useState('');
    const [curso, setCurso] = useState('');
    const [asignatura, setAsignatura] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [modo, setModo] = useState('pdf');

    const [numQuestions, setNumQuestions] = useState('5');
    const [pdfFileName, setPdfFileName] = useState('');
    const [pdfParsing, setPdfParsing] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState(null);
    const [pdfError, setPdfError] = useState('');

    const effectiveNumQuestions = parsedQuestions
        ? parsedQuestions.length
        : parseInt(numQuestions, 10);

    const formValid = name.trim() && curso && asignatura && (
        modo === 'manual' || (effectiveNumQuestions >= 1 && effectiveNumQuestions <= 50)
    );

    const processPDF = useCallback(async (file) => {
        if (!file || file.type !== 'application/pdf') { setPdfError('El archivo debe ser un PDF.'); return; }
        if (file.size > 20 * 1024 * 1024) { setPdfError('El archivo no puede superar 20 MB.'); return; }
        setPdfFileName(file.name);
        setPdfParsing(true);
        setPdfError('');
        setParsedQuestions(null);
        try {
            const text = await extractTextFromPDF(file);
            const questions = parseEvaluacion(text);
            if (questions.length === 0) {
                setPdfError('No se detectaron preguntas. Revisa que el PDF tenga texto seleccionable.');
                setPdfFileName('');
            } else if (questions.length > 50) {
                setPdfError(`Se detectaron ${questions.length} preguntas (máx. 50). Sube solo una sección.`);
                setPdfFileName('');
            } else {
                setParsedQuestions(questions);
            }
        } catch {
            setPdfError('Error al leer el PDF. Intenta con otro archivo.');
            setPdfFileName('');
        } finally {
            setPdfParsing(false);
        }
    }, []);

    const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) processPDF(f); e.target.value = ''; };
    const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processPDF(f); };
    const handleClearPDF = () => { setParsedQuestions(null); setPdfFileName(''); setPdfError(''); };

    const handleSubmit = async (isDraft = false) => {
        if (!formValid) return;
        setSaving(true);
        try {
            const baseData = {
                name: name.trim(),
                curso,
                asignatura,
                date: new Date().toISOString().slice(0, 10),
                driveLink: driveLink.trim() || '',
                createdBy: { id: user.uid, name: user.name },
                ...(isDraft ? { status: 'draft' } : {}),
            };
            const questions = modo === 'manual'
                ? []
                : parsedQuestions
                    ? parsedQuestions.map(q => ({ number: q.numero, oaCode: '', enunciado: q.enunciado, alternativas: q.alternativas, tipo: q.tipo }))
                    : Array.from({ length: effectiveNumQuestions }, (_, i) => ({ number: i + 1, oaCode: '' }));

            const evalId = await addEvaluacion({ ...baseData, questions });
            if (!evalId) return;
            onCreated?.(evalId, modo === 'manual');
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const smCount  = parsedQuestions?.filter(q => q.tipo === 'seleccion_multiple').length ?? 0;
    const devCount = parsedQuestions?.filter(q => q.tipo === 'desarrollo').length ?? 0;

    const cursoStudents = useMemo(() =>
        curso ? students.filter(s => s.curso === curso).sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')) : []
    , [students, curso]);

    const inputCls = 'w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-transparent focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface';

    return (
        <ModalContainer onClose={onClose}>

                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-eyr-primary-container flex items-center justify-center text-eyr-primary shrink-0">
                            <FilePlus2 className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-headline font-extrabold text-eyr-on-surface tracking-tight">Nueva Evaluación</h2>
                            <p className="text-sm text-eyr-on-variant font-medium">Configura los parámetros de tu instrumento pedagógico</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-4 overflow-y-auto space-y-6">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">Nombre de la Evaluación *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value.toUpperCase())}
                            placeholder="Ej: CONTROL DE LECTURA MENSUAL"
                            className={inputCls}
                            autoFocus
                        />
                    </div>

                    {/* Curso + Asignatura */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-eyr-on-variant ml-1">Curso *</label>
                            <select value={curso} onChange={e => setCurso(e.target.value)} className={inputCls}>
                                <option value="">Seleccionar...</option>
                                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-eyr-on-variant ml-1">Asignatura *</label>
                            <select value={asignatura} onChange={e => setAsignatura(e.target.value)} className={inputCls}>
                                <option value="">Seleccionar...</option>
                                {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Contenido section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#742fe5]" />
                            <h3 className="text-lg font-headline font-bold text-eyr-on-surface">Contenido de la evaluación</h3>
                        </div>

                        {/* Mode cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setModo('pdf')}
                                className={`relative group rounded-3xl p-6 border-2 text-left transition-all ${
                                    modo === 'pdf'
                                        ? 'border-eyr-primary bg-eyr-primary-container/30'
                                        : 'border-transparent bg-eyr-primary-container/20 hover:border-eyr-primary'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-eyr-primary-container flex items-center justify-center mb-4 transition-transform ${modo === 'pdf' ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <FileText className="w-6 h-6 text-eyr-primary" />
                                </div>
                                <h4 className="font-bold text-eyr-on-surface mb-1">Subir PDF</h4>
                                <p className="text-xs text-eyr-on-variant">Ideal para digitalizar pruebas impresas o guías existentes.</p>
                                {modo === 'pdf' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-eyr-primary" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => setModo('manual')}
                                className={`relative group rounded-3xl p-6 border-2 text-left transition-all ${
                                    modo === 'manual'
                                        ? 'border-[#53ddfc] bg-[#53ddfc]/20'
                                        : 'border-transparent bg-[#53ddfc]/10 hover:border-[#53ddfc]'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-[#53ddfc]/50 flex items-center justify-center mb-4 transition-transform ${modo === 'manual' ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <Pencil className="w-6 h-6 text-[#004b58]" />
                                </div>
                                <h4 className="font-bold text-eyr-on-surface mb-1">Crear desde cero</h4>
                                <p className="text-xs text-eyr-on-variant">Diseña preguntas y pautas directamente en la plataforma.</p>
                                {modo === 'manual' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#004b58]" />}
                            </button>
                        </div>

                        {/* PDF mode content */}
                        {modo === 'pdf' && (
                            <>
                                {!parsedQuestions ? (
                                    <div
                                        style={{ backgroundImage: DASHED_BORDER }}
                                        className={`rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${
                                            pdfError ? 'bg-red-50' : 'bg-eyr-primary/5 hover:bg-eyr-primary/10'
                                        }`}
                                        onClick={() => !pdfParsing && fileInputRef.current?.click()}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={handleDrop}
                                    >
                                        {pdfParsing ? (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-eyr-primary">
                                                    <RefreshCw className="w-8 h-8 animate-spin" />
                                                </div>
                                                <p className="font-bold text-eyr-on-surface">Analizando preguntas…</p>
                                            </>
                                        ) : pdfError ? (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                                    <AlertCircle className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-red-700">{pdfError}</p>
                                                    <button type="button" className="text-sm text-red-500 underline mt-1"
                                                        onClick={e => { e.stopPropagation(); handleClearPDF(); fileInputRef.current?.click(); }}>
                                                        Intentar con otro archivo
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-white shadow-xl shadow-eyr-primary/10 flex items-center justify-center text-eyr-primary group-hover:-translate-y-1 transition-transform">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-eyr-on-surface">Arrastra tu archivo PDF aquí</p>
                                                    <p className="text-sm text-eyr-on-variant">O <span className="text-eyr-primary underline decoration-2 underline-offset-4">selecciónalo desde tu ordenador</span></p>
                                                </div>
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-eyr-outline">Tamaño máximo 20MB • Solo archivos .pdf</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="border border-eyr-primary/30 rounded-3xl bg-eyr-surface-low overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-eyr-outline-variant/20">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-eyr-primary shrink-0" />
                                                <span className="text-sm font-bold text-eyr-primary">
                                                    {parsedQuestions.length} pregunta{parsedQuestions.length !== 1 ? 's' : ''} detectada{parsedQuestions.length !== 1 ? 's' : ''}
                                                </span>
                                                <span className="flex gap-1">
                                                    {smCount > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-eyr-primary-container text-eyr-primary">{smCount} SM</span>}
                                                    {devCount > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">{devCount} D</span>}
                                                </span>
                                            </div>
                                            <button type="button" onClick={handleClearPDF} className="text-xs text-eyr-on-variant hover:text-eyr-on-surface underline">Cambiar</button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto divide-y divide-eyr-outline-variant/20">
                                            {parsedQuestions.map(q => (
                                                <div key={q.numero} className="flex items-start gap-2 px-5 py-2">
                                                    <span className="text-[11px] font-mono text-eyr-outline shrink-0 mt-0.5 w-5 text-right">{q.numero}.</span>
                                                    <span className="text-xs text-eyr-on-variant flex-1 line-clamp-2">{q.enunciado}</span>
                                                    <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${q.tipo === 'seleccion_multiple' ? 'bg-eyr-primary-container text-eyr-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                        {q.tipo === 'seleccion_multiple' ? 'SM' : 'D'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-5 py-2 border-t border-eyr-outline-variant/20">
                                            <p className="text-[11px] text-eyr-on-variant flex items-center gap-1">
                                                <FileText className="w-3 h-3" />{pdfFileName}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1">
                                        N° de preguntas (máx. 50)
                                        {parsedQuestions && <span className="ml-1.5 font-normal text-eyr-primary">— auto-detectado</span>}
                                    </label>
                                    <input
                                        type="number" min={1} max={50}
                                        value={parsedQuestions ? parsedQuestions.length : numQuestions}
                                        onChange={e => { if (!parsedQuestions) setNumQuestions(e.target.value); }}
                                        readOnly={!!parsedQuestions}
                                        className={`w-full px-5 py-4 rounded-2xl border outline-none font-medium transition-all ${
                                            parsedQuestions
                                                ? 'border-eyr-primary/30 bg-eyr-surface-low text-eyr-primary cursor-not-allowed'
                                                : 'border-transparent bg-eyr-surface-low focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 text-eyr-on-surface'
                                        }`}
                                    />
                                </div>
                            </>
                        )}

                        {/* Manual mode info */}
                        {modo === 'manual' && (
                            <div className="flex items-start gap-3 px-5 py-4 bg-[#53ddfc]/10 border border-[#53ddfc]/40 rounded-2xl">
                                <Pencil className="w-4 h-4 text-[#004b58] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-[#004b58]">Las preguntas se crean después</p>
                                    <p className="text-xs text-[#004b58]/70 mt-0.5">
                                        Al crear la evaluación abrirás el editor de preguntas donde podrás agregar enunciados, alternativas e imágenes.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drive link */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-eyr-on-variant ml-1">Link a la prueba (Google Drive)</label>
                        <input
                            type="url"
                            value={driveLink}
                            onChange={e => setDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/…"
                            className={inputCls}
                        />
                        <p className="text-[11px] text-eyr-on-variant ml-1">Opcional — permite a jefa UTP revisar el documento</p>
                    </div>

                    {/* Students preview */}
                    {curso && (
                        <div className="bg-eyr-surface-low rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-eyr-on-variant" />
                                <span className="text-xs font-bold text-eyr-on-variant">
                                    {cursoStudents.length} alumno{cursoStudents.length !== 1 ? 's' : ''} en {curso}
                                </span>
                            </div>
                            {cursoStudents.length > 0 ? (
                                <div className="max-h-36 overflow-y-auto space-y-1">
                                    {cursoStudents.map((s, i) => (
                                        <div key={s.id} className="flex items-center gap-2 text-xs text-eyr-on-variant py-1 px-2 bg-white rounded-xl">
                                            <span className="text-eyr-outline w-5 text-right shrink-0">{i + 1}.</span>
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
                <div className="p-6 bg-eyr-surface-mid flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={!formValid || saving}
                            className="px-6 py-3 rounded-2xl font-bold bg-white text-eyr-primary border-2 border-eyr-primary/20 hover:border-eyr-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Guardar Borrador
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={!formValid || saving}
                            className="px-8 py-3 rounded-2xl font-extrabold bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white shadow-xl shadow-eyr-primary/30 hover:shadow-eyr-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            {saving ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" />Creando…</>
                            ) : (
                                <>{modo === 'manual' ? 'Crear y agregar preguntas' : 'Crear Evaluación'} <Zap className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
        </ModalContainer>
    );
}
