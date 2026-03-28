import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckSquare, AlignLeft, ChevronDown, ChevronUp, Pencil, X, Save, Check, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useAuth, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { uploadPreguntaImagen, deletePreguntaImagen, getImageAspectRatio } from '../lib/storageService';
import { toast } from 'sonner';
import MathKeyboard from './MathKeyboard';

const LETRAS = ['a', 'b', 'c', 'd'];

// ── Tarjeta individual ────────────────────────────────────────────────────────

function PreguntaCard({
    pregunta, editMode,
    onSetCorrect, onSetPauta, onSetEnunciado, onSetAlternativa, onFieldFocus, onSetImagen, onDelete,
}) {
    const [open, setOpen] = useState(true);
    const imageInputRef = useRef(null);
    const esSM = pregunta.tipo === 'seleccion_multiple';
    const altKeys = Object.keys(pregunta.alternativas || {}).filter(k => LETRAS.includes(k)).sort();
    const correcta = pregunta.respuestaCorrecta || '';

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const previewUrl = URL.createObjectURL(file);
        onSetImagen(pregunta.number, { file, previewUrl });
        e.target.value = '';
    };

    const handleRemoveImage = () => {
        if (pregunta.imagen?.previewUrl) URL.revokeObjectURL(pregunta.imagen.previewUrl);
        onSetImagen(pregunta.number, null);
    };

    // Imagen a mostrar: pending preview > stored URL > nada
    const imagenSrc = pregunta.imagen?.previewUrl || pregunta.imagen?.url || null;

    return (
        <div className={`border rounded-xl overflow-hidden transition-colors
            ${editMode ? 'border-indigo-200' : 'border-slate-200'}`}
        >
            {/* Header */}
            <div
                className={`flex items-start gap-3 px-4 py-3
                    ${!editMode ? 'cursor-pointer hover:bg-slate-50 transition-colors' : 'bg-white'}`}
                onClick={!editMode ? () => setOpen(o => !o) : undefined}
            >
                <span className="font-mono text-sm font-semibold text-slate-400 shrink-0 mt-0.5 w-7 text-right">
                    {pregunta.number}.
                </span>

                {/* Enunciado */}
                {editMode ? (
                    <textarea
                        rows={2}
                        value={pregunta.enunciado}
                        onChange={e => onSetEnunciado(pregunta.number, e.target.value)}
                        onFocus={e => onFieldFocus?.(e.target, pregunta.number, 'enunciado')}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 px-2 py-1 text-sm text-slate-700 font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white leading-snug"
                    />
                ) : (
                    <span className="flex-1 text-sm text-slate-700 font-medium leading-snug mt-0.5">
                        {pregunta.enunciado}
                    </span>
                )}

                {/* Badges + chevron */}
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold
                        ${esSM ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                        {esSM
                            ? <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> SM</span>
                            : <span className="flex items-center gap-1"><AlignLeft className="w-3 h-3" /> D</span>
                        }
                    </span>
                    {!editMode && correcta && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                            {esSM ? `Clave: ${correcta.toUpperCase()}` : 'Con pauta'}
                        </span>
                    )}
                    {!editMode && pregunta.imagen?.url && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <ImageIcon className="w-3 h-3" />
                        </span>
                    )}
                    {editMode && onDelete && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onDelete(pregunta.number); }}
                            className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                            title="Eliminar pregunta"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors"
                    >
                        {open
                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                    </button>
                </div>
            </div>

            {/* Cuerpo */}
            {open && (
                <div className="px-4 pb-3 pt-1 bg-slate-50/60 border-t border-slate-100 space-y-2">
                    {/* Imagen — vista */}
                    {!editMode && imagenSrc && (
                        <img
                            src={imagenSrc}
                            alt="imagen pregunta"
                            className="max-h-48 object-contain rounded-lg border border-slate-100 bg-white"
                        />
                    )}

                    {/* Alternativas / Pauta */}
                    {esSM && altKeys.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1.5">
                            {altKeys.map(letra => {
                                const esCorrecta = correcta === letra;
                                return (
                                    <div
                                        key={letra}
                                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all
                                            ${esCorrecta ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-transparent'}`}
                                    >
                                        <button
                                            type="button"
                                            disabled={!editMode}
                                            onClick={() => editMode && onSetCorrect(pregunta.number, esCorrecta ? '' : letra)}
                                            title={editMode ? (esCorrecta ? 'Quitar como correcta' : 'Marcar como correcta') : ''}
                                            className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all
                                                ${editMode ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                                                ${esCorrecta
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'border-2 border-slate-300 text-slate-500'
                                                }`}
                                        >
                                            {esCorrecta ? <Check className="w-3 h-3" /> : letra}
                                        </button>

                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={pregunta.alternativas[letra] || ''}
                                                onChange={e => onSetAlternativa(pregunta.number, letra, e.target.value)}
                                                onFocus={e => onFieldFocus?.(e.target, pregunta.number, `alt_${letra}`)}
                                                className={`flex-1 px-2 py-1 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors
                                                    ${esCorrecta
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                        : 'border-slate-200 bg-white text-slate-700'
                                                    }`}
                                            />
                                        ) : (
                                            <span className={`text-sm leading-snug
                                                ${esCorrecta ? 'text-emerald-800 font-medium' : 'text-slate-600'}`}
                                            >
                                                {pregunta.alternativas[letra]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {editMode && (
                                <p className="text-[11px] text-slate-400 mt-0.5 pl-1">
                                    Clic en el círculo de letra para marcar la respuesta correcta.
                                </p>
                            )}
                        </div>
                    ) : (
                        editMode ? (
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Pauta de corrección (opcional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={correcta}
                                    onChange={e => onSetPauta(pregunta.number, e.target.value)}
                                    onFocus={e => onFieldFocus?.(e.target, pregunta.number, 'pauta')}
                                    placeholder="Escribe los criterios o respuesta esperada..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white"
                                />
                            </div>
                        ) : correcta ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">Pauta de corrección</p>
                                <p className="text-sm text-emerald-800 whitespace-pre-wrap">{correcta}</p>
                            </div>
                        ) : null
                    )}

                    {/* Imagen — edición */}
                    {editMode && (
                        <div className="pt-1 border-t border-slate-100">
                            {imagenSrc ? (
                                <div className="relative">
                                    <img
                                        src={imagenSrc}
                                        alt="imagen pregunta"
                                        className="w-full max-h-36 object-contain rounded-lg border border-slate-200 bg-white"
                                    />
                                    <div className="absolute top-1 right-1 flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="px-2 py-0.5 bg-white/90 border border-slate-200 rounded-lg text-[11px] text-slate-600 hover:bg-slate-50 shadow-sm"
                                        >
                                            Cambiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-1 bg-white/90 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors py-0.5"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Agregar imagen
                                </button>
                            )}
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function PreguntasPanel({ evaluacion }) {
    const { user } = useAuth();
    const { updateEvaluacion } = useEvaluaciones();

    const preguntas = (evaluacion.questions || []).filter(q => q.enunciado);
    const puedeEditar = evaluacion.createdBy?.id === user?.uid || isManagement(user);
    const esMate = evaluacion.asignatura === 'MA';

    const isEmpty = preguntas.length === 0;
    const [editMode, setEditMode] = useState(isEmpty && puedeEditar);
    const [localQuestions, setLocalQuestions] = useState(
        isEmpty && puedeEditar ? [] : null
    );
    const [saving, setSaving] = useState(false);
    const nextNumRef = useRef(preguntas.length + 1);

    // Si la eval llega vacía desde Firestore (modo manual recién creada), entrar directo en edición
    useEffect(() => {
        if (isEmpty && puedeEditar && !editMode) {
            setEditMode(true);
            setLocalQuestions([]);
        }
    }, [isEmpty, puedeEditar]);

    const activeFieldRef = useRef(null);

    const handleFieldFocus = useCallback((el, questionNumber, fieldId) => {
        activeFieldRef.current = { el, questionNumber, fieldId };
    }, []);

    const handleInsertSymbol = useCallback((symbol) => {
        const active = activeFieldRef.current;
        if (!active) return;
        const { el, questionNumber, fieldId } = active;

        const start = el.selectionStart ?? el.value.length;
        const end   = el.selectionEnd   ?? el.value.length;
        const newValue = el.value.slice(0, start) + symbol + el.value.slice(end);

        if (fieldId === 'enunciado') {
            handleSetEnunciado(questionNumber, newValue);
        } else if (fieldId === 'pauta') {
            handleSetPauta(questionNumber, newValue);
        } else if (fieldId.startsWith('alt_')) {
            const letra = fieldId.slice(4);
            handleSetAlternativa(questionNumber, letra, newValue);
        }

        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = start + symbol.length;
            el.selectionEnd   = start + symbol.length;
        });
    }, []);

    const handleStartEdit = () => {
        const qs = evaluacion.questions.map(q => ({
            ...q,
            alternativas: { ...(q.alternativas || {}) },
            imagen: q.imagen ? { ...q.imagen } : null,
        }));
        setLocalQuestions(qs);
        nextNumRef.current = qs.length + 1;
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        // Revocar object URLs pendientes
        if (localQuestions) {
            for (const q of localQuestions) {
                if (q.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            }
        }
        setLocalQuestions(null);
        setEditMode(false);
    };

    const updateQuestion = (questionNumber, updater) => {
        setLocalQuestions(prev => prev.map(q =>
            q.number === questionNumber ? updater(q) : q
        ));
    };

    const handleSetEnunciado = (questionNumber, text) =>
        updateQuestion(questionNumber, q => ({ ...q, enunciado: text }));

    const handleSetAlternativa = (questionNumber, letra, text) =>
        updateQuestion(questionNumber, q => ({
            ...q,
            alternativas: { ...q.alternativas, [letra]: text },
        }));

    const handleSetCorrect = (questionNumber, letra) =>
        updateQuestion(questionNumber, q => ({ ...q, respuestaCorrecta: letra }));

    const handleSetPauta = (questionNumber, texto) =>
        updateQuestion(questionNumber, q => ({ ...q, respuestaCorrecta: texto }));

    const handleAddQuestion = (tipo) => {
        const num = nextNumRef.current;
        nextNumRef.current += 1;
        setLocalQuestions(prev => [
            ...(prev || []),
            {
                number: num,
                tipo,
                enunciado: '',
                alternativas: tipo === 'seleccion_multiple' ? { a: '', b: '', c: '', d: '' } : {},
                oaCode: '',
                imagen: null,
            },
        ]);
    };

    const handleDeleteQuestion = (questionNumber) => {
        setLocalQuestions(prev => {
            const q = prev.find(x => x.number === questionNumber);
            if (q?.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            // Renumerar después de eliminar
            return prev
                .filter(x => x.number !== questionNumber)
                .map((x, i) => ({ ...x, number: i + 1 }));
        });
        nextNumRef.current = (localQuestions?.length ?? 1) - 1 + 1;
    };

    const handleSetImagen = (questionNumber, value) => {
        updateQuestion(questionNumber, q => {
            // Revocar preview anterior si era pendiente
            if (q.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            return { ...q, imagen: value };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalQuestions = localQuestions.map(q => ({ ...q }));

            for (let i = 0; i < finalQuestions.length; i++) {
                const q = finalQuestions[i];
                const original = evaluacion.questions.find(oq => oq.number === q.number);

                // Imagen nueva (pendiente de subir)
                if (q.imagen?.file) {
                    try {
                        // Eliminar imagen anterior si existía
                        if (original?.imagen?.storagePath) {
                            await deletePreguntaImagen(original.imagen.storagePath);
                        }
                        const ar = await getImageAspectRatio(q.imagen.previewUrl);
                        const { url, storagePath } = await uploadPreguntaImagen(evaluacion.id, q.number, q.imagen.file);
                        finalQuestions[i] = { ...q, imagen: { url, storagePath, aspectRatio: ar } };
                        URL.revokeObjectURL(q.imagen.previewUrl);
                    } catch {
                        toast.error(`Error al subir imagen de pregunta ${q.number}`);
                        finalQuestions[i] = { ...q, imagen: original?.imagen || null };
                    }
                }

                // Imagen eliminada
                if (q.imagen === null && original?.imagen?.storagePath) {
                    try {
                        await deletePreguntaImagen(original.imagen.storagePath);
                    } catch {
                        // No bloquear el guardado si el delete falla
                    }
                }
            }

            await updateEvaluacion(evaluacion.id, { questions: finalQuestions });
            setEditMode(false);
            setLocalQuestions(null);
        } finally {
            setSaving(false);
        }
    };

    // En edición mostramos todas (incluidas las recién agregadas sin enunciado aún)
    const displayQuestions = editMode ? (localQuestions || []) : preguntas;

    const smCount  = preguntas.filter(q => q.tipo === 'seleccion_multiple').length;
    const devCount = preguntas.filter(q => q.tipo === 'desarrollo').length;
    const conClave = preguntas.filter(q => q.respuestaCorrecta).length;
    const conImg   = preguntas.filter(q => q.imagen?.url).length;

    return (
        <div className="space-y-3">
            {/* Barra superior */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-slate-700">{preguntas.length} preguntas</span>
                    {smCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                            <CheckSquare className="w-3 h-3" /> {smCount} SM
                        </span>
                    )}
                    {devCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
                            <AlignLeft className="w-3 h-3" /> {devCount} D
                        </span>
                    )}
                    {!editMode && conClave > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                            <Check className="w-3 h-3" /> {conClave} con clave
                        </span>
                    )}
                    {!editMode && conImg > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                            <ImageIcon className="w-3 h-3" /> {conImg} con imagen
                        </span>
                    )}
                </div>

                {puedeEditar && !editMode && (
                    <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Editar preguntas
                    </button>
                )}

                {editMode && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                )}
            </div>

            {editMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    Edita el texto, alternativas e imágenes directamente. Clic en el círculo de letra para marcar la respuesta correcta.
                </div>
            )}

            {editMode && esMate && (
                <MathKeyboard onInsert={handleInsertSymbol} />
            )}

            {/* Lista de preguntas */}
            {displayQuestions.length > 0 ? (
                <div className="space-y-2">
                    {displayQuestions.map(p => (
                        <PreguntaCard
                            key={p.number}
                            pregunta={p}
                            editMode={editMode}
                            onSetCorrect={handleSetCorrect}
                            onSetPauta={handleSetPauta}
                            onSetEnunciado={handleSetEnunciado}
                            onSetAlternativa={handleSetAlternativa}
                            onFieldFocus={handleFieldFocus}
                            onSetImagen={handleSetImagen}
                            onDelete={editMode ? handleDeleteQuestion : undefined}
                        />
                    ))}
                </div>
            ) : (
                !editMode && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                        <AlignLeft className="w-10 h-10" />
                        <p className="text-sm">Esta evaluación no tiene preguntas cargadas.</p>
                    </div>
                )
            )}

            {/* Botones agregar (solo en edición) */}
            {editMode && (
                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => handleAddQuestion('seleccion_multiple')}
                        className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 rounded-xl text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <CheckSquare className="w-3.5 h-3.5" />
                        Selección múltiple
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddQuestion('desarrollo')}
                        className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 rounded-xl text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <AlignLeft className="w-3.5 h-3.5" />
                        Desarrollo
                    </button>
                </div>
            )}
        </div>
    );
}
