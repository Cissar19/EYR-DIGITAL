import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckSquare, AlignLeft, ChevronDown, ChevronUp, Pencil, X, Save, Check, Image as ImageIcon, Plus, Trash2, ToggleLeft, Link2, Type } from 'lucide-react';
import { useAuth, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { uploadPreguntaImagen, deletePreguntaImagen, getImageAspectRatio } from '../lib/storageService';
import { toast } from 'sonner';
import MathKeyboard from './MathKeyboard';

const LETRAS = ['a', 'b', 'c', 'd'];
const TIPOS_CON_ITEMS = ['verdadero_falso', 'unir', 'completar'];

function createEmptyItem(tipo) {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    if (tipo === 'verdadero_falso') return { id, texto: '', respuesta: 'V' };
    if (tipo === 'unir') return { id, izquierda: '', derecha: '' };
    if (tipo === 'completar') return { id, texto: '', respuesta: '' };
    return { id, texto: '' };
}

const TIPO_CONFIG = {
    seleccion_multiple: { label: 'SM', Icon: CheckSquare, classes: 'bg-indigo-100 text-indigo-700' },
    desarrollo: { label: 'D', Icon: AlignLeft, classes: 'bg-amber-100 text-amber-700' },
    verdadero_falso: { label: 'V/F', Icon: ToggleLeft, classes: 'bg-violet-100 text-violet-700' },
    unir: { label: 'Unir', Icon: Link2, classes: 'bg-sky-100 text-sky-700' },
    completar: { label: 'Completar', Icon: Type, classes: 'bg-rose-100 text-rose-700' },
};

// ── Editor de ítems ──────────────────────────────────────────────────────────

function ItemsEditor({ pregunta, editMode, onSetInstruccion, onAddItem, onUpdateItem, onDeleteItem, onFieldFocus }) {
    const { tipo, instruccionItems = '', items = [] } = pregunta;
    const qNum = pregunta.number;

    const instructionPlaceholders = {
        verdadero_falso: 'Ej: Escribe V si es verdadero o F si es falso.',
        unir: 'Ej: Une con una línea cada concepto de la columna A con su definición en la columna B.',
        completar: 'Ej: Completa los espacios en blanco con la palabra correcta.',
    };

    return (
        <div className="mt-3 space-y-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ítems</span>
                <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Instrucciones */}
            {editMode ? (
                <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Instrucciones <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                        rows={2}
                        value={instruccionItems}
                        onChange={e => onSetInstruccion(qNum, e.target.value)}
                        onFocus={e => onFieldFocus?.(e.target, qNum, 'instruccionItems')}
                        placeholder={instructionPlaceholders[tipo] || 'Escribe las instrucciones para esta sección...'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white"
                    />
                </div>
            ) : instruccionItems ? (
                <p className="text-sm italic text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-1.5">
                    {instruccionItems}
                </p>
            ) : null}

            {/* Ítems: Verdadero o Falso */}
            {tipo === 'verdadero_falso' && items.length > 0 && (
                <div className="space-y-1.5">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-5 text-right shrink-0 font-mono">{idx + 1}.</span>
                            {editMode ? (
                                <>
                                    <input
                                        type="text"
                                        value={item.texto}
                                        onChange={e => onUpdateItem(qNum, item.id, { texto: e.target.value })}
                                        onFocus={e => onFieldFocus?.(e.target, qNum, `item_${item.id}_texto`)}
                                        placeholder="Enunciado del ítem..."
                                        className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onUpdateItem(qNum, item.id, { respuesta: 'V' })}
                                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors shrink-0 ${item.respuesta === 'V' ? 'bg-emerald-500 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}
                                    >V</button>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateItem(qNum, item.id, { respuesta: 'F' })}
                                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors shrink-0 ${item.respuesta === 'F' ? 'bg-red-500 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600'}`}
                                    >F</button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteItem(qNum, item.id)}
                                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors shrink-0"
                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="flex-1 text-sm text-slate-700">{item.texto || <span className="text-slate-300 italic">Sin texto</span>}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${item.respuesta === 'V' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.respuesta}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Ítems: Unir */}
            {tipo === 'unir' && items.length > 0 && (
                editMode ? (
                    <div className="space-y-1.5">
                        {items.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 w-5 text-right shrink-0 font-mono">{idx + 1}.</span>
                                <input
                                    type="text"
                                    value={item.izquierda}
                                    onChange={e => onUpdateItem(qNum, item.id, { izquierda: e.target.value })}
                                    onFocus={e => onFieldFocus?.(e.target, qNum, `item_${item.id}_izquierda`)}
                                    placeholder="Columna A..."
                                    className="flex-1 px-2 py-1.5 text-sm border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none bg-sky-50/50"
                                />
                                <Link2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <input
                                    type="text"
                                    value={item.derecha}
                                    onChange={e => onUpdateItem(qNum, item.id, { derecha: e.target.value })}
                                    onFocus={e => onFieldFocus?.(e.target, qNum, `item_${item.id}_derecha`)}
                                    placeholder="Columna B..."
                                    className="flex-1 px-2 py-1.5 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none bg-violet-50/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => onDeleteItem(qNum, item.id)}
                                    className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors shrink-0"
                                ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wide pb-0.5">Columna A</div>
                        <div className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide pb-0.5">Columna B</div>
                        {items.map((item, idx) => (
                            <React.Fragment key={item.id}>
                                <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1.5">
                                    <span className="text-xs text-sky-400 font-mono shrink-0">{idx + 1}.</span>
                                    <span className="text-sm text-slate-700">{item.izquierda}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-2 py-1.5">
                                    <span className="text-xs text-violet-400 font-mono shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                    <span className="text-sm text-slate-700">{item.derecha}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                )
            )}

            {/* Ítems: Completar */}
            {tipo === 'completar' && items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex items-start gap-2">
                            <span className="text-xs text-slate-400 w-5 text-right shrink-0 font-mono mt-2">{idx + 1}.</span>
                            {editMode ? (
                                <>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            value={item.texto}
                                            onChange={e => onUpdateItem(qNum, item.id, { texto: e.target.value })}
                                            onFocus={e => onFieldFocus?.(e.target, qNum, `item_${item.id}_texto`)}
                                            placeholder='Texto con ___ para el espacio en blanco...'
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={item.respuesta}
                                            onChange={e => onUpdateItem(qNum, item.id, { respuesta: e.target.value })}
                                            onFocus={e => onFieldFocus?.(e.target, qNum, `item_${item.id}_respuesta`)}
                                            placeholder="Respuesta correcta..."
                                            className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none bg-emerald-50/60 text-emerald-800"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteItem(qNum, item.id)}
                                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors shrink-0 mt-1"
                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            ) : (
                                <div className="flex-1 py-0.5 space-y-0.5">
                                    <p className="text-sm text-slate-700">{item.texto || <span className="text-slate-300 italic">Sin texto</span>}</p>
                                    {item.respuesta && (
                                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 inline-block">
                                            R: {item.respuesta}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Agregar ítem */}
            {editMode && (
                <button
                    type="button"
                    onClick={() => onAddItem(qNum)}
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors py-0.5"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar ítem
                </button>
            )}

            {!editMode && items.length === 0 && (
                <p className="text-xs text-slate-400 italic">Sin ítems agregados.</p>
            )}
        </div>
    );
}

// ── Tarjeta individual ────────────────────────────────────────────────────────

function PreguntaCard({
    pregunta, editMode,
    onSetCorrect, onSetPauta, onSetEnunciado, onSetAlternativa, onFieldFocus, onSetImagen, onDelete,
    onSetInstruccionItems, onAddItem, onUpdateItem, onDeleteItem,
}) {
    const [open, setOpen] = useState(true);
    const imageInputRef = useRef(null);
    const esSM = pregunta.tipo === 'seleccion_multiple';
    const esDesarrollo = pregunta.tipo === 'desarrollo';
    const esConItems = TIPOS_CON_ITEMS.includes(pregunta.tipo);
    const altKeys = Object.keys(pregunta.alternativas || {}).filter(k => LETRAS.includes(k)).sort();
    const correcta = pregunta.respuestaCorrecta || '';
    const tipoConf = TIPO_CONFIG[pregunta.tipo] || TIPO_CONFIG.desarrollo;

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
                        placeholder={esConItems ? 'Enunciado general (opcional)...' : 'Enunciado de la pregunta...'}
                        className="flex-1 px-2 py-1 text-sm text-slate-700 font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white leading-snug"
                    />
                ) : (
                    <span className="flex-1 text-sm text-slate-700 font-medium leading-snug mt-0.5">
                        {pregunta.enunciado || (esConItems && <span className="text-slate-400 italic font-normal">Sin enunciado general</span>)}
                    </span>
                )}

                {/* Badges + chevron */}
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${tipoConf.classes}`}>
                        <tipoConf.Icon className="w-3 h-3" />
                        {tipoConf.label}
                    </span>
                    {!editMode && (esSM || esDesarrollo) && correcta && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                            {esSM ? `Clave: ${correcta.toUpperCase()}` : 'Con pauta'}
                        </span>
                    )}
                    {!editMode && esConItems && (pregunta.items?.length ?? 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            {pregunta.items.length} ítem{pregunta.items.length !== 1 ? 's' : ''}
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

                    {/* Selección múltiple — alternativas */}
                    {esSM && altKeys.length > 0 && (
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
                    )}

                    {/* Desarrollo — pauta */}
                    {esDesarrollo && (
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

                    {/* Tipos con ítems */}
                    {esConItems && (
                        <ItemsEditor
                            pregunta={pregunta}
                            editMode={editMode}
                            onSetInstruccion={onSetInstruccionItems}
                            onAddItem={onAddItem}
                            onUpdateItem={onUpdateItem}
                            onDeleteItem={onDeleteItem}
                            onFieldFocus={onFieldFocus}
                        />
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

    const preguntas = (evaluacion.questions || []).filter(q => q.enunciado || TIPOS_CON_ITEMS.includes(q.tipo));
    const puedeEditar = evaluacion.createdBy?.id === user?.uid || isManagement(user);
    const esMate = evaluacion.asignatura === 'MA';

    const isEmpty = preguntas.length === 0;
    const [editMode, setEditMode] = useState(isEmpty && puedeEditar);
    const [localQuestions, setLocalQuestions] = useState(
        isEmpty && puedeEditar ? [] : null
    );
    const [saving, setSaving] = useState(false);
    const [localInstrucciones, setLocalInstrucciones] = useState('');
    const nextNumRef = useRef(preguntas.length + 1);

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
        } else if (fieldId === 'instruccionItems') {
            handleSetInstruccionItems(questionNumber, newValue);
        } else if (fieldId.startsWith('alt_')) {
            const letra = fieldId.slice(4);
            handleSetAlternativa(questionNumber, letra, newValue);
        } else if (fieldId.startsWith('item_')) {
            // formato: item_{id}_{subfield}
            const withoutPrefix = fieldId.slice(5);
            const underIdx = withoutPrefix.indexOf('_');
            const itemId = parseInt(withoutPrefix.slice(0, underIdx));
            const subField = withoutPrefix.slice(underIdx + 1);
            handleUpdateItem(questionNumber, itemId, { [subField]: newValue });
        }

        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = start + symbol.length;
            el.selectionEnd   = start + symbol.length;
        });
    }, []);

    const handleStartEdit = () => {
        setLocalInstrucciones(evaluacion.instrucciones || '');
        const qs = evaluacion.questions.map(q => ({
            ...q,
            alternativas: { ...(q.alternativas || {}) },
            imagen: q.imagen ? { ...q.imagen } : null,
            items: q.items ? q.items.map(item => ({ ...item })) : (TIPOS_CON_ITEMS.includes(q.tipo) ? [] : undefined),
        }));
        setLocalQuestions(qs);
        nextNumRef.current = qs.length + 1;
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setLocalInstrucciones('');
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

    const handleSetInstruccionItems = (questionNumber, text) =>
        updateQuestion(questionNumber, q => ({ ...q, instruccionItems: text }));

    const handleAddItem = (questionNumber) => {
        setLocalQuestions(prev => prev.map(q => {
            if (q.number !== questionNumber) return q;
            const newItem = createEmptyItem(q.tipo);
            return { ...q, items: [...(q.items || []), newItem] };
        }));
    };

    const handleUpdateItem = (questionNumber, itemId, updates) => {
        setLocalQuestions(prev => prev.map(q => {
            if (q.number !== questionNumber) return q;
            return {
                ...q,
                items: (q.items || []).map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                ),
            };
        }));
    };

    const handleDeleteItem = (questionNumber, itemId) => {
        setLocalQuestions(prev => prev.map(q => {
            if (q.number !== questionNumber) return q;
            return { ...q, items: (q.items || []).filter(item => item.id !== itemId) };
        }));
    };

    const handleAddQuestion = (tipo) => {
        const num = nextNumRef.current;
        nextNumRef.current += 1;
        const esConItems = TIPOS_CON_ITEMS.includes(tipo);
        setLocalQuestions(prev => [
            ...(prev || []),
            {
                number: num,
                tipo,
                enunciado: '',
                alternativas: tipo === 'seleccion_multiple' ? { a: '', b: '', c: '', d: '' } : {},
                respuestaCorrecta: '',
                ...(esConItems && { instruccionItems: '', items: [] }),
                oaCode: '',
                imagen: null,
            },
        ]);
    };

    const handleDeleteQuestion = (questionNumber) => {
        setLocalQuestions(prev => {
            const q = prev.find(x => x.number === questionNumber);
            if (q?.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            return prev
                .filter(x => x.number !== questionNumber)
                .map((x, i) => ({ ...x, number: i + 1 }));
        });
        nextNumRef.current = (localQuestions?.length ?? 1) - 1 + 1;
    };

    const handleSetImagen = (questionNumber, value) => {
        updateQuestion(questionNumber, q => {
            if (q.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            return { ...q, imagen: value };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalQuestions = localQuestions.map(q => {
                const obj = { ...q };
                // Remove undefined fields so Firestore doesn't reject them
                Object.keys(obj).forEach(k => { if (obj[k] === undefined) delete obj[k]; });
                return obj;
            });

            for (let i = 0; i < finalQuestions.length; i++) {
                const q = finalQuestions[i];
                const original = evaluacion.questions.find(oq => oq.number === q.number);

                if (q.imagen?.file) {
                    try {
                        if (original?.imagen?.storagePath) {
                            await deletePreguntaImagen(original.imagen.storagePath);
                        }
                        const ar = await getImageAspectRatio(q.imagen.previewUrl);
                        const { url, storagePath } = await uploadPreguntaImagen(evaluacion.id, q.number, q.imagen.file);
                        finalQuestions[i] = { ...finalQuestions[i], imagen: { url, storagePath, aspectRatio: ar } };
                        URL.revokeObjectURL(q.imagen.previewUrl);
                    } catch {
                        toast.error(`Error al subir imagen de pregunta ${q.number}`);
                        finalQuestions[i] = { ...finalQuestions[i], imagen: original?.imagen || null };
                    }
                }

                if (q.imagen === null && original?.imagen?.storagePath) {
                    try {
                        await deletePreguntaImagen(original.imagen.storagePath);
                    } catch {
                        // No bloquear el guardado si el delete falla
                    }
                }
            }

            await updateEvaluacion(evaluacion.id, { questions: finalQuestions, instrucciones: localInstrucciones });
            setEditMode(false);
            setLocalQuestions(null);
        } finally {
            setSaving(false);
        }
    };

    const displayQuestions = editMode ? (localQuestions || []) : preguntas;

    const smCount       = preguntas.filter(q => q.tipo === 'seleccion_multiple').length;
    const devCount      = preguntas.filter(q => q.tipo === 'desarrollo').length;
    const vfCount       = preguntas.filter(q => q.tipo === 'verdadero_falso').length;
    const unirCount     = preguntas.filter(q => q.tipo === 'unir').length;
    const completarCount = preguntas.filter(q => q.tipo === 'completar').length;
    const conClave      = preguntas.filter(q => q.respuestaCorrecta).length;
    const conImg        = preguntas.filter(q => q.imagen?.url).length;

    return (
        <div className="space-y-3">
            {/* Barra superior */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
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
                    {vfCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
                            <ToggleLeft className="w-3 h-3" /> {vfCount} V/F
                        </span>
                    )}
                    {unirCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full font-medium">
                            <Link2 className="w-3 h-3" /> {unirCount} Unir
                        </span>
                    )}
                    {completarCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-medium">
                            <Type className="w-3 h-3" /> {completarCount} Completar
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
                    Edita el texto, alternativas e imágenes directamente. Para preguntas con ítems, agrega los enunciados uno a uno.
                </div>
            )}

            {editMode && esMate && (
                <MathKeyboard onInsert={handleInsertSymbol} />
            )}

            {/* Instrucciones generales */}
            {editMode ? (
                <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Instrucciones generales de la prueba
                    </label>
                    <textarea
                        rows={3}
                        value={localInstrucciones}
                        onChange={e => setLocalInstrucciones(e.target.value)}
                        placeholder="Ej: Lee atentamente cada pregunta. Responde con letra clara y ordenada. Está prohibido el uso de lápiz grafito..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none bg-white"
                    />
                    <p className="text-[11px] text-slate-400">Se mostrará al inicio de la prueba, sobre las preguntas.</p>
                </div>
            ) : evaluacion.instrucciones ? (
                <div className="px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <p className="text-[11px] font-semibold text-blue-700 mb-0.5 uppercase tracking-wide">Instrucciones</p>
                    <p className="text-sm text-slate-600 italic">{evaluacion.instrucciones}</p>
                </div>
            ) : null}

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
                            onSetInstruccionItems={handleSetInstruccionItems}
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
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

            {/* Botones agregar pregunta (solo en edición) */}
            {editMode && (
                <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Agregar pregunta</p>
                    <div className="flex flex-wrap gap-2">
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
                        <button
                            type="button"
                            onClick={() => handleAddQuestion('verdadero_falso')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-violet-200 rounded-xl text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <ToggleLeft className="w-3.5 h-3.5" />
                            Verdadero / Falso
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddQuestion('unir')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-sky-200 rounded-xl text-xs font-medium text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <Link2 className="w-3.5 h-3.5" />
                            Unir
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddQuestion('completar')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <Type className="w-3.5 h-3.5" />
                            Completar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
