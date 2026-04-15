import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState,
    Handle, Position, Panel,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Plus, Trash2, X, Check, ChevronDown,
    Square, Diamond, Circle, ArrowRight, Type, Palette,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ── Colores de nodos ───────────────────────────────────────────────────────────
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

// ── Tipos de nodos ─────────────────────────────────────────────────────────────
const NODE_TYPES_CONFIG = [
    { type: 'process',  label: 'Proceso',    shape: 'rect' },
    { type: 'decision', label: 'Decisión',   shape: 'diamond' },
    { type: 'terminal', label: 'Inicio/Fin', shape: 'oval' },
    { type: 'text',     label: 'Texto',      shape: 'text' },
];

// ── Custom Node ────────────────────────────────────────────────────────────────
function FlowNode({ data, selected }) {
    const color = NODE_COLORS[data.colorIdx ?? 0];
    const isText = data.nodeType === 'text';
    const isDiamond = data.nodeType === 'decision';
    const isOval = data.nodeType === 'terminal';

    const baseStyle = {
        background: isText ? 'transparent' : color.bg,
        border: isText ? 'none' : `2px solid ${color.border}`,
        color: color.text,
    };

    const shapeClass = cn(
        "min-w-[100px] min-h-[40px] flex items-center justify-center px-4 py-2 text-sm font-semibold transition-all",
        isOval ? "rounded-full" : isDiamond ? "rotate-45" : isText ? "" : "rounded-xl",
        selected && !isText && "ring-2 ring-offset-1 ring-indigo-400",
    );

    return (
        <div style={{ position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ opacity: 0.6 }} />
            <Handle type="target" position={Position.Left} style={{ opacity: 0.6 }} />
            <div className={shapeClass} style={baseStyle}>
                <span className={isDiamond ? "-rotate-45 block" : "block"}>
                    {data.label || (isText ? 'Texto…' : 'Nodo')}
                </span>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0.6 }} />
            <Handle type="source" position={Position.Right} style={{ opacity: 0.6 }} />
        </div>
    );
}

const nodeTypes = { flowNode: FlowNode };

// ── Node Editor Panel ──────────────────────────────────────────────────────────
function NodeEditor({ node, onUpdate, onDelete, onClose }) {
    const [label, setLabel] = useState(node.data.label || '');
    const [colorIdx, setColorIdx] = useState(node.data.colorIdx ?? 0);
    const [nodeType, setNodeType] = useState(node.data.nodeType || 'process');

    const handleSave = () => {
        onUpdate(node.id, { label, colorIdx, nodeType });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Editar nodo</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="px-4 py-3 space-y-3">
                {/* Label */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Etiqueta</label>
                    <input
                        autoFocus
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
                        placeholder="Texto del nodo…"
                    />
                </div>

                {/* Node type */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Forma</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {NODE_TYPES_CONFIG.map(t => (
                            <button
                                key={t.type}
                                onClick={() => setNodeType(t.type)}
                                className={cn(
                                    "px-2 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                    nodeType === t.type
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Color</label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {NODE_COLORS.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => setColorIdx(i)}
                                title={c.label}
                                className={cn(
                                    "h-7 rounded-lg border-2 transition-all",
                                    colorIdx === i ? "scale-110 border-slate-600" : "border-transparent hover:scale-105"
                                )}
                                style={{ background: c.bg, borderColor: colorIdx === i ? c.border : 'transparent', outlineColor: c.border }}
                            >
                                <span className="sr-only">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 pb-4 flex gap-2">
                <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                    <Check className="w-3.5 h-3.5" /> Aplicar
                </button>
                <button
                    onClick={() => { onDelete(node.id); onClose(); }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

// ── Main Canvas ────────────────────────────────────────────────────────────────
export default function WorkshopCanvas({ workshop, onSave }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(workshop.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(workshop.edges || []);
    const [editingNode, setEditingNode] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const reactFlowWrapper = useRef(null);
    const [rfInstance, setRfInstance] = useState(null);

    // Reset when workshop changes
    useEffect(() => {
        setNodes(workshop.nodes || []);
        setEdges(workshop.edges || []);
        setIsDirty(false);
    }, [workshop.id]);

    const markDirty = useCallback(() => setIsDirty(true), []);

    const onConnect = useCallback((params) => {
        setEdges(eds => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366F1', strokeWidth: 2 },
            animated: false,
        }, eds));
        markDirty();
    }, [markDirty]);

    const onNodesChangeTracked = useCallback((changes) => {
        onNodesChange(changes);
        if (changes.some(c => c.type === 'position' || c.type === 'remove')) markDirty();
    }, [onNodesChange, markDirty]);

    const onEdgesChangeTracked = useCallback((changes) => {
        onEdgesChange(changes);
        markDirty();
    }, [onEdgesChange, markDirty]);

    const addNode = useCallback((nodeType = 'process') => {
        const id = crypto.randomUUID();
        const center = rfInstance
            ? rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
            : { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };

        const newNode = {
            id,
            type: 'flowNode',
            position: center,
            data: { label: NODE_TYPES_CONFIG.find(t => t.type === nodeType)?.label || 'Nodo', colorIdx: 0, nodeType },
        };
        setNodes(nds => [...nds, newNode]);
        markDirty();
    }, [rfInstance, markDirty]);

    const onNodeDoubleClick = useCallback((_, node) => {
        setEditingNode(node);
    }, []);

    const handleUpdateNode = useCallback((nodeId, newData) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
        markDirty();
    }, []);

    const handleDeleteNode = useCallback((nodeId) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        markDirty();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await onSave(nodes, edges);
        setIsDirty(false);
        setSaving(false);
    };

    return (
        <div className="relative w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeTracked}
                onEdgesChange={onEdgesChangeTracked}
                onConnect={onConnect}
                onNodeDoubleClick={onNodeDoubleClick}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                fitView
                deleteKeyCode="Delete"
                className="bg-slate-50/50"
            >
                <Background variant="dots" gap={20} size={1} color="#CBD5E1" />
                <Controls />
                <MiniMap
                    nodeColor={n => NODE_COLORS[n.data?.colorIdx ?? 0]?.border || '#94A3B8'}
                    className="!bg-white !border !border-slate-200 !rounded-xl !shadow-sm"
                />

                {/* Toolbar panel */}
                <Panel position="top-left">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl shadow-md border border-slate-200 px-3 py-2">
                        <span className="text-xs font-bold text-slate-400 mr-1">Agregar</span>
                        {NODE_TYPES_CONFIG.map(t => (
                            <button
                                key={t.type}
                                onClick={() => addNode(t.type)}
                                title={t.label}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all"
                            >
                                {t.type === 'process' && <Square className="w-3 h-3" />}
                                {t.type === 'decision' && <Diamond className="w-3 h-3" />}
                                {t.type === 'terminal' && <Circle className="w-3 h-3" />}
                                {t.type === 'text' && <Type className="w-3 h-3" />}
                                {t.label}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <button
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                isDirty
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                    : "text-slate-400 cursor-default"
                            )}
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Guardando…' : isDirty ? 'Guardar' : 'Guardado'}
                        </button>
                    </div>
                </Panel>

                <Panel position="top-right">
                    <p className="text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded-lg border border-slate-100">
                        Doble clic para editar · <kbd>Delete</kbd> para borrar seleccionado
                    </p>
                </Panel>
            </ReactFlow>

            {/* Node editor */}
            <AnimatePresence>
                {editingNode && (
                    <NodeEditor
                        node={editingNode}
                        onUpdate={handleUpdateNode}
                        onDelete={handleDeleteNode}
                        onClose={() => setEditingNode(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
