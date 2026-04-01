import React, { useState, useEffect, useRef } from 'react';
import {
    Save, RotateCcw, Loader2, FileText, CheckSquare, AlignLeft,
    ToggleLeft, Link2, Type, Upload, Trash2, Download, ChevronDown,
    ChevronUp, CheckCircle2, File,
} from 'lucide-react';
import { DEFAULT_FORMATO, mergeWithDefaults, cargarFormato, guardarFormato } from './formatoConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { uploadPlantilla, deletePlantilla } from '../lib/storageService';
import { descargarPlantillaEjemplo } from '../lib/templateExport';
import { setDocument, fetchDocument } from '../lib/firestoreService';

const PLANTILLA_META_DOC = ['app_config', 'utp_plantilla_meta'];

const TIPOS = [
    { key: 'seleccion_multiple', label: 'Selección Múltiple',  Icon: CheckSquare, color: 'indigo' },
    { key: 'desarrollo',         label: 'Desarrollo',          Icon: AlignLeft,   color: 'amber'  },
    { key: 'verdadero_falso',    label: 'Verdadero o Falso',   Icon: ToggleLeft,  color: 'violet' },
    { key: 'unir',               label: 'Unir',                Icon: Link2,       color: 'sky'    },
    { key: 'completar',          label: 'Completar',           Icon: Type,        color: 'rose'   },
];

const COLOR_CLASSES = {
    indigo: { border: 'border-indigo-100', bg: 'bg-indigo-50/30', text: 'text-indigo-700' },
    amber:  { border: 'border-amber-100',  bg: 'bg-amber-50/30',  text: 'text-amber-700'  },
    violet: { border: 'border-violet-100', bg: 'bg-violet-50/30', text: 'text-violet-700' },
    sky:    { border: 'border-sky-100',    bg: 'bg-sky-50/30',    text: 'text-sky-700'    },
    rose:   { border: 'border-rose-100',   bg: 'bg-rose-50/30',   text: 'text-rose-700'   },
};

// Variables disponibles para la referencia del usuario
const VARIABLES_SIMPLES = [
    { tag: '{titulo}',        desc: 'Nombre de la evaluación' },
    { tag: '{asignatura}',    desc: 'Asignatura' },
    { tag: '{curso}',         desc: 'Curso' },
    { tag: '{fecha}',         desc: 'Fecha formateada (ej: 31 de marzo de 2026)' },
    { tag: '{profesor}',      desc: 'Nombre del profesor/a' },
    { tag: '{instrucciones}', desc: 'Instrucciones generales' },
    { tag: '{total_puntos}',  desc: 'Total de puntos de la prueba' },
];

// Loop principal: {#secciones} — respeta el orden en que el profesor creó los tipos
const VARIABLES_LOOPS = [
    {
        tag: '{#secciones}',
        cierre: '{/secciones}',
        desc: 'Todas las secciones en el orden del profesor',
        note: 'Si el profesor empieza con V/F, esa sección aparece primero.',
        sub: [
            { tag: '{roman}',          desc: 'Número romano (I, II, III…)' },
            { tag: '{count}',          desc: 'Cantidad de preguntas en la sección' },
            { tag: '{#is_sm}',         desc: 'Bloque condicional: solo para Selección Múltiple' },
            { tag: '{#is_desarrollo}', desc: 'Bloque condicional: solo para Desarrollo' },
            { tag: '{#is_vf}',         desc: 'Bloque condicional: solo para Verdadero o Falso' },
            { tag: '{#is_unir}',       desc: 'Bloque condicional: solo para Unir con Flechas' },
            { tag: '{#is_completar}',  desc: 'Bloque condicional: solo para Completar' },
        ],
        inner: {
            tag: '{#preguntas}',
            cierre: '{/preguntas}',
            desc: 'Preguntas de la sección',
            sub: [
                { tag: '{numero}',    desc: 'Número dentro de la sección' },
                { tag: '{enunciado}', desc: 'Texto de la pregunta' },
                { tag: '{instruccion}', desc: 'Instrucción del bloque (VF, unir, completar)' },
                { tag: '{alt_a} {alt_b} {alt_c} {alt_d}', desc: 'Alternativas (solo SM)' },
            ],
            innerItems: {
                tag: '{#items}',
                cierre: '{/items}',
                desc: 'Ítems (VF, unir, completar)',
                sub: [
                    { tag: '{numero}',    desc: 'Número del ítem' },
                    { tag: '{texto}',     desc: 'Texto del ítem (VF, completar)' },
                    { tag: '{izquierda}', desc: 'Columna A (unir)' },
                    { tag: '{derecha}',   desc: 'Columna B (unir)' },
                    { tag: '{letra}',     desc: 'Letra columna B: A, B, C… (unir)' },
                ],
            },
        },
    },
];

