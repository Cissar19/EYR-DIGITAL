import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckSquare, AlignLeft, ChevronDown, ChevronUp, Pencil, X, Save, Check, Image as ImageIcon, Plus, Trash2, ToggleLeft, Link2, Type, Archive } from 'lucide-react';
import { useAuth, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { useQuestionBank } from '../context/QuestionBankContext';
import { uploadPreguntaImagen } from '../lib/storageService';
import { toast } from 'sonner';
import MathKeyboard from './MathKeyboard';
import BancoPreguntasModal from './BancoPreguntasModal';

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

const HABILIDADES = ['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'];

function PreguntaCard({
    pregunta, editMode,
    onSetCorrect, onSetPauta, onSetEnunciado, onSetAlternativa, onFieldFocus, onSetImagen, onDelete,
    onSetInstruccionItems, onAddItem, onUpdateItem, onDeleteItem, onMoveUp, onMoveDown, onSetPuntaje,
    onSaveToBanco, onSetHabilidad, onSetAlternativaImagen, onSetTipo,
}) {
    const [open, setOpen] = useState(true);
    const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
    const imageInputRef = useRef(null);
    const altImageInputRef = useRef(null);
    const activeAltLetterRef = useRef(null);
    const tipoRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (tipoRef.current && !tipoRef.current.contains(e.target)) setTipoDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleAltImageClick = (letra) => {
        activeAltLetterRef.current = letra;
        altImageInputRef.current?.click();
    };
    const handleAltImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const letra = activeAltLetterRef.current;
        if (!letra) return;
        const previewUrl = URL.createObjectURL(file);
        onSetAlternativaImagen?.(pregunta.number, letra, { file, previewUrl });
        e.target.value = '';
    };
    const handleRemoveAltImage = (letra) => {
        const img = pregunta.alternativasImagenes?.[letra];
        if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
        onSetAlternativaImagen?.(pregunta.number, letra, null);
    };
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

    const TIPO_COLORS = {
        seleccion_multiple: '#3B8FE5',
        desarrollo: '#FF7A4D',
        verdadero_falso: '#26B7BB',
        unir: '#EC5BA1',
        completar: '#F4B400',
    };
    const tipoColor = TIPO_COLORS[pregunta.tipo] || '#7B5BE0';

    return (
        <div style={{
            background:'white', borderRadius:14,
            border:'1px solid rgba(20,10,40,0.06)',
            borderLeft:`4px solid ${tipoColor}`,
            overflow:'hidden',
        }}>
            {/* Header */}
            <div
                className={`flex items-start gap-3 px-4 py-3
                    ${!editMode ? 'cursor-pointer hover:bg-slate-50 transition-colors' : 'bg-white'}`}
                onClick={!editMode ? () => setOpen(o => !o) : undefined}
            >
                <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `linear-gradient(135deg, ${tipoColor}18, ${tipoColor}32)`,
                    color: tipoColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    border: `1.5px solid ${tipoColor}30`,
                    flexShrink: 0, alignSelf: 'flex-start', marginTop: 2,
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {String(pregunta.number).padStart(2, '0')}
                </div>

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
                    {/* Puntaje */}
                    {editMode && onSetPuntaje ? (
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={pregunta.puntaje ?? 1}
                                onChange={e => onSetPuntaje(pregunta.number, Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-10 px-1 py-0.5 text-[11px] font-semibold text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-200 outline-none bg-white"
                                title="Puntaje de esta pregunta"
                            />
                            <span className="text-[10px] text-slate-400">pt</span>
                        </div>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            {pregunta.puntaje ?? 1} pt
                        </span>
                    )}
                    {editMode && onSetTipo ? (
                        <div ref={tipoRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setTipoDropdownOpen(o => !o)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 7px 5px 6px', borderRadius: 9,
                                    border: `1.5px solid ${tipoColor}40`,
                                    background: `${tipoColor}10`, color: tipoColor,
                                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                <span style={{
                                    width: 20, height: 20, borderRadius: 5,
                                    background: tipoColor, color: 'white',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 8.5, fontWeight: 800,
                                }}>{tipoConf.label}</span>
                                <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                            {tipoDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
                                    background: 'white', borderRadius: 12, padding: 6,
                                    border: '1px solid rgba(20,10,40,0.06)',
                                    boxShadow: '0 12px 32px -10px rgba(40,20,80,0.25)',
                                    minWidth: 200,
                                }}>
                                    {[
                                        { tipo: 'seleccion_multiple', label: 'Selección múltiple', color: '#3B8FE5', abbr: 'SM' },
                                        { tipo: 'desarrollo',         label: 'Desarrollo',         color: '#FF7A4D', abbr: 'D' },
                                        { tipo: 'verdadero_falso',    label: 'Verdadero / Falso',  color: '#26B7BB', abbr: 'V/F' },
                                        { tipo: 'unir',               label: 'Unir',               color: '#EC5BA1', abbr: 'UN' },
                                        { tipo: 'completar',          label: 'Completar',          color: '#F4B400', abbr: 'CO' },
                                    ].map(t => (
                                        <button
                                            key={t.tipo}
                                            type="button"
                                            onClick={() => { onSetTipo(pregunta.number, t.tipo); setTipoDropdownOpen(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                                padding: '7px 9px', borderRadius: 8, border: 'none',
                                                background: pregunta.tipo === t.tipo ? `${t.color}12` : 'transparent',
                                                color: '#2a1a3a', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                textAlign: 'left', fontFamily: 'inherit',
                                            }}
                                        >
                                            <span style={{
                                                width: 22, height: 22, borderRadius: 6,
                                                background: t.color, color: 'white',
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 9, fontWeight: 800,
                                            }}>{t.abbr}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${tipoConf.classes}`}>
                            <tipoConf.Icon className="w-3 h-3" />
                            {tipoConf.label}
                        </span>
                    )}
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
                    {editMode && onMoveUp && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onMoveUp(pregunta.number); }}
                            className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                            title="Mover arriba"
                        >
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {editMode && onMoveDown && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onMoveDown(pregunta.number); }}
                            className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                            title="Mover abajo"
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
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
                    {!editMode && onSaveToBanco && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onSaveToBanco(pregunta); }}
                            className="p-0.5 rounded hover:bg-indigo-50 text-slate-300 hover:text-indigo-500 transition-colors"
                            title="Guardar en banco de preguntas"
                        >
                            <Archive className="w-3.5 h-3.5" />
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
                    {/* Habilidad (nivel Bloom) */}
                    {editMode ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <label className="text-[11px] font-medium text-slate-500 shrink-0">Habilidad:</label>
                            <select
                                value={pregunta.habilidad || ''}
                                onChange={e => onSetHabilidad?.(pregunta.number, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-300"
                            >
                                <option value="">Sin especificar</option>
                                {HABILIDADES.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    ) : pregunta.habilidad ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Habilidad:</span>
                            <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                {pregunta.habilidad}
                            </span>
                        </div>
                    ) : null}

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
                                const altImg = pregunta.alternativasImagenes?.[letra];
                                const altImgSrc = altImg?.previewUrl || altImg?.url || null;
                                return (
                                    <div
                                        key={letra}
                                        className={`flex items-start gap-2 py-1.5 px-2 rounded-lg transition-all
                                            ${esCorrecta ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-transparent'}`}
                                    >
                                        <button
                                            type="button"
                                            disabled={!editMode}
                                            onClick={() => editMode && onSetCorrect(pregunta.number, esCorrecta ? '' : letra)}
                                            title={editMode ? (esCorrecta ? 'Quitar como correcta' : 'Marcar como correcta') : ''}
                                            className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all mt-0.5
                                                ${editMode ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                                                ${esCorrecta
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'border-2 border-slate-300 text-slate-500'
                                                }`}
                                        >
                                            {esCorrecta ? <Check className="w-3 h-3" /> : letra}
                                        </button>

                                        {editMode ? (
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAltImageClick(letra)}
                                                        className="p-1 text-slate-300 hover:text-indigo-500 rounded transition-colors shrink-0"
                                                        title="Agregar imagen a esta alternativa"
                                                    >
                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {altImgSrc && (
                                                    <div className="relative inline-block">
                                                        <img
                                                            src={altImgSrc}
                                                            alt={`imagen alt ${letra}`}
                                                            className="max-h-24 rounded-lg border border-slate-200 bg-white object-contain"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAltImage(letra)}
                                                            className="absolute top-0.5 right-0.5 p-0.5 bg-white/90 border border-slate-200 rounded-md text-slate-400 hover:text-red-500 shadow-sm"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm leading-snug
                                                    ${esCorrecta ? 'text-emerald-800 font-medium' : 'text-slate-600'}`}
                                                >
                                                    {pregunta.alternativas[letra]}
                                                </span>
                                                {altImgSrc && (
                                                    <img
                                                        src={altImgSrc}
                                                        alt={`imagen alt ${letra}`}
                                                        className="mt-1 max-h-24 rounded-lg border border-slate-100 bg-white object-contain block"
                                                    />
                                                )}
                                            </div>
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
                            <input
                                ref={altImageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAltImageSelect}
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
    const { addQuestion } = useQuestionBank();

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
    const [showBancoModal, setShowBancoModal] = useState(false);
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
            alternativasImagenes: q.alternativasImagenes
                ? { ...q.alternativasImagenes }
                : (q.tipo === 'seleccion_multiple' ? { a: null, b: null, c: null, d: null } : undefined),
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
                if (q.alternativasImagenes) {
                    for (const img of Object.values(q.alternativasImagenes)) {
                        if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
                    }
                }
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
                alternativasImagenes: tipo === 'seleccion_multiple' ? { a: null, b: null, c: null, d: null } : undefined,
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
            if (q?.alternativasImagenes) {
                for (const img of Object.values(q.alternativasImagenes)) {
                    if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
                }
            }
            return prev
                .filter(x => x.number !== questionNumber)
                .map((x, i) => ({ ...x, number: i + 1 }));
        });
        nextNumRef.current = (localQuestions?.length ?? 1) - 1 + 1;
    };

    const handleSetPuntaje = (questionNumber, value) =>
        updateQuestion(questionNumber, q => ({ ...q, puntaje: value }));

    const handleSetHabilidad = (questionNumber, value) =>
        updateQuestion(questionNumber, q => ({ ...q, habilidad: value }));

    const handleSetTipo = (questionNumber, newTipo) => {
        updateQuestion(questionNumber, q => {
            const esConItemsNuevo = TIPOS_CON_ITEMS.includes(newTipo);
            const esConItemsActual = TIPOS_CON_ITEMS.includes(q.tipo);
            const next = { ...q, tipo: newTipo, respuestaCorrecta: '' };
            if (newTipo === 'seleccion_multiple') {
                next.alternativas = { a: '', b: '', c: '', d: '' };
                next.alternativasImagenes = { a: null, b: null, c: null, d: null };
            } else if (q.tipo === 'seleccion_multiple') {
                next.alternativas = {};
                next.alternativasImagenes = undefined;
            }
            if (esConItemsNuevo && !esConItemsActual) {
                next.instruccionItems = '';
                next.items = [];
            } else if (!esConItemsNuevo && esConItemsActual) {
                delete next.instruccionItems;
                delete next.items;
            }
            return next;
        });
    };

    const handleMoveUp = (questionNumber) => {
        setLocalQuestions(prev => {
            const idx = prev.findIndex(q => q.number === questionNumber);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next.map((q, i) => ({ ...q, number: i + 1 }));
        });
    };

    const handleMoveDown = (questionNumber) => {
        setLocalQuestions(prev => {
            const idx = prev.findIndex(q => q.number === questionNumber);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next.map((q, i) => ({ ...q, number: i + 1 }));
        });
    };

    const handleSetImagen = (questionNumber, value) => {
        updateQuestion(questionNumber, q => {
            if (q.imagen?.previewUrl) URL.revokeObjectURL(q.imagen.previewUrl);
            return { ...q, imagen: value };
        });
    };

    const handleSetAlternativaImagen = (questionNumber, letra, value) => {
        updateQuestion(questionNumber, q => {
            const prev = q.alternativasImagenes?.[letra];
            if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
            return {
                ...q,
                alternativasImagenes: { ...(q.alternativasImagenes || {}), [letra]: value },
            };
        });
    };

    const handleSaveToBanco = useCallback(async (pregunta) => {
        const userInfo = { id: user.uid, name: user.displayName || user.name || '' };
        await addQuestion(pregunta, evaluacion.asignatura, evaluacion.curso, userInfo);
    }, [addQuestion, user, evaluacion.asignatura, evaluacion.curso]);

    const handleAddFromBanco = useCallback((copia) => {
        const num = nextNumRef.current;
        nextNumRef.current += 1;
        setLocalQuestions(prev => [
            ...(prev || []),
            { ...copia, number: num },
        ]);
    }, []);

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
                        const { url, storagePath, aspectRatio } = await uploadPreguntaImagen(evaluacion.id, q.number, q.imagen.file);
                        finalQuestions[i] = { ...finalQuestions[i], imagen: { url, storagePath, aspectRatio } };
                        URL.revokeObjectURL(q.imagen.previewUrl);
                    } catch (err) {
                        toast.error(`Error al procesar imagen ${q.number}: ${err.message}`);
                        finalQuestions[i] = { ...finalQuestions[i], imagen: original?.imagen || null };
                    }
                }

                if (q.alternativasImagenes) {
                    const updatedAltImgs = { ...q.alternativasImagenes };
                    for (const letra of LETRAS) {
                        const altImg = q.alternativasImagenes[letra];
                        if (altImg?.file) {
                            try {
                                const { url, storagePath, aspectRatio } = await uploadPreguntaImagen(evaluacion.id, q.number, altImg.file);
                                updatedAltImgs[letra] = { url, storagePath, aspectRatio };
                                URL.revokeObjectURL(altImg.previewUrl);
                            } catch (err) {
                                toast.error(`Error al procesar imagen alt ${letra.toUpperCase()}: ${err.message}`);
                                updatedAltImgs[letra] = original?.alternativasImagenes?.[letra] || null;
                            }
                        }
                    }
                    finalQuestions[i] = { ...finalQuestions[i], alternativasImagenes: updatedAltImgs };
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
    const totalPts      = displayQuestions.reduce((s, q) => s + (q.puntaje ?? 1), 0);

    const DT = {
        primary:'#7B5BE0', primaryDark:'#5028B8', pink:'#EC5BA1',
        coral:'#FF7A4D', sky:'#3B8FE5', bgSoft:'#F4F1FB',
        ink:'#2a1a3a', muted:'#7a6a8a', line:'rgba(20,10,40,0.06)',
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* ActionBar */}
            <div style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'14px 16px', background:'white',
                border:`1px solid ${DT.line}`, borderRadius:14,
            }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{
                        padding:'6px 12px', borderRadius:9,
                        background:DT.bgSoft, color:DT.primaryDark,
                        fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums',
                    }}>{preguntas.length} preguntas</span>
                    <span style={{
                        padding:'6px 12px', borderRadius:9,
                        background:`${DT.coral}12`, color:DT.coral,
                        fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums',
                    }}>{totalPts} pts totales</span>
                    {smCount > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:'#EEF2FF', color:'#4338CA', fontSize:12, fontWeight:600 }}>{smCount} SM</span>}
                    {devCount > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:'#FFF7ED', color:'#C2410C', fontSize:12, fontWeight:600 }}>{devCount} D</span>}
                    {vfCount > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:`${DT.primary}10`, color:DT.primaryDark, fontSize:12, fontWeight:600 }}>{vfCount} V/F</span>}
                    {unirCount > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:`${DT.pink}10`, color:'#9C2160', fontSize:12, fontWeight:600 }}>{unirCount} Unir</span>}
                    {completarCount > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:'#FFFBEB', color:'#B45309', fontSize:12, fontWeight:600 }}>{completarCount} Completar</span>}
                    {!editMode && conClave > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:'#F0FDF4', color:'#166534', fontSize:12, fontWeight:600 }}>{conClave} con clave</span>}
                    {!editMode && conImg > 0 && <span style={{ padding:'4px 10px', borderRadius:8, background:DT.bgSoft, color:DT.muted, fontSize:12, fontWeight:600 }}>{conImg} con imagen</span>}
                </div>
                <div style={{ flex:1 }}/>
                {puedeEditar && !editMode && (
                    <button
                        onClick={handleStartEdit}
                        style={{
                            display:'inline-flex', alignItems:'center', gap:6,
                            padding:'9px 16px', borderRadius:10, border:`1.5px solid ${DT.line}`,
                            background:'white', color:DT.muted, fontSize:12.5, fontWeight:600,
                            cursor:'pointer', fontFamily:'inherit',
                        }}
                    >
                        <Pencil className="w-3.5 h-3.5" /> Editar preguntas
                    </button>
                )}
                {editMode && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button
                            onClick={handleCancelEdit}
                            style={{
                                display:'inline-flex', alignItems:'center', gap:6,
                                padding:'9px 14px', borderRadius:10, border:`1.5px solid ${DT.line}`,
                                background:'white', color:DT.muted, fontSize:12.5, fontWeight:600,
                                cursor:'pointer', fontFamily:'inherit',
                            }}
                        >
                            <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display:'inline-flex', alignItems:'center', gap:7,
                                padding:'9px 16px', borderRadius:10, border:'none',
                                background:`linear-gradient(90deg, ${DT.primary}, ${DT.pink})`,
                                color:'white', fontSize:12.5, fontWeight:700,
                                cursor:'pointer', fontFamily:'inherit',
                                boxShadow:'0 6px 14px -6px rgba(123,91,224,0.5)',
                                opacity: saving ? 0.7 : 1,
                            }}
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                )}
            </div>

            {editMode && (
                <div style={{
                    background:`${DT.sky}10`, border:`1.5px solid ${DT.sky}30`,
                    borderRadius:12, padding:'10px 14px',
                    display:'flex', alignItems:'center', gap:10,
                }}>
                    <Pencil className="w-3.5 h-3.5 shrink-0" style={{ color:DT.sky }} />
                    <span style={{ fontSize:12.5, color:'#1456A8', fontWeight:600, lineHeight:1.5 }}>
                        Edita el texto, alternativas e imágenes directamente. Para preguntas con ítems, agrega los enunciados uno a uno.
                    </span>
                </div>
            )}

            {editMode && esMate && (
                <MathKeyboard onInsert={handleInsertSymbol} />
            )}

            {/* Instrucciones generales */}
            {editMode ? (
                <div>
                    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
                        <label style={{ fontSize:11.5, fontWeight:600, color:DT.muted, letterSpacing:0.5, textTransform:'uppercase' }}>
                            Instrucciones generales de la prueba
                        </label>
                        <span style={{ fontSize:11, color:DT.muted, fontWeight:600 }}>{(localInstrucciones||'').length}/500</span>
                    </div>
                    <textarea
                        rows={3}
                        maxLength={500}
                        value={localInstrucciones}
                        onChange={e => setLocalInstrucciones(e.target.value)}
                        placeholder="Ej: Lee atentamente cada pregunta. Responde con letra clara y ordenada. Está prohibido el uso de lápiz grafito..."
                        style={{
                            width:'100%', padding:'14px 16px', borderRadius:14,
                            border:`1.5px solid ${DT.line}`, background:'white',
                            fontSize:13.5, color:DT.ink, lineHeight:1.5,
                            outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box',
                        }}
                        onFocus={e => { e.target.style.borderColor = DT.primary; e.target.style.boxShadow = `0 0 0 4px ${DT.primary}20`; }}
                        onBlur={e => { e.target.style.borderColor = DT.line; e.target.style.boxShadow = 'none'; }}
                    />
                    <div style={{ fontSize:11, color:DT.muted, marginTop:6, fontWeight:600 }}>
                        Se mostrará al inicio de la prueba, sobre las preguntas.
                    </div>
                </div>
            ) : evaluacion.instrucciones ? (
                <div style={{ padding:'12px 16px', background:`${DT.sky}08`, border:`1px solid ${DT.sky}25`, borderRadius:12 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:DT.sky, marginBottom:4, textTransform:'uppercase', letterSpacing:0.4 }}>Instrucciones</p>
                    <p style={{ fontSize:13, color:DT.ink, fontStyle:'italic', margin:0 }}>{evaluacion.instrucciones}</p>
                </div>
            ) : null}

            {/* Lista de preguntas */}
            {displayQuestions.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {displayQuestions.map((p, idx) => (
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
                            onMoveUp={editMode && idx > 0 ? handleMoveUp : undefined}
                            onMoveDown={editMode && idx < displayQuestions.length - 1 ? handleMoveDown : undefined}
                            onSetPuntaje={editMode ? handleSetPuntaje : undefined}
                            onSaveToBanco={!editMode && puedeEditar ? handleSaveToBanco : undefined}
                            onSetHabilidad={editMode ? handleSetHabilidad : undefined}
                            onSetAlternativaImagen={editMode ? handleSetAlternativaImagen : undefined}
                            onSetTipo={editMode ? handleSetTipo : undefined}
                        />
                    ))}
                </div>
            ) : (
                !editMode && (
                    <div style={{
                        display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent:'center', padding:'48px 24px',
                        background:'white', borderRadius:14, border:`1px solid ${DT.line}`,
                        gap:12,
                    }}>
                        <div style={{
                            width:48, height:48, borderRadius:14, background:DT.bgSoft,
                            display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                            <AlignLeft className="w-6 h-6" style={{ color:DT.muted }} />
                        </div>
                        <p style={{ fontSize:13, color:DT.muted, fontWeight:600, margin:0 }}>Esta evaluación no tiene preguntas cargadas.</p>
                    </div>
                )
            )}

            {/* Agregar pregunta (solo en edición) */}
            {editMode && (
                <div>
                    <div style={{ fontSize:11.5, fontWeight:600, color:DT.muted, letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>
                        Agregar pregunta
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:10 }}>
                        {[
                            { tipo: null,               label:'Desde banco',        subtitulo:'Reutilizar preguntas',   color:'#7B5BE0', Icon: Archive },
                            { tipo:'seleccion_multiple', label:'Selección múltiple', subtitulo:'Una respuesta correcta', color:'#3B8FE5', Icon: CheckSquare },
                            { tipo:'desarrollo',         label:'Desarrollo',         subtitulo:'Respuesta abierta',      color:'#FF7A4D', Icon: AlignLeft },
                            { tipo:'verdadero_falso',    label:'Verdadero / Falso',  subtitulo:'Verdadero o falso',      color:'#26B7BB', Icon: ToggleLeft },
                            { tipo:'unir',               label:'Unir',               subtitulo:'Asociar conceptos',      color:'#EC5BA1', Icon: Link2 },
                            { tipo:'completar',          label:'Completar',          subtitulo:'Llenar espacios',        color:'#F4B400', Icon: Type },
                        ].map((btn) => {
                            const BtnIcon = btn.Icon;
                            const c = btn.color;
                            return (
                                <button
                                    key={btn.label}
                                    type="button"
                                    onClick={() => btn.tipo ? handleAddQuestion(btn.tipo) : setShowBancoModal(true)}
                                    style={{
                                        padding:'14px', borderRadius:14,
                                        border:`1.5px solid ${c}30`,
                                        background:`${c}08`,
                                        display:'flex', alignItems:'center', gap:10,
                                        cursor:'pointer', textAlign:'left',
                                        transition:'all .15s', fontFamily:'inherit',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = `${c}15`;
                                        e.currentTarget.style.borderColor = c;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = `0 8px 18px -8px ${c}60`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = `${c}08`;
                                        e.currentTarget.style.borderColor = `${c}30`;
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width:36, height:36, borderRadius:10,
                                        background:c, color:'white',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        flexShrink:0,
                                    }}>
                                        <BtnIcon className="w-4 h-4" />
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                            <Plus className="w-3 h-3" style={{ color:c, strokeWidth:3 }} />
                                            <span style={{ fontSize:13, fontWeight:600, color:DT.ink }}>{btn.label}</span>
                                        </div>
                                        <div style={{ fontSize:10.5, color:DT.muted, fontWeight:600, marginTop:2 }}>{btn.subtitulo}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {showBancoModal && (
                <BancoPreguntasModal
                    onClose={() => setShowBancoModal(false)}
                    onSelect={handleAddFromBanco}
                    asignatura={evaluacion.asignatura}
                />
            )}
        </div>
    );
}
