import React, { useState, useRef } from 'react';
import {
    Download, Loader2, ChevronUp, ChevronDown, Trash2, Plus,
    AlignCenter, AlignLeft, GripVertical, Upload, X, ChevronDown as Caret,
} from 'lucide-react';
import { toast } from 'sonner';
import { generarPlantillaDesdeBlocks } from '../lib/templateExport';
import { INFO_LAYOUTS } from './formatoLayouts';
import { Save, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';

// ── Block definitions ─────────────────────────────────────────────────────────

let _seq = 0;
const uid = (t) => `${t}-${++_seq}`;

const BLOCK_META = {
    header:       { label: 'Encabezado',            color: 'blue',   removable: false },
    divider:      { label: 'Línea separadora',       color: 'slate',  removable: true  },
    eval_title:   { label: 'Identificación prueba',  color: 'indigo', removable: true  },
    info_table:   { label: 'Tabla del alumno',       color: 'teal',   removable: true  },
    free_text:    { label: 'Texto libre',            color: 'violet', removable: true  },
    instructions: { label: 'Instrucciones',          color: 'amber',  removable: true  },
};

const ADDABLE_TYPES = ['divider', 'eval_title', 'info_table', 'free_text', 'instructions'];

// Typography defaults por contexto
const T = {
    schoolName:    { color: '#1B3A8C', size: 12, bold: true  },
    subtitle:      { color: '#888888', size:  9, bold: false },
    evalAsig:      { color: '#1B3A8C', size: 13, bold: true  },
    evalTitulo:    { color: '#333333', size: 12, bold: true,  underline: true  },
    evalInfo:      { color: '#666666', size: 10, bold: false },
    tableLabel:    { color: '#888888', size: 10, bold: false },
    tableValue:    { color: '#4A4A4A', size: 10, bold: false },
    instrLabel:    { color: '#4A4A4A', size: 10, bold: true  },
    freeText:      { color: '#4A4A4A', size: 10, bold: false, italic: false },
    sectionTitle:  { color: '#1B3A8C', size: 11, bold: true  },
    questionText:  { color: '#4A4A4A', size: 10, bold: false },
};

const DEFAULT_BLOCKS = () => [
    {
        id: uid('header'), type: 'header',
        schoolName: 'Centro Educacional Ernesto Yáñez Rivera',
        schoolSubtitle: 'Huechuraba · Santiago',
        showLogo: true, logoSide: 'left',
        logoBase64: null, logoType: null,
        showUTP: true,
        showAsignaturaInHeader: true,
        showProfesorInHeader: true,
        showCalificacion: true,
        calificacionLabel: 'CALIFICACIÓN',
        typo: { schoolName: { ...T.schoolName }, subtitle: { ...T.subtitle } },
    },
    {
        id: uid('eval_title'), type: 'eval_title',
        showAsignatura: false, showCurso: false, showProfesor: false, align: 'center',
        typo: { asignatura: { ...T.evalAsig }, titulo: { ...T.evalTitulo }, info: { ...T.evalInfo } },
    },
    {
        id: uid('info_table'), type: 'info_table',
        layout: 'n-c-f', showCursoRow: false, customLabels: {},
        showExigenciaRow: true,
        exigenciaLabel: 'Exigencia:', puntajeIdealLabel: 'Puntaje Ideal:', puntajeObtenidoLabel: 'Puntaje Obtenido:',
        showOARow: true, oaLabel: 'Objetivo de Aprendizaje:',
        showInstruccionesInTable: true, instrTableLabel: 'Instrucciones:',
        typo: { label: { ...T.tableLabel }, value: { ...T.tableValue } },
    },
];

// ── Helpers UI ────────────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none gap-2">
            <span className="text-sm text-slate-700 leading-tight">{label}</span>
            <button type="button" onClick={() => onChange(!checked)}
                className={`relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-violet-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
            </button>
        </label>
    );
}

function Field({ label, children }) {
    return (
        <div className="py-1.5 space-y-1">
            {label && <label className="text-xs text-slate-500 block">{label}</label>}
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder, className = '' }) {
    return (
        <input type="text" value={value ?? ''} placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none bg-white ${className}`} />
    );
}

