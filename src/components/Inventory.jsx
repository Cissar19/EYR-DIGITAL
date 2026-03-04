import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Package, Monitor, Speaker, Zap, Key, Plus, Trash2, Edit2, X, AlertTriangle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Inventory() {
    const { items, categories, borrowItem, returnItem, addItem, updateItem, deleteItem, addCategory, deleteCategory } = useInventory();
    const { user } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState('Todo');
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // CRUD State
    const [editingItem, setEditingItem] = useState(null); // null = new, object = edit
    const [itemToDelete, setItemToDelete] = useState(null); // ID of item to delete

    // Filter Logic
    const filteredItems = activeTab === 'Todo'
        ? items
        : items.filter(item => item.category === activeTab);

    const isAdmin = user?.role === 'admin' || user?.role === 'director';

    // --- HANDLERS ---

    const handleNewItem = () => {
        setEditingItem(null);
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteItem(itemToDelete);
            toast.error("Ítem eliminado permanentemente");
            setItemToDelete(null);
        }
    };

    const handleSaveItem = (data) => {
        if (editingItem) {
            updateItem(editingItem.id, data);
            toast.success("Inventario actualizado correctamente");
        } else {
            addItem(data);
            toast.success("Nuevo artículo agregado al inventario");
        }
        setIsItemModalOpen(false);
    };

    const handleDeleteCategory = (e, category) => {
        e.stopPropagation();
        const hasItems = items.some(i => i.category === category);

        if (hasItems) {
            toast.warning(`No puedes borrar "${category}" porque tiene ítems asociados.`);
            return;
        }

        // We can use a simplified confirm here or the same modal state if we wanted generic delete
        // For now adhering to "No alert()" request strictly, let's allow direct delete if empty? 
        // Or better yet, reuse the delete modal mechanism? 
        // Generically, let's just do a direct delete if it's empty since it's low risk.
        // If the user insisted on "No alert()", I'll just delete it.
        deleteCategory(category);
        toast.info(`Categoría "${category}" eliminada`);
        if (activeTab === category) setActiveTab('Todo');
    };


    const getIcon = (category) => {
        switch (category) {
            case 'Tecnología': return Monitor;
            case 'Audio': return Speaker;
            case 'Electricidad': return Zap;
            case 'Llaves': return Key;
            default: return Package;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Inventario</h1>
                    <p className="text-slate-500 mt-1">Gestión de recursos y préstamos</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleNewItem}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Artículo</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setActiveTab('Todo')}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === 'Todo'
                            ? "bg-slate-800 text-white shadow-md"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    )}
                >
                    Todo
                </button>
                {categories.map(cat => (
                    <div key={cat} className="relative group">
                        <button
                            onClick={() => setActiveTab(cat)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap pr-8 relative",
                                activeTab === cat
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            )}
                        >
                            {cat}
                            {isAdmin && (
                                <span
                                    onClick={(e) => handleDeleteCategory(e, cat)}
                                    className={cn(
                                        "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer",
                                        activeTab === cat ? "text-indigo-100 hover:text-white" : "text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100",
                                    )}
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    </div>
                ))}
                {isAdmin && (
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 border-dashed transition-all whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs">Carpeta</span>
                    </button>
                )}
            </div>

            {/* Inventory Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                        <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-600 font-medium">No hay artículos en esta categoría</h3>
                    <p className="text-slate-400 text-sm mt-1">Selecciona otra pestaña o crea un nuevo artículo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map(item => (
                            <InventoryCard
                                key={item.id}
                                item={item}
                                user={user}
                                isAdmin={isAdmin}
                                getIcon={getIcon}
                                onEdit={() => handleEditItem(item)}
                                onDelete={() => handleDeleteClick(item.id)}
                                onBorrow={borrowItem}
                                onReturn={returnItem}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* Item Modal (Create/Edit) */}
            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={handleSaveItem}
                initialData={editingItem}
                categories={categories}
            />

            {/* Category Modal */}
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSubmit={(name) => {
                    addCategory(name);
                    toast.success("Categoría creada");
                    setIsCategoryModalOpen(false);
                }}
            />

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {itemToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar este artículo?</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Esta acción no se puede deshacer y el ítem se borrará permanentemente del inventario.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setItemToDelete(null)}
                                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-colors"
                                    >
                                        Sí, Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

// --- SUB COMPONENTS ---

function InventoryCard({ item, user, isAdmin, getIcon, onEdit, onDelete, onBorrow, onReturn }) {
    const Icon = getIcon(item.category);
    const isBorrowed = item.status === 'borrowed';
    const canReturn = isBorrowed && (item.borrowedBy === user.id || user.role === 'director' || user.role === 'admin');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group relative hover:shadow-lg transition-all duration-300"
        >
            {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 bg-white text-slate-500 hover:text-indigo-600 rounded-full shadow-sm hover:shadow-md border border-slate-100 transition-all"
                        title="Editar"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 bg-white text-slate-500 hover:text-red-600 rounded-full shadow-sm hover:shadow-md border border-slate-100 transition-all"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", isBorrowed ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600")}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                    isBorrowed
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                )}>
                    {isBorrowed ? 'Prestado' : 'Disponible'}
                </div>
            </div>

            <div className="mb-6 flex-1">
                <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{item.category}</p>
                {item.serial && <p className="text-[10px] text-slate-400 mt-2 font-mono">S/N: {item.serial}</p>}

                {isBorrowed && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="min-w-[24px] h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
                            {item.borrowedByName?.charAt(0)}
                        </div>
                        <span className="truncate">Prestado a <strong>{item.borrowedByName}</strong></span>
                    </div>
                )}
            </div>

            <div className="mt-auto">
                {!isBorrowed ? (
                    <button
                        onClick={() => {
                            // Ideally borrow/return also use custom modals, but sticking to scope of refactor request (CRUD stability)
                            // Keeping these SIMPLE for now as requested to focus on CRUD repair, but avoiding browser confirm if possible?
                            // Request said "Adiós alert()", implying general. 
                            // But task scope was specifically about "CRUD del módulo de Inventario". 
                            // Let's use toast and direct action for borrow to be safe/clean.
                            onBorrow(item.id, user.id, user.name);
                            toast.success("Préstamo registrado");
                        }}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] text-sm"
                    >
                        Solicitar Préstamo
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            if (canReturn) {
                                onReturn(item.id);
                                toast.success("Devolución registrada");
                            }
                        }}
                        disabled={!canReturn}
                        className={cn(
                            "w-full border py-2.5 rounded-xl font-medium transition-all text-sm shadow-sm",
                            canReturn
                                ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                                : "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                        )}
                    >
                        {canReturn ? "Devolver" : "No disponible"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function ItemModal({ isOpen, onClose, onSubmit, initialData, categories }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        category: initialData?.category || categories[0] || '',
        status: initialData?.status || 'available',
        serial: initialData?.serial || ''
    });

    const isEditing = !!initialData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                placeholder="Ej: Proyector Epson"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoría</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium bg-white"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Serial (Opcional)</label>
                            <input
                                type="text"
                                value={formData.serial}
                                onChange={e => setFormData({ ...formData, serial: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                placeholder="Ej: SN-123456"
                            />
                        </div>

                        {!isEditing && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado Inicial</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium bg-white"
                                >
                                    <option value="available">Disponible</option>
                                    <option value="borrowed">Prestado</option>
                                    <option value="maintenance">En Reparación</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                            {isEditing ? 'Guardar Cambios' : 'Crear Artículo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CategoryModal({ isOpen, onClose, onSubmit }) {
    if (!isOpen) return null;
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Nueva Categoría</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name); }}>
                    <div className="p-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de la Carpeta</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                            placeholder="Ej: Computación"
                            autoFocus
                        />
                    </div>

                    <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                            Crear Carpeta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
