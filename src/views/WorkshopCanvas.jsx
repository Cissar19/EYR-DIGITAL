import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState,
    Handle, Position, Panel, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Save, Trash2, X, Check, Square, Diamond, Circle, Type,
    Timer, Play, Pause, RotateCcw, Layout, AlignJustify, ThumbsUp, CreditCard,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ── Context para pasar callbacks a los nodos ──────────────────────────────────
const CanvasCtx = createContext({ onVote: () => {} });

// ── Paleta de colores ─────────────────────────────────────────────────────────
export const NODE_COLORS = [
    { bg: '#EFF6FF', border: '#3B82F6', text: '#1E3A8A', label: 'Azul' },
    { bg: '#F0FDF4', border: '#22C55E', text: '#14532D', label: 'Verde' },
    { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F', label: 'Ámbar' },
    { bg: '#FFF1F2', border: '#F43F5E', text: '#881337', label: 'Rojo' },
    { bg: '#F5F3FF', border: '#8B5CF6', text: '#3B0764', label: 'Violeta' },
    { bg: '#ECFEFF', border: '#06B6D4', text: '#164E63', label: 'Cyan' },
    { bg: '#FFF7ED', border: '#F97316', text: '#7C2D12', label: 'Naranja' },
    { bg: '#F8FAFC', border: '#64748B', text: '#0F172A', label: 'Gris' },
];

const NODE_TYPES_DEF = [
    { type: 'process',  label: 'Proceso',    icon: Square },
    { type: 'decision', label: 'Decisión',   icon: Diamond },
    { type: 'terminal', label: 'Inicio/Fin', icon: Circle },
    { type: 'note',     label: 'Nota',       icon: Type },
    { type: 'section',  label: 'Sección',    icon: AlignJustify },
    { type: 'tarjeta',  label: 'Tarjeta',    icon: CreditCard },
];

const TASK_STATUS = {
    pending:     { dot: 'bg-amber-400',   label: 'Pendiente',   text: 'text-amber-700' },
    in_progress: { dot: 'bg-blue-400',    label: 'En progreso', text: 'text-blue-700' },
    done:        { dot: 'bg-emerald-400', label: 'Hecho',       text: 'text-emerald-700' },
};

// ── Nodo personalizado ────────────────────────────────────────────────────────
function FlowNode({ id, data, selected }) {
    const { onVote } = useContext(CanvasCtx);
    const color  = NODE_COLORS[data.colorIdx ?? 0];
    const isNote = data.nodeType === 'note';
    const isDec  = data.nodeType === 'decision';
    const isTerm = data.nodeType === 'terminal';
    const isSect = data.nodeType === 'section';

    if (data.nodeType === 'tarjeta') {
        const st = TASK_STATUS[data.status || 'pending'];
        return (
            <div style={{
                background: '#fff',
                border: `2px solid ${selected ? '#6366F1' : '#E2E8F0'}`,
                borderRadius: 14,
                minWidth: 180,
                padding: '10px 14px',
                fontFamily: 'inherit',
                cursor: 'grab',
                boxShadow: selected ? '0 0 0 2px #6366F180' : '0 1px 4px rgba(0,0,0,0.06)',
            }}>
                <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
                <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 8, wordBreak: 'break-word' }}>
                    {data.titulo || 'Tarjeta'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: data.fecha ? 6 : 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot.replace('bg-', '').includes('amber') ? '#FBBF24' : st.dot.includes('blue') ? '#60A5FA' : '#34D399', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>{st.label}</span>
                </div>
                {data.persona && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {data.persona.charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>{data.persona.split(' ')[0]}</span>
                    </div>
                )}
                {data.fecha && (
                    <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                        📅 {new Date(data.fecha + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </p>
                )}
                <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
                <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />
            </div>
        );
    }

    if (isSect) {
        return (
            <div style={{
                background: color.bg + 'BB',
                border: `2px dashed ${color.border}`,
                borderRadius: 16,
                minWidth: 220,
                minHeight: 90,
                padding: '10px 18px',
                color: color.text,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'inherit',
                boxShadow: selected ? '0 0 0 2px #6366F1' : 'none',
                cursor: 'grab',
            }}>
                <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
                <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />
                <span>{data.label || 'Sección'}</span>
            </div>
        );
    }

    const containerStyle = {
        background: isNote ? '#FFFBEB' : color.bg,
        border: `2px solid ${isNote ? '#FCD34D' : color.border}`,
        color: isNote ? '#92400E' : color.text,
        borderRadius: isTerm ? '9999px' : isDec ? '6px' : '12px',
        transform: isDec ? 'rotate(45deg)' : undefined,
        minWidth: 100,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        boxShadow: selected ? '0 0 0 2px #6366F1' : 'none',
        fontWeight: 600,
        fontSize: 13,
        fontFamily: 'inherit',
        cursor: 'grab',
    };

    return (
        <>
            <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
            <div style={containerStyle}>
                <span style={{ transform: isDec ? 'rotate(-45deg)' : undefined, display: 'block', textAlign: 'center', maxWidth: 120, wordBreak: 'break-word' }}>
                    {data.label || '…'}
                </span>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />
            {/* Botón de votación */}
            <button
                onClick={e => { e.stopPropagation(); onVote(id); }}
                title="Votar por esta idea"
                style={{
                    position: 'absolute',
                    bottom: -16,
                    left: '50%',
                    transform: `translateX(-50%)${isDec ? ' rotate(-45deg)' : ''}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    background: (data.votes || 0) > 0 ? '#EEF2FF' : '#F8FAFC',
                    border: `1px solid ${(data.votes || 0) > 0 ? '#818CF8' : '#CBD5E1'}`,
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: (data.votes || 0) > 0 ? '#4338CA' : '#94A3B8',
                    cursor: 'pointer',
                    zIndex: 10,
                    lineHeight: 1.6,
                    whiteSpace: 'nowrap',
                }}
            >
                👍 {data.votes || 0}
            </button>
        </>
    );
}

// TarjetaNode is defined inside FlowNode via nodeType branch; register separately
function TarjetaNodeWrapper(props) { return <FlowNode {...props} />; }
const NODE_TYPES = { flowNode: FlowNode, tarjetaNode: TarjetaNodeWrapper };

// ── Editor de nodo ────────────────────────────────────────────────────────────
function NodeEditor({ node, onUpdate, onDelete, onClose }) {
    const isTarjeta = node.data.nodeType === 'tarjeta';

    // Tarjeta fields
    const [titulo,  setTitulo]  = useState(node.data.titulo  ?? '');
    const [persona, setPersona] = useState(node.data.persona ?? '');
    const [status,  setStatus]  = useState(node.data.status  ?? 'pending');
    const [fecha,   setFecha]   = useState(node.data.fecha   ?? '');

    // Flow fields
    const [label,    setLabel]    = useState(node.data.label    ?? '');
    const [colorIdx, setColorIdx] = useState(node.data.colorIdx ?? 0);
    const [nodeType, setNodeType] = useState(node.data.nodeType ?? 'process');

    const apply = () => {
        if (isTarjeta) {
            onUpdate(node.id, { titulo, persona, status, fecha, nodeType: 'tarjeta' });
        } else {
            onUpdate(node.id, { label, colorIdx, nodeType });
        }
        onClose();
    };
    const votes = node.data.votes || 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-700">{isTarjeta ? 'Editar tarjeta' : 'Editar nodo'}</span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="px-4 py-3 space-y-3">
                {isTarjeta ? (
                    <>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">Título</label>
                            <input autoFocus value={titulo} onChange={e => setTitulo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && apply()}
                                placeholder="Título de la tarea…"
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">Responsable</label>
                            <input value={persona} onChange={e => setPersona(e.target.value)}
                                placeholder="Nombre…"
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">Estado</label>
                            <div className="grid grid-cols-3 gap-1">
                                {Object.entries(TASK_STATUS).map(([k, s]) => (
                                    <button key={k} onClick={() => setStatus(k)}
                                        className={cn('py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1',
                                            status === k ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        )}>
                                        <span className={cn('w-2 h-2 rounded-full', s.dot)} />{s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">Fecha límite</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none" />
                        </div>
                    </>
                ) : (
                <>
                <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Etiqueta</label>
                    <input
                        autoFocus
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && apply()}
                        placeholder="Texto…"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Forma</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {NODE_TYPES_DEF.map(t => (
                            <button key={t.type} onClick={() => setNodeType(t.type)}
                                className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                    nodeType === t.type ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                )}>
                                <t.icon className="w-3 h-3" />{t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Color</label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {NODE_COLORS.map((c, i) => (
                            <button key={i} onClick={() => setColorIdx(i)} title={c.label}
                                style={{ background: c.bg, borderColor: colorIdx === i ? c.border : 'transparent' }}
                                className={cn('h-7 rounded-lg border-2 transition-all', colorIdx === i ? 'scale-110' : 'hover:scale-105')}
                            />
                        ))}
                    </div>
                </div>
                {votes > 0 && (
                    <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2">
                        <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
                            <ThumbsUp className="w-3 h-3" /> {votes} voto{votes !== 1 ? 's' : ''}
                        </span>
                        <button onClick={() => { onUpdate(node.id, { votes: 0 }); }}
                            className="text-xs text-red-400 hover:text-red-600 font-medium">
                            Resetear
                        </button>
                    </div>
                )}
                </>
                )}
            </div>
            <div className="flex gap-2 px-4 pb-4">
                <button onClick={apply}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                    <Check className="w-3.5 h-3.5" /> Aplicar
                </button>
                <button onClick={() => { onDelete(node.id); onClose(); }}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

// ── Cronómetro ────────────────────────────────────────────────────────────────
const TIMER_PRESETS = [
    { label: '5 min',  secs: 300 },
    { label: '10 min', secs: 600 },
    { label: '15 min', secs: 900 },
    { label: '20 min', secs: 1200 },
];

function TimerWidget({ onClose }) {
    const [mode,          setMode]          = useState('stopwatch'); // 'stopwatch' | 'countdown'
    const [running,       setRunning]       = useState(false);
    const [elapsed,       setElapsed]       = useState(0);
    const [presetSecs,    setPresetSecs]    = useState(300);
    const [remaining,     setRemaining]     = useState(300);

    useEffect(() => {
        if (!running) return;
        const t = setInterval(() => {
            if (mode === 'stopwatch') {
                setElapsed(s => s + 1);
            } else {
                setRemaining(r => {
                    if (r <= 1) { setRunning(false); return 0; }
                    return r - 1;
                });
            }
        }, 1000);
        return () => clearInterval(t);
    }, [running, mode]);

    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const display  = mode === 'stopwatch' ? elapsed : remaining;
    const isDone   = mode === 'countdown' && remaining === 0;
    const progress = mode === 'countdown' ? remaining / presetSecs : null;

    const reset = () => { setRunning(false); setElapsed(0); setRemaining(presetSecs); };
    const selectPreset = secs => { setPresetSecs(secs); setRemaining(secs); setRunning(false); };
    const switchMode = m => { setMode(m); setRunning(false); setElapsed(0); setRemaining(presetSecs); };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-20 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-30 overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-indigo-500" /> Cronómetro
                </span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Modo */}
            <div className="flex gap-1 mx-4 mt-3 bg-slate-100 rounded-xl p-0.5">
                {['stopwatch', 'countdown'].map(m => (
                    <button key={m} onClick={() => switchMode(m)}
                        className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                        )}>
                        {m === 'stopwatch' ? 'Cronómetro' : 'Regresivo'}
                    </button>
                ))}
            </div>

            {/* Presets */}
            {mode === 'countdown' && (
                <div className="flex gap-1.5 px-4 pt-2.5">
                    {TIMER_PRESETS.map(p => (
                        <button key={p.secs} onClick={() => selectPreset(p.secs)}
                            className={cn('flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all',
                                presetSecs === p.secs
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            )}>
                            {p.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Display */}
            <div className={cn('mx-4 my-3 rounded-2xl py-6 text-center relative overflow-hidden',
                isDone ? 'bg-red-50' : 'bg-slate-50'
            )}>
                {progress !== null && (
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-indigo-400 transition-all"
                        style={{ width: `${progress * 100}%` }}
                    />
                )}
                <div className={cn('text-5xl font-mono font-bold tracking-tight',
                    isDone ? 'text-red-500' : running ? 'text-indigo-700' : 'text-slate-700'
                )}>
                    {fmt(display)}
                </div>
                {isDone && <p className="text-xs text-red-400 font-bold mt-1 animate-pulse">¡Tiempo!</p>}
            </div>

            {/* Controles */}
            <div className="flex gap-2 px-4 pb-4">
                <button
                    onClick={() => setRunning(r => !r)}
                    disabled={isDone && mode === 'countdown'}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all',
                        running
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700',
                        isDone && mode === 'countdown' && 'opacity-40 cursor-not-allowed'
                    )}>
                    {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Iniciar</>}
                </button>
                <button onClick={reset} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                </button>
            </div>
        </motion.div>
    );
}

// ── Canvas principal ──────────────────────────────────────────────────────────
export default function WorkshopCanvas({ workshop, onSave }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(workshop.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(workshop.edges || []);
    const [editingNode, setEditingNode] = useState(null);
    const [isDirty,     setIsDirty]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [rfInstance,  setRfInstance]  = useState(null);
    const [showTimer,   setShowTimer]   = useState(false);

    useEffect(() => {
        setNodes(workshop.nodes || []);
        setEdges(workshop.edges || []);
        setIsDirty(false);
        setEditingNode(null);
    }, [workshop.id]);

    const dirty = useCallback(() => setIsDirty(true), []);

    const onConnect = useCallback((params) => {
        setEdges(eds => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366F1', strokeWidth: 2 },
        }, eds));
        dirty();
    }, [dirty]);

    const onNodesChangeWrapped = useCallback((changes) => {
        onNodesChange(changes);
        if (changes.some(c => c.type !== 'select')) dirty();
    }, [onNodesChange, dirty]);

    const onEdgesChangeWrapped = useCallback((changes) => {
        onEdgesChange(changes);
        if (changes.some(c => c.type !== 'select')) dirty();
    }, [onEdgesChange, dirty]);

    const addNode = useCallback((nodeType = 'process') => {
        const pos = rfInstance
            ? rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
            : { x: 200 + Math.random() * 200, y: 150 + Math.random() * 150 };
        const isTarjeta = nodeType === 'tarjeta';
        setNodes(nds => [...nds, {
            id: crypto.randomUUID(),
            type: isTarjeta ? 'tarjetaNode' : 'flowNode',
            position: pos,
            data: isTarjeta
                ? { nodeType: 'tarjeta', titulo: 'Nueva tarjeta', persona: '', status: 'pending', fecha: '' }
                : { label: NODE_TYPES_DEF.find(t => t.type === nodeType)?.label ?? 'Nodo', colorIdx: 0, nodeType },
        }]);
        dirty();
    }, [rfInstance, dirty]);

    const onNodeDoubleClick = useCallback((_, node) => setEditingNode(node), []);

    const updateNode = useCallback((id, data) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
        dirty();
    }, [dirty]);

    const deleteNode = useCallback((id) => {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
        dirty();
    }, [dirty]);

    // Votar en un nodo
    const onVote = useCallback((nodeId) => {
        setNodes(nds => nds.map(n => n.id === nodeId
            ? { ...n, data: { ...n.data, votes: (n.data.votes || 0) + 1 } }
            : n
        ));
        dirty();
    }, [dirty]);

    // Distribuir nodos en cuadrícula
    const autoArrange = useCallback(() => {
        const COLS = 3, COL_W = 230, ROW_H = 130;
        setNodes(nds => nds.map((n, i) => ({
            ...n,
            position: { x: (i % COLS) * COL_W + 40, y: Math.floor(i / COLS) * ROW_H + 40 },
        })));
        dirty();
        rfInstance?.fitView({ padding: 0.2, duration: 400 });
    }, [dirty, rfInstance]);

    // Limpiar canvas
    const clearCanvas = useCallback(() => {
        if (!window.confirm('¿Limpiar todo el canvas? Esta acción no se puede deshacer.')) return;
        setNodes([]);
        setEdges([]);
        dirty();
    }, [dirty]);

    const save = async () => {
        setSaving(true);
        await onSave(nodes, edges);
        setIsDirty(false);
        setSaving(false);
    };

    const ctxValue = useMemo(() => ({ onVote }), [onVote]);

    // Votos totales para badge en toolbar
    const totalVotes = nodes.reduce((acc, n) => acc + (n.data?.votes || 0), 0);

    return (
        <CanvasCtx.Provider value={ctxValue}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeWrapped}
                    onEdgesChange={onEdgesChangeWrapped}
                    onConnect={onConnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onInit={setRfInstance}
                    nodeTypes={NODE_TYPES}
                    fitView={nodes.length > 0}
                    deleteKeyCode={['Delete', 'Backspace']}
                    style={{ background: '#F8FAFC' }}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant="dots" gap={20} size={1} color="#CBD5E1" />
                    <Controls showInteractive={false} />
                    <MiniMap
                        nodeColor={n => NODE_COLORS[n.data?.colorIdx ?? 0]?.border ?? '#94A3B8'}
                        style={{ border: '1px solid #E2E8F0', borderRadius: 12 }}
                    />

                    {/* Toolbar principal */}
                    <Panel position="top-left">
                        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 px-3 py-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Agregar</span>
                            {NODE_TYPES_DEF.map(t => (
                                <button key={t.type} onClick={() => addNode(t.type)} title={t.label}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all">
                                    <t.icon className="w-3 h-3" />{t.label}
                                </button>
                            ))}
                            <div className="w-px h-5 bg-slate-200 mx-0.5" />
                            <button onClick={save} disabled={!isDirty || saving}
                                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                                    isDirty ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'text-slate-400 cursor-default'
                                )}>
                                <Save className="w-3.5 h-3.5" />
                                {saving ? 'Guardando…' : isDirty ? 'Guardar' : 'Guardado'}
                            </button>
                        </div>
                    </Panel>

                    {/* Herramientas de equipo */}
                    <Panel position="bottom-left">
                        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 px-3 py-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Equipo</span>

                            {/* Cronómetro */}
                            <button
                                onClick={() => setShowTimer(v => !v)}
                                title="Cronómetro"
                                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                                    showTimer
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                                )}>
                                <Timer className="w-3.5 h-3.5" /> Cronómetro
                            </button>

                            {/* Marcador de votos */}
                            {totalVotes > 0 && (
                                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200">
                                    <ThumbsUp className="w-3 h-3" />
                                    {totalVotes} votos
                                </div>
                            )}

                            <div className="w-px h-5 bg-slate-200 mx-0.5" />

                            {/* Auto-distribuir */}
                            <button
                                onClick={autoArrange}
                                disabled={nodes.length === 0}
                                title="Distribuir nodos automáticamente"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-40">
                                <Layout className="w-3.5 h-3.5" /> Distribuir
                            </button>

                            {/* Limpiar canvas */}
                            <button
                                onClick={clearCanvas}
                                disabled={nodes.length === 0}
                                title="Limpiar canvas"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all disabled:opacity-40">
                                <Trash2 className="w-3.5 h-3.5" /> Limpiar
                            </button>
                        </div>
                    </Panel>

                    <Panel position="top-right">
                        <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] text-slate-400">
                            Doble clic para editar · Arrastrar bordes para conectar · <kbd className="bg-slate-100 px-1 rounded">Del</kbd> para borrar · 👍 para votar
                        </div>
                    </Panel>
                </ReactFlow>

                {/* Cronómetro flotante */}
                <AnimatePresence>
                    {showTimer && (
                        <TimerWidget onClose={() => setShowTimer(false)} />
                    )}
                </AnimatePresence>

                {/* Editor de nodo */}
                <AnimatePresence>
                    {editingNode && (
                        <NodeEditor
                            node={editingNode}
                            onUpdate={updateNode}
                            onDelete={deleteNode}
                            onClose={() => setEditingNode(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </CanvasCtx.Provider>
    );
}