function formatDateShort(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FormatoPrueba() {
    const { user } = useAuth();

    // ── Formato estándar ──────────────────────────────────────────────────────
    const [loading, setLoading]   = useState(true);
    const [saving,  setSaving]    = useState(false);
    const [config,  setConfig]    = useState(mergeWithDefaults(null));
    const [formatoOpen, setFormatoOpen] = useState(true);

    // ── Plantilla ─────────────────────────────────────────────────────────────
    const [plantillaMeta,   setPlantillaMeta]   = useState(null); // { url, uploadedAt, uploadedBy, fileName }
    const [uploading,       setUploading]       = useState(false);
    const [deleting,        setDeleting]        = useState(false);
    const [downloading,     setDownloading]     = useState(false);
    const [variablesOpen,   setVariablesOpen]   = useState(false);
    const [dragOver,        setDragOver]        = useState(false);
    const fileInputRef = useRef(null);

    // ── Carga inicial ─────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            cargarFormato(),
            fetchDocument(...PLANTILLA_META_DOC),
        ]).then(([formato, meta]) => {
            setConfig(formato);
            if (meta?.hasPlantilla) {
                setPlantillaMeta(meta);
                setFormatoOpen(false); // colapsar formato si hay plantilla activa
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // ── Formato estándar ──────────────────────────────────────────────────────
    const setGeneral     = (v)       => setConfig(c => ({ ...c, instruccionesGenerales: v }));
    const setTitulo      = (tipo, v) => setConfig(c => ({ ...c, titulosPorTipo:       { ...c.titulosPorTipo,       [tipo]: v } }));
    const setInstruccion = (tipo, v) => setConfig(c => ({ ...c, instruccionesPorTipo: { ...c.instruccionesPorTipo, [tipo]: v } }));

    const handleReset = () => setConfig(mergeWithDefaults(null));

    const handleSave = async () => {
        setSaving(true);
        try {
            await guardarFormato(config, user);
            toast.success('Formato guardado correctamente');
        } catch {
            toast.error('Error al guardar el formato');
        } finally {
            setSaving(false);
        }
    };

    // ── Plantilla: subir ──────────────────────────────────────────────────────
    const handleFileSelected = async (file) => {
        if (!file) return;
        if (!file.name.endsWith('.docx')) {
            toast.error('Solo se aceptan archivos .docx');
            return;
        }
        setUploading(true);
        try {
            await uploadPlantilla(file); // guarda base64 en Firestore
            const meta = {
                hasPlantilla: true,
                uploadedAt: new Date().toISOString(),
                uploadedBy: { id: user?.uid, name: user?.displayName || user?.name || '' },
                fileName: file.name,
            };
            await setDocument(...PLANTILLA_META_DOC, meta);
            setPlantillaMeta(meta);
            setFormatoOpen(false);
            toast.success('Plantilla subida correctamente');
        } catch (err) {
            toast.error('Error al subir la plantilla: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        handleFileSelected(file);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        handleFileSelected(file);
    };

    // ── Plantilla: eliminar ───────────────────────────────────────────────────
    const handleDeletePlantilla = async () => {
        setDeleting(true);
        try {
            await deletePlantilla();
            await setDocument(...PLANTILLA_META_DOC, { url: null, uploadedAt: null, uploadedBy: null, fileName: null });
            setPlantillaMeta(null);
            setFormatoOpen(true);
            toast.success('Plantilla eliminada. Se usará el formato estándar.');
        } catch (err) {
            toast.error('Error al eliminar la plantilla: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    // ── Descargar ejemplo ─────────────────────────────────────────────────────
    const handleDescargarEjemplo = async () => {
        setDownloading(true);
        try {
            await descargarPlantillaEjemplo();
        } catch (err) {
            toast.error('Error al generar la plantilla de ejemplo: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando configuración...</span>
            </div>
        );
    }

    const plantillaActiva = Boolean(plantillaMeta?.hasPlantilla);

    return (
        <div className="space-y-6 max-w-2xl">

            {/* ── Sección 1: Plantilla del documento ─────────────────────── */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <File className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-700">Plantilla del documento</h2>
                    {plantillaActiva && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Activa
                        </span>
                    )}
                </div>

                <div className="p-4 space-y-4">
                    {/* Estado actual */}
                    {plantillaActiva ? (
                        <div className="flex items-start gap-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-emerald-800 truncate">{plantillaMeta.fileName}</p>
                                {plantillaMeta.uploadedAt && (
                                    <p className="text-xs text-emerald-600 mt-0.5">
                                        Subida el {formatDateShort(plantillaMeta.uploadedAt)}
                                        {plantillaMeta.uploadedBy?.name && ` por ${plantillaMeta.uploadedBy.name}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
                            <FileText className="w-4 h-4 shrink-0" />
                            Sin plantilla · usando formato estándar
                        </div>
                    )}

                    {/* Zona de arrastre / subida */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`
                            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                            transition-colors
                            ${dragOver
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                            }
                            ${uploading ? 'pointer-events-none opacity-60' : ''}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".docx"
                            className="hidden"
                            onChange={handleInputChange}
                        />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2 text-indigo-600">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-sm font-medium">Subiendo plantilla…</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Upload className="w-6 h-6" />
                                <span className="text-sm font-medium text-slate-600">
                                    {plantillaActiva ? 'Reemplazar plantilla' : 'Subir plantilla .docx'}
                                </span>
                                <span className="text-xs">Arrastra aquí o haz clic para seleccionar</span>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleDescargarEjemplo}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                            {downloading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />
                            }
                            Descargar ejemplo
                        </button>

                        {plantillaActiva && (
                            <button
                                onClick={handleDeletePlantilla}
                                disabled={deleting}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {deleting
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                }
                                Eliminar plantilla
                            </button>
                        )}
                    </div>

                    {/* Variables disponibles (colapsable) */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setVariablesOpen(v => !v)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            Variables disponibles
                            {variablesOpen
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            }
                        </button>

                        {variablesOpen && (
                            <div className="px-3 py-3 space-y-4 bg-white">
                                {/* Variables simples */}
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Variables simples</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        {VARIABLES_SIMPLES.map(v => (
                                            <div key={v.tag} className="flex items-baseline gap-2 text-xs">
                                                <code className="shrink-0 px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded font-mono text-[11px]">{v.tag}</code>
                                                <span className="text-slate-500">{v.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Loops */}
                                {VARIABLES_LOOPS.map(loop => (
                                    <div key={loop.tag}>
                                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{loop.desc}</p>
                                        {loop.note && (
                                            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mb-2">{loop.note}</p>
                                        )}
                                        <div className="pl-2 border-l-2 border-indigo-100 space-y-1">
                                            <div className="flex items-center gap-1 text-xs">
                                                <code className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono text-[11px]">{loop.tag}</code>
                                                <span className="text-slate-400">…</span>
                                                <code className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono text-[11px]">{loop.cierre}</code>
                                            </div>
                                            {loop.sub.map(s => (
                                                <div key={s.tag} className="flex items-baseline gap-2 text-xs pl-3">
                                                    <code className="shrink-0 px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded font-mono text-[11px]">{s.tag}</code>
                                                    <span className="text-slate-500">{s.desc}</span>
                                                </div>
                                            ))}
                                            {loop.inner && (
                                                <div className="pl-3 pt-1 space-y-1">
                                                    {loop.inner.desc && (
                                                        <p className="text-[11px] text-slate-400 mb-0.5">{loop.inner.desc}:</p>
                                                    )}
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <code className="px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded font-mono text-[11px]">{loop.inner.tag}</code>
                                                        <span className="text-slate-400">…</span>
                                                        <code className="px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded font-mono text-[11px]">{loop.inner.cierre}</code>
                                                    </div>
                                                    {loop.inner.sub.map(s => (
                                                        <div key={s.tag} className="flex items-baseline gap-2 text-xs pl-3">
                                                            <code className="shrink-0 px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded font-mono text-[11px]">{s.tag}</code>
                                                            <span className="text-slate-500">{s.desc}</span>
                                                        </div>
                                                    ))}
                                                    {loop.inner.innerItems && (
                                                        <div className="pl-3 pt-1 space-y-1">
                                                            {loop.inner.innerItems.desc && (
                                                                <p className="text-[11px] text-slate-400 mb-0.5">{loop.inner.innerItems.desc}:</p>
                                                            )}
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <code className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-mono text-[11px]">{loop.inner.innerItems.tag}</code>
                                                                <span className="text-slate-400">…</span>
                                                                <code className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-mono text-[11px]">{loop.inner.innerItems.cierre}</code>
                                                            </div>
                                                            {loop.inner.innerItems.sub.map(s => (
                                                                <div key={s.tag} className="flex items-baseline gap-2 text-xs pl-3">
                                                                    <code className="shrink-0 px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded font-mono text-[11px]">{s.tag}</code>
                                                                    <span className="text-slate-500">{s.desc}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Sección 2: Configuración del formato estándar ───────────── */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setFormatoOpen(v => !v)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-700 flex-1 text-left">
                        Configuración del formato estándar
                    </h2>
                    {plantillaActiva && (
                        <span className="text-[11px] text-slate-400 font-normal">
                            (solo se usa si no hay plantilla activa)
                        </span>
                    )}
                    {formatoOpen
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                </button>

                {formatoOpen && (
                    <div className="p-4 space-y-6">
                        {/* Descripción */}
                        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                                Esta configuración define los títulos e instrucciones predeterminados que aparecerán
                                en cada sección de la prueba. Los profesores pueden editarlos en cada evaluación de forma individual.
                            </p>
                        </div>

                        {/* Instrucciones generales */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-700">Instrucciones generales</h3>
                            <p className="text-xs text-slate-500">
                                Aparecen al inicio de la prueba, antes de las preguntas.
                            </p>
                            <textarea
                                rows={3}
                                value={config.instruccionesGenerales}
                                onChange={e => setGeneral(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white"
                            />
                        </div>

                        {/* Por tipo */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700">Secciones por tipo de pregunta</h3>
                            <div className="space-y-3">
                                {TIPOS.map((tipo) => {
                                    const { key, label, Icon, color } = tipo;
                                    const cls = COLOR_CLASSES[color];
                                    const TipoIcon = Icon;
                                    return (
                                        <div key={key} className={`border ${cls.border} ${cls.bg} rounded-xl p-4 space-y-3`}>
                                            <div className={`flex items-center gap-2 ${cls.text}`}>
                                                <TipoIcon className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{label}</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="block text-[11px] font-medium text-slate-500">
                                                        Título de sección
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={config.titulosPorTipo[key] || ''}
                                                        onChange={e => setTitulo(key, e.target.value)}
                                                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[11px] font-medium text-slate-500">
                                                        Instrucciones predeterminadas
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={config.instruccionesPorTipo[key] || ''}
                                                        onChange={e => setInstruccion(key, e.target.value)}
                                                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {saving ? 'Guardando…' : 'Guardar formato'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restablecer valores
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
