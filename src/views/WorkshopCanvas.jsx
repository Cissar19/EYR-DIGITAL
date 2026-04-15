import React, { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState,
    Handle, Position, Panel, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, Trash2, X, Check, Square, Diamond, Circle, Type } from 'lucide-react';
import { cn } from '../lib/utils';

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
];

// ── Custom node ───────────────────────────────────────────────────────────────
function FlowNode({ data, selected }) {
    const color = NODE_COLORS[data.colorIdx ?? 0];
    const isNote = data.nodeType === 'note';
    const isDec  = data.nodeType === 'decision';
    const isTerm = data.nodeType === 'terminal';

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
        boxShadow: selected ? `0 0 0 2px #6366F1` : 'none',
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
        </>
    );
}

const NODE_TYPES = { flowNode: FlowNode };

// ── Node editor ───────────────────────────────────────────────────────────────
function NodeEditor({ node, onUpdate, onDelete, onClose }) {
    const [label,    setLabel]    = useState(node.data.label    ?? '');
    const [colorIdx, setColorIdx] = useState(node.data.colorIdx ?? 0);
    const [nodeType, setNodeType] = useState(node.data.nodeType ?? 'process');

    const apply = () => { onUpdate(node.id, { label, colorIdx, nodeType }); onClose(); };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-4 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-700">Editar nodo</span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="px-4 py-3 space-y-3">
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
                                className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                    nodeType === t.type ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
                                className={cn("h-7 rounded-lg border-2 transition-all", colorIdx === i ? "scale-110" : "hover:scale-105")}
                            />
                        ))}
                    </div>
                </div>
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function WorkshopCanvas({ workshop, onSave }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(workshop.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(workshop.edges || []);
    const [editingNode, setEditingNode] = useState(null);
    const [isDirty,     setIsDirty]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [rfInstance,  setRfInstance]  = useState(null);

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
        setNodes(nds => [...nds, {
            id: crypto.randomUUID(),
            type: 'flowNode',
            position: pos,
            data: { label: NODE_TYPES_DEF.find(t => t.type === nodeType)?.label ?? 'Nodo', colorIdx: 0, nodeType },
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

    const save = async () => {
        setSaving(true);
        await onSave(nodes, edges);
        setIsDirty(false);
        setSaving(false);
    };

    return (
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

                {/* Toolbar */}
                <Panel position="top-left">
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 px-3 py-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Agregar</span>
                        {NODE_TYPES_DEF.map(t => (
                            <button key={t.type} onClick={() => addNode(t.type)} title={t.label}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all">
                                <t.icon className="w-3 h-3" />{t.label}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-slate-200 mx-0.5" />
                        <button onClick={save} disabled={!isDirty || saving}
                            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                isDirty ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" : "text-slate-400 cursor-default"
                            )}>
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Guardando…' : isDirty ? 'Guardar' : 'Guardado'}
                        </button>
                    </div>
                </Panel>

                <Panel position="top-right">
                    <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] text-slate-400">
                        Doble clic para editar · Arrastrar bordes para conectar · <kbd className="bg-slate-100 px-1 rounded">Del</kbd> para borrar
                    </div>
                </Panel>
            </ReactFlow>

            {/* Node editor overlay */}
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
    );
}