function Textarea({ value, onChange, rows = 2 }) {
    return (
        <textarea value={value ?? ''} rows={rows} onChange={e => onChange(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none bg-white resize-none" />
    );
}

// Control de tipografía: color + tamaño + negrita (+ cursiva/subrayado opcionales)
function TypoControl({ label, value = {}, onChange, showItalic = false, showUnderline = false }) {
    const color     = value.color     ?? '#000000';
    const size      = value.size      ?? 10;
    const bold      = value.bold      ?? false;
    const italic    = value.italic    ?? false;
    const underline = value.underline ?? false;
    const upd = (k, v) => onChange({ ...value, [k]: v });

    return (
        <div className="py-1.5">
            <div className="text-xs text-slate-500 mb-1.5">{label}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* Color */}
                <input type="color" value={color} onChange={e => upd('color', e.target.value)}
                    title="Color" className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                <input type="text" value={color} onChange={e => upd('color', e.target.value)}
                    className="w-[68px] px-1.5 py-1 border border-slate-200 rounded text-[11px] font-mono" />
                {/* Tamaño */}
                <input type="number" value={size} min={6} max={36}
                    onChange={e => upd('size', Math.max(6, Math.min(36, Number(e.target.value))))}
                    className="w-10 px-1 py-1 border border-slate-200 rounded text-xs text-center" />
                <span className="text-[10px] text-slate-400 -ml-1">pt</span>
                {/* Negrita */}
                <button onClick={() => upd('bold', !bold)} title="Negrita"
                    className={`w-7 h-7 rounded border text-sm font-bold leading-none transition-colors ${bold ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    B
                </button>
                {/* Cursiva */}
                {showItalic && (
                    <button onClick={() => upd('italic', !italic)} title="Cursiva"
                        className={`w-7 h-7 rounded border text-sm italic leading-none transition-colors ${italic ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        I
                    </button>
                )}
                {/* Subrayado */}
                {showUnderline && (
                    <button onClick={() => upd('underline', !underline)} title="Subrayado"
                        className={`w-7 h-7 rounded border text-sm underline leading-none transition-colors ${underline ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        U
                    </button>
                )}
            </div>
        </div>
    );
}

// Sección colapsable dentro del panel de propiedades
function PropSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-slate-100">
            <button onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors">
                {title}
                <Caret className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="pb-1">{children}</div>}
        </div>
    );
}

// ── Panel de propiedades por tipo ─────────────────────────────────────────────

function PropertiesPanel({ block, onChange }) {
    const set = (key, val) => onChange({ ...block, [key]: val });
    const setTypo = (key, val) => onChange({ ...block, typo: { ...block.typo, [key]: val } });

    if (block.type === 'header') {
        const fileRef = useRef(null);
        const handleLogoUpload = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const type = file.type.includes('png') ? 'png' : file.type.includes('gif') ? 'gif' : 'jpg';
                onChange({ ...block, logoBase64: ev.target.result, logoType: type });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        };
        return (
            <div>
                <PropSection title="Contenido">
                    <Field label="Nombre del colegio">
                        <Input value={block.schoolName} onChange={v => set('schoolName', v)} />
                    </Field>
                    <Field label="Subtítulo">
                        <Input value={block.schoolSubtitle} onChange={v => set('schoolSubtitle', v)} />
                    </Field>
                    <Toggle label="Mostrar logo" checked={block.showLogo} onChange={v => set('showLogo', v)} />
                    {block.showLogo && (<>
                        <Field label="Imagen del logo">
                            {block.logoBase64 ? (
                                <div className="flex items-center gap-2">
                                    <img src={block.logoBase64} alt="Logo" className="h-10 w-auto rounded border border-slate-200 object-contain bg-white p-0.5" />
                                    <button onClick={() => onChange({ ...block, logoBase64: null, logoType: null })}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors w-full justify-center">
                                    <Upload className="w-3.5 h-3.5" /> Subir imagen (PNG, JPG)
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleLogoUpload} />
                        </Field>
                        <Field label="Posición">
                            <div className="flex gap-2">
                                {[['left', 'Izquierda'], ['both', 'Ambos lados']].map(([val, lbl]) => (
                                    <button key={val} onClick={() => set('logoSide', val)}
                                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${block.logoSide === val ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </>)}
                </PropSection>
                <PropSection title="Encabezado adicional" defaultOpen={true}>
                    <Toggle label="Unidad Técnica Pedagógica" checked={block.showUTP ?? true} onChange={v => set('showUTP', v)} />
                    <Toggle label="Asignatura en encabezado" checked={block.showAsignaturaInHeader ?? true} onChange={v => set('showAsignaturaInHeader', v)} />
                    <Toggle label="Profesor en encabezado" checked={block.showProfesorInHeader ?? true} onChange={v => set('showProfesorInHeader', v)} />
                    <Toggle label="Caja Calificación" checked={block.showCalificacion ?? true} onChange={v => set('showCalificacion', v)} />
                    {(block.showCalificacion ?? true) && (
                        <Field label="Texto de la caja">
                            <Input value={block.calificacionLabel ?? 'CALIFICACIÓN'} onChange={v => set('calificacionLabel', v)} />
                        </Field>
                    )}
                </PropSection>
                <PropSection title="Tipografía" defaultOpen={false}>
                    <TypoControl label="Nombre del colegio" value={block.typo?.schoolName} onChange={v => setTypo('schoolName', v)} />
                    <TypoControl label="Subtítulo" value={block.typo?.subtitle} onChange={v => setTypo('subtitle', v)} />
                </PropSection>
            </div>
        );
    }

    if (block.type === 'divider') return (
        <div>
            <PropSection title="Estilo">
                <Field label="Color">
                    <div className="flex items-center gap-2">
                        <input type="color" value={block.color} onChange={e => set('color', e.target.value)}
                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5" />
                        <Input value={block.color} onChange={v => set('color', v)} className="flex-1" />
                    </div>
                </Field>
                <Field label={`Grosor: ${block.thickness}px`}>
                    <input type="range" min={1} max={6} value={block.thickness}
                        onChange={e => set('thickness', Number(e.target.value))}
                        className="w-full accent-violet-500" />
                </Field>
            </PropSection>
        </div>
    );

    if (block.type === 'eval_title') return (
        <div>
            <PropSection title="Contenido">
                <Toggle label="Asignatura" checked={block.showAsignatura} onChange={v => set('showAsignatura', v)} />
                <Toggle label="Curso" checked={block.showCurso} onChange={v => set('showCurso', v)} />
                <Toggle label="Profesor/a" checked={block.showProfesor} onChange={v => set('showProfesor', v)} />
                <Field label="Alineación">
                    <div className="flex gap-2">
                        {[['center', 'Centro', AlignCenter], ['left', 'Izquierda', AlignLeft]].map(([val, lbl, Icon]) => (
                            <button key={val} onClick={() => set('align', val)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border transition-colors ${block.align === val ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <Icon className="w-3.5 h-3.5" /> {lbl}
                            </button>
                        ))}
                    </div>
                </Field>
            </PropSection>
            <PropSection title="Tipografía" defaultOpen={false}>
                <TypoControl label="Línea de asignatura" value={block.typo?.asignatura} onChange={v => setTypo('asignatura', v)} />
                <TypoControl label="Título ({titulo})" value={block.typo?.titulo} onChange={v => setTypo('titulo', v)} showUnderline />
                <TypoControl label="Curso / Profesor" value={block.typo?.info} onChange={v => setTypo('info', v)} />
            </PropSection>
        </div>
    );

    if (block.type === 'info_table') return (
        <div>
            <PropSection title="Distribución">
                <div className="space-y-1.5">
                    {Object.entries(INFO_LAYOUTS).map(([key, def]) => (
                        <button key={key} onClick={() => set('layout', key)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${block.layout === key ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {def.label}
                        </button>
                    ))}
                </div>
                <Toggle label="Fila extra Curso" checked={block.showCursoRow} onChange={v => set('showCursoRow', v)} />
                <Toggle label="Fila Exigencia / Puntaje" checked={block.showExigenciaRow ?? false} onChange={v => set('showExigenciaRow', v)} />
                {block.showExigenciaRow && (<>
                    <Field label="Etiqueta Exigencia">
                        <Input value={block.exigenciaLabel ?? 'Exigencia:'} onChange={v => set('exigenciaLabel', v)} />
                    </Field>
                    <Field label="Etiqueta Puntaje Ideal">
                        <Input value={block.puntajeIdealLabel ?? 'Puntaje Ideal:'} onChange={v => set('puntajeIdealLabel', v)} />
                    </Field>
                    <Field label="Etiqueta Puntaje Obtenido">
                        <Input value={block.puntajeObtenidoLabel ?? 'Puntaje Obtenido:'} onChange={v => set('puntajeObtenidoLabel', v)} />
                    </Field>
                </>)}
                <Toggle label="Fila Objetivo de Aprendizaje" checked={block.showOARow ?? false} onChange={v => set('showOARow', v)} />
                {block.showOARow && (
                    <Field label="Etiqueta OA">
                        <Input value={block.oaLabel ?? 'Objetivo de Aprendizaje:'} onChange={v => set('oaLabel', v)} />
                    </Field>
                )}
                <Toggle label="Instrucciones en tabla" checked={block.showInstruccionesInTable ?? false} onChange={v => set('showInstruccionesInTable', v)} />
                {block.showInstruccionesInTable && (
                    <Field label="Etiqueta Instrucciones">
                        <Input value={block.instrTableLabel ?? 'Instrucciones:'} onChange={v => set('instrTableLabel', v)} />
                    </Field>
                )}
            </PropSection>
            <PropSection title="Etiquetas" defaultOpen={false}>
                {INFO_LAYOUTS[block.layout]?.cols.map(col => (
                    <Field key={col.field} label={col.field.charAt(0).toUpperCase() + col.field.slice(1)}>
                        <Input
                            value={block.customLabels?.[col.field] ?? col.label}
                            onChange={v => set('customLabels', { ...block.customLabels, [col.field]: v })}
                            placeholder={col.label} />
                    </Field>
                ))}
            </PropSection>
            <PropSection title="Tipografía" defaultOpen={false}>
                <TypoControl label="Etiqueta" value={block.typo?.label} onChange={v => setTypo('label', v)} />
                <TypoControl label="Valor / campo" value={block.typo?.value} onChange={v => setTypo('value', v)} />
            </PropSection>
        </div>
    );

    if (block.type === 'free_text') return (
        <div>
            <PropSection title="Contenido">
                <Field label="Texto">
                    <Textarea value={block.content || ''} rows={4} onChange={v => set('content', v)} />
                    <p className="text-[11px] text-slate-400 mt-1">Variables: {'{titulo}'}, {'{asignatura}'}, {'{curso}'}, {'{profesor}'}, {'{fecha}'}</p>
                </Field>
                <Field label="Alineación">
                    <div className="flex gap-2">
                        {[['left', 'Izquierda', AlignLeft], ['center', 'Centro', AlignCenter]].map(([val, lbl, Icon]) => (
                            <button key={val} onClick={() => set('align', val)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border transition-colors ${block.align === val ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <Icon className="w-3.5 h-3.5" /> {lbl}
                            </button>
                        ))}
                    </div>
                </Field>
            </PropSection>
            <PropSection title="Tipografía" defaultOpen={false}>
                <TypoControl label="Texto" value={block.typo?.text} onChange={v => setTypo('text', v)} showItalic />
            </PropSection>
        </div>
    );

    if (block.type === 'instructions') return (
        <div>
            <PropSection title="Contenido">
                <Field label="Etiqueta">
                    <Input value={block.labelText || 'Instrucciones:'} onChange={v => set('labelText', v)} />
                </Field>
                <p className="text-xs text-slate-400 pb-1">El texto viene de "Plantilla y textos".</p>
            </PropSection>
            <PropSection title="Tipografía" defaultOpen={false}>
                <TypoControl label="Etiqueta" value={block.typo?.label} onChange={v => setTypo('label', v)} />
            </PropSection>
        </div>
    );

    return null;
}

// ── VTag para el preview ──────────────────────────────────────────────────────

function VTag({ text }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 4px', borderRadius: 3, background: '#E0E7FF', color: '#4338CA', fontFamily: 'Courier New, monospace', fontSize: 9, lineHeight: 1.4 }}>
            {text}
        </span>
    );
}

// ── Preview por bloque ────────────────────────────────────────────────────────

function BlockPreview({ block }) {
    const typo = block.typo || {};
    const g = (key, def) => ({ // get typo value with default
        color:  typo[key]?.color  ?? def.color,
        size:   typo[key]?.size   ?? def.size,
        bold:   typo[key]?.bold   ?? def.bold,
        italic: typo[key]?.italic ?? def.italic,
    });

    const css = (t) => ({
        color: t.color,
        fontSize: t.size,
        fontWeight: t.bold ? 'bold' : 'normal',
        fontStyle: t.italic ? 'italic' : 'normal',
        textDecoration: t.underline ? 'underline' : 'none',
    });

    if (block.type === 'header') {
        const snT = g('schoolName', T.schoolName);
        const stT = g('subtitle',   T.subtitle);
        const showCalif = block.showCalificacion ?? true;
        const cellBorder = '1px solid #D0D0D0';
        const logoEl = block.logoBase64
            ? <img src={block.logoBase64} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            : <div style={{ width: 48, height: 48, border: '2px dashed #CBD5E1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 8 }}>LOGO</div>;
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
                <tbody>
                    <tr>
                        {block.showLogo && (
                            <td style={{ border: cellBorder, padding: '6px 8px', width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
                                {logoEl}
                            </td>
                        )}
                        <td style={{ border: cellBorder, padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={css(snT)}>{(block.schoolName || '').toUpperCase()}</div>
                            {block.schoolSubtitle && <div style={{ ...css(stT), marginTop: 2 }}>{block.schoolSubtitle}</div>}
                            {(block.showUTP ?? true) && <div style={{ ...css(stT), marginTop: 2 }}>Unidad Técnica Pedagógica</div>}
                            {(block.showAsignaturaInHeader ?? true) && <div style={{ ...css(stT), marginTop: 2 }}>Asignatura: <VTag text="{asignatura}" /></div>}
                            {(block.showProfesorInHeader ?? true) && <div style={{ ...css(stT), marginTop: 2 }}>Profesor: <VTag text="{profesor}" /></div>}
                        </td>
                        {showCalif ? (
                            <td style={{ border: cellBorder, padding: '6px 8px', width: '15%', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', fontSize: 9, color: '#333' }}>
                                {block.calificacionLabel || 'CALIFICACIÓN'}
                            </td>
                        ) : (block.showLogo && block.logoSide === 'both') ? (
                            <td style={{ border: cellBorder, padding: '6px 8px', width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
                                {logoEl}
                            </td>
                        ) : null}
                    </tr>
                </tbody>
            </table>
        );
    }

    if (block.type === 'divider') return (
        <div style={{ borderBottom: `${block.thickness}px solid ${block.color}`, width: '100%' }} />
    );

    if (block.type === 'eval_title') {
        const aT = g('asignatura', T.evalAsig);
        const tT = g('titulo',     T.evalTitulo);
        const iT = g('info',       T.evalInfo);
        const align = block.align || 'center';
        return (
            <div style={{ textAlign: align, fontFamily: 'Arial, sans-serif' }}>
                <div style={css(aT)}>
                    {block.showAsignatura ? <span>EVALUACIÓN DE <VTag text="{asignatura}" /></span> : 'EVALUACIÓN'}
                </div>
                <div style={{ ...css(tT), marginTop: 4 }}><VTag text="{titulo}" /></div>
                <div style={{ ...css(iT), marginTop: 3 }}>
                    {block.showCurso && <><VTag text="{curso}" />{' '}</>}
                    {block.showCurso && block.showProfesor && <span style={{ margin: '0 4px' }}>·</span>}
                    {block.showProfesor && <span>Profesor(a): <VTag text="{profesor}" /></span>}
                </div>
            </div>
        );
    }

    if (block.type === 'info_table') {
        const layout = INFO_LAYOUTS[block.layout] || INFO_LAYOUTS['n-f-p'];
        const labels = block.customLabels || {};
        const lT = g('label', T.tableLabel);
        const vT = g('value', T.tableValue);
        const nCols = layout.cols.length;
        const tdB = { border: '1px solid #D0D0D0', padding: '5px 8px' };
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
                <tbody>
                    <tr>
                        {layout.cols.map(col => (
                            <td key={col.field} style={{ ...tdB, width: `${col.w}%` }}>
                                <span style={css(lT)}>{labels[col.field] ?? col.label}:{' '}</span>
                                {col.field === 'nombre' && <span style={{ ...css(vT), borderBottom: `1px solid ${vT.color}` }}>___________</span>}
                                {col.field === 'fecha'  && <VTag text="{fecha}" />}
                                {col.field === 'puntaje' && <span style={css(vT)}>___ / <VTag text="{total_puntos}" /></span>}
                                {col.field === 'curso'  && <span style={{ ...css(vT), borderBottom: `1px solid ${vT.color}` }}>_______</span>}
                            </td>
                        ))}
                    </tr>
                    {block.showCursoRow && (
                        <tr>
                            <td colSpan={nCols} style={tdB}>
                                <span style={css(lT)}>Curso:{' '}</span>
                                <span style={{ ...css(vT), borderBottom: `1px solid ${vT.color}` }}>_____________</span>
                            </td>
                        </tr>
                    )}
                    {block.showExigenciaRow && nCols >= 2 && (
                        <tr>
                            <td style={tdB}>
                                <span style={css(lT)}>{block.exigenciaLabel || 'Exigencia:'}{' '}</span>
                                <span style={css(vT)}>_______</span>
                            </td>
                            <td style={tdB}>
                                <span style={css(lT)}>{block.puntajeIdealLabel || 'Puntaje Ideal:'}{' '}</span>
                                <span style={css(vT)}>_______</span>
                            </td>
                            {nCols >= 3 && (
                                <td colSpan={nCols - 2} style={tdB}>
                                    <span style={css(lT)}>{block.puntajeObtenidoLabel || 'Puntaje Obtenido:'}{' '}</span>
                                    <span style={css(vT)}>_______</span>
                                </td>
                            )}
                        </tr>
                    )}
                    {block.showOARow && (
                        <tr>
                            <td style={tdB}>
                                <span style={css(lT)}>{block.oaLabel || 'Objetivo de Aprendizaje:'}</span>
                            </td>
                            <td colSpan={nCols - 1} style={tdB}>
                                <VTag text="{oa}" />
                            </td>
                        </tr>
                    )}
                    {block.showInstruccionesInTable && (
                        <tr>
                            <td style={tdB}>
                                <span style={css(lT)}>{block.instrTableLabel || 'Instrucciones:'}</span>
                            </td>
                            <td colSpan={nCols - 1} style={tdB}>
                                <VTag text="{instrucciones}" />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }

    if (block.type === 'free_text') {
        const tT = g('text', T.freeText);
        return (
            <div style={{ ...css(tT), textAlign: block.align || 'left', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                {block.content || <span style={{ color: '#CBD5E1', fontStyle: 'italic', fontWeight: 'normal' }}>Texto libre…</span>}
            </div>
        );
    }

    if (block.type === 'instructions') {
        const lT = g('label', T.instrLabel);
        return (
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 10 }}>
                <span style={css(lT)}>{block.labelText || 'Instrucciones:'}{' '}</span>
                <VTag text="{instrucciones}" />
            </div>
        );
    }

    return null;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function EditorFormato() {
    const [blocks, setBlocks]           = useState(DEFAULT_BLOCKS);
    const [selectedId, setSelectedId]   = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [nombreArchivo, setNombreArchivo] = useState('plantilla_prueba');

    const { user } = useAuth();
    const [formatos, setFormatos]               = useState([]);
    const [currentFormatoId, setCurrentFormatoId] = useState(null);
    const [currentNombre, setCurrentNombre]     = useState('Nuevo formato');
    const [saving, setSaving]                   = useState(false);

    React.useEffect(() => {
        return subscribeToCollection('formatos_prueba', setFormatos, orderBy('updatedAt', 'desc'));
    }, []);

    const loadFormato = (fmt) => {
        setBlocks((fmt.bloques || []).map(b => ({ ...b, id: uid(b.type) })));
        setCurrentFormatoId(fmt.id);
        setCurrentNombre(fmt.nombre || 'Sin nombre');
        setSelectedId(null);
    };

    const handleNuevo = () => {
        setBlocks(DEFAULT_BLOCKS());
        setCurrentFormatoId(null);
        setCurrentNombre('Nuevo formato');
        setSelectedId(null);
    };

    const handleGuardar = async () => {
        if (!currentNombre.trim()) { toast.error('El formato necesita un nombre'); return; }
        setSaving(true);
        try {
            const fmtData = { nombre: currentNombre.trim(), bloques: blocks, creadoPor: user?.uid };
            if (currentFormatoId) {
                await updateDocument('formatos_prueba', currentFormatoId, fmtData);
                toast.success('Formato actualizado');
            } else {
                const created = await createDocument('formatos_prueba', fmtData);
                setCurrentFormatoId(created.id);
                toast.success('Formato guardado');
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarFormato = async (id) => {
        try {
            await removeDocument('formatos_prueba', id);
            if (currentFormatoId === id) handleNuevo();
            toast.success('Formato eliminado');
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
    };

    const selectedBlock = blocks.find(b => b.id === selectedId) || null;
    const updateBlock = (updated) => setBlocks(bs => bs.map(b => b.id === updated.id ? updated : b));
    const moveUp   = (id) => setBlocks(bs => { const i = bs.findIndex(b => b.id === id); if (i <= 0) return bs; const a = [...bs]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
    const moveDown = (id) => setBlocks(bs => { const i = bs.findIndex(b => b.id === id); if (i >= bs.length - 1) return bs; const a = [...bs]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
    const remove   = (id) => { setBlocks(bs => bs.filter(b => b.id !== id)); if (selectedId === id) setSelectedId(null); };

    const addBlock = (type) => {
        const defaults = {
            divider:      { color: '#1B3A8C', thickness: 2 },
            eval_title:   { showAsignatura: false, showCurso: false, showProfesor: false, align: 'center', typo: { asignatura: { ...T.evalAsig }, titulo: { ...T.evalTitulo }, info: { ...T.evalInfo } } },
            info_table:   { layout: 'n-f-p', showCursoRow: false, customLabels: {}, typo: { label: { ...T.tableLabel }, value: { ...T.tableValue } } },
            free_text:    { content: '', align: 'left', typo: { text: { ...T.freeText } } },
            instructions: { labelText: 'Instrucciones:', typo: { label: { ...T.instrLabel } } },
        };
        const nb = { id: uid(type), type, ...(defaults[type] || {}) };
        setBlocks(bs => [...bs, nb]);
        setSelectedId(nb.id);
        setShowAddMenu(false);
    };

    const handleDescargar = async () => {
        setDownloading(true);
        try {
            await generarPlantillaDesdeBlocks({ blocks, nombreArchivo });
            toast.success('Plantilla descargada');
        } catch (err) {
            toast.error('Error al generar: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const dotColor = { blue: '#3B82F6', slate: '#64748B', indigo: '#6366F1', teal: '#14B8A6', violet: '#8B5CF6', amber: '#F59E0B', rose: '#F43F5E' };

    return (
        <div className="space-y-4">

            {/* ── Mis formatos ─────────────────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-700">Mis formatos</span>
                    </div>
                    <button onClick={handleNuevo}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Nuevo
                    </button>
                </div>
                {formatos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay formatos guardados. Diseña uno y guárdalo.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {formatos.map(fmt => (
                            <div key={fmt.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${fmt.id === currentFormatoId ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <button onClick={() => loadFormato(fmt)} className="leading-none">{fmt.nombre}</button>
                                <button onClick={() => handleEliminarFormato(fmt.id)} className="text-slate-300 hover:text-red-400 transition-colors leading-none ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Toolbar: nombre + guardar + descargar ─────────────────── */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <input
                    type="text"
                    value={currentNombre}
                    onChange={e => setCurrentNombre(e.target.value)}
                    placeholder="Nombre del formato..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                />
                <input
                    type="text"
                    value={nombreArchivo}
                    onChange={e => setNombreArchivo(e.target.value)}
                    placeholder="nombre_archivo"
                    className="w-44 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none text-slate-500"
                />
                <button
                    onClick={handleGuardar}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {currentFormatoId ? 'Guardar cambios' : 'Guardar formato'}
                </button>
                <button
                    onClick={handleDescargar}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Ejemplo .docx
                </button>
            </div>

            {/* ── Editor visual ─────────────────────────────────────────── */}
            <div className="flex gap-5 items-start min-h-[700px]">

                    {/* ── Panel izquierdo ─────────────────────────────────── */}
                    <div className="w-64 shrink-0 space-y-3">

                        {/* Lista de bloques */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 flex items-center justify-between">
                                <span>Bloques</span>
                                <div className="relative">
                                    <button onClick={() => setShowAddMenu(v => !v)} className="text-violet-600 hover:text-violet-700 transition-colors p-0.5">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    {showAddMenu && (
                                        <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-48">
                                            {ADDABLE_TYPES.map(type => (
                                                <button key={type} onClick={() => addBlock(type)}
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor[BLOCK_META[type].color], display: 'inline-block', flexShrink: 0 }} />
                                                    {BLOCK_META[type].label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {blocks.map((block, idx) => {
                                    const meta = BLOCK_META[block.type];
                                    const isSel = block.id === selectedId;
                                    return (
                                        <div key={block.id} onClick={() => setSelectedId(isSel ? null : block.id)}
                                            className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors group ${isSel ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                                            <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor[meta.color], flexShrink: 0, display: 'inline-block' }} />
                                            <span className={`text-xs flex-1 truncate ${isSel ? 'font-semibold text-violet-700' : 'text-slate-600'}`}>{meta.label}</span>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {idx > 0 && <button onClick={e => { e.stopPropagation(); moveUp(block.id); }} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronUp className="w-3 h-3" /></button>}
                                                {idx < blocks.length - 1 && <button onClick={e => { e.stopPropagation(); moveDown(block.id); }} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronDown className="w-3 h-3" /></button>}
                                                {meta.removable && <button onClick={e => { e.stopPropagation(); remove(block.id); }} className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Propiedades del bloque seleccionado */}
                        {selectedBlock && (
                            <div className="border border-violet-200 rounded-xl overflow-hidden">
                                <div className="px-3 py-2 bg-violet-50 text-[11px] font-semibold text-violet-600 uppercase tracking-wide border-b border-violet-200">
                                    {BLOCK_META[selectedBlock.type].label}
                                </div>
                                <div className="px-3 pb-2 pt-1">
                                    <PropertiesPanel block={selectedBlock} onChange={updateBlock} />
                                </div>
                            </div>
                        )}

                        {/* Archivo + Descargar */}
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Nombre del archivo</label>
                                <Input value={nombreArchivo} onChange={setNombreArchivo} placeholder="plantilla_prueba" />
                            </div>
                            <button onClick={handleDescargar} disabled={downloading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {downloading ? 'Generando…' : 'Descargar .docx'}
                            </button>
                        </div>
                    </div>

                    {/* ── Preview en tiempo real ──────────────────────────── */}
                    <div className="flex-1 overflow-auto bg-slate-300 rounded-2xl p-6">
                        <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '595px' }}>
                            <div style={{ background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', width: 595, minHeight: 842, padding: '56px 64px', boxSizing: 'border-box' }}>
                                {blocks.map((block) => {
                                    const isSel = block.id === selectedId;
                                    return (
                                        <div key={block.id} onClick={() => setSelectedId(isSel ? null : block.id)}
                                            style={{
                                                marginBottom: block.type === 'divider' ? 14 : 12,
                                                marginTop: block.type === 'divider' ? 10 : 0,
                                                cursor: 'pointer',
                                                outline: isSel ? '2px solid #8B5CF6' : '1px solid transparent',
                                                outlineOffset: 4, borderRadius: 4, padding: 2,
                                                transition: 'outline 0.1s',
                                            }}>
                                            <BlockPreview block={block} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>

        </div>
    );
}
