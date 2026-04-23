import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import {
    Package, Plus, Edit3, Trash2, X, AlertTriangle,
    TrendingUp, ShoppingCart, AlertCircle, Wrench, ChevronRight, FolderPlus, Home, Pencil, Minus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEquipment, getIconComponent, ICON_MAP } from '../context/EquipmentContext';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';

export default function InventoryView() {
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);
    const {
        folders,
        addFolder,
        updateFolder,
        deleteFolder,
        getItemsByFolder,
        equipmentList,
        addItem,
        updateItem,
        deleteItem,
        toggleStatus,
        getTotalLoaned,
        getLowStockItems
    } = useEquipment();

    // Navigation state
    const [currentFolder, setCurrentFolder] = useState(null);

    // Modal states
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
    const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
    const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingFolder, setEditingFolder] = useState(null);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form data
    const [itemFormData, setItemFormData] = useState({
        name: '',
        category: '',
        stock: '',
        icon: 'Plug',
        description: ''
    });

    const [folderFormData, setFolderFormData] = useState({
        name: '',
        icon: 'Package',
        color: 'blue'
    });

    // Calculate KPIs
    const totalItems = equipmentList.reduce((sum, item) => sum + item.stock, 0);
    const totalLoaned = getTotalLoaned();
    const lowStockItems = getLowStockItems(3);

    // Get items for current view
    const currentItems = currentFolder
        ? getItemsByFolder(currentFolder.id)
        : [];

    // ============================================
    // FOLDER OPERATIONS
    // ============================================

    const handleOpenNewFolderModal = () => {
        setFolderFormData({ name: '', icon: 'Package', color: 'blue' });
        setIsFolderModalOpen(true);
    };

    const handleCreateFolder = (e) => {
        e.preventDefault();
        addFolder(folderFormData);
        setIsFolderModalOpen(false);
    };

    const handleOpenEditFolderModal = (folder, e) => {
        e.stopPropagation(); // Prevent folder navigation
        setEditingFolder(folder);
        setFolderFormData({
            name: folder.name,
            icon: folder.icon,
            color: folder.color
        });
        setIsEditFolderModalOpen(true);
    };

    const handleUpdateFolder = (e) => {
        e.preventDefault();
        updateFolder(editingFolder.id, folderFormData);
        setIsEditFolderModalOpen(false);
        setEditingFolder(null);
    };

    const handleOpenDeleteModal = (folder, e) => {
        e.stopPropagation();
        setFolderToDelete(folder);
        setIsDeleteFolderModalOpen(true);
    };

    const confirmDeleteFolder = () => {
        if (folderToDelete) {
            deleteFolder(folderToDelete.id);
        }
        setIsDeleteFolderModalOpen(false);
        setFolderToDelete(null);
    };

    const handleEnterFolder = (folder) => {
        setCurrentFolder(folder);
    };

    const handleExitFolder = () => {
        setCurrentFolder(null);
    };

    // ============================================
    // ITEM OPERATIONS
    // ============================================

    const handleAddNewItem = () => {
        setEditingItem(null);
        setItemFormData({
            name: '',
            category: '',
            stock: '',
            icon: 'Plug',
            description: ''
        });
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setItemFormData({
            name: item.name,
            category: item.category,
            stock: item.stock.toString(),
            icon: item.icon,
            description: item.description || ''
        });
        setIsItemModalOpen(true);
    };

    const handleSubmitItem = (e) => {
        e.preventDefault();

        const itemData = {
            name: itemFormData.name,
            category: itemFormData.category,
            stock: parseInt(itemFormData.stock),
            icon: itemFormData.icon,
            description: itemFormData.description,
            folderId: currentFolder?.id || null
        };

        if (editingItem) {
            updateItem(editingItem.id, itemData);
        } else {
            addItem(itemData);
        }

        setIsItemModalOpen(false);
    };

    const handleOpenDeleteItemModal = (item) => {
        setItemToDelete(item);
        setIsDeleteItemModalOpen(true);
    };

    const confirmDeleteItem = () => {
        if (itemToDelete) {
            deleteItem(itemToDelete.id);
        }
        setIsDeleteItemModalOpen(false);
        setItemToDelete(null);
    };

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    const renderBreadcrumbs = () => (
        <div className="flex items-center gap-2 mb-6">
            <button
                onClick={handleExitFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/50 transition-all text-slate-600 hover:text-slate-900"
            >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Inventario</span>
            </button>
            {currentFolder && (
                <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <span className="px-4 py-2 bg-white/80 rounded-xl text-sm font-semibold text-slate-900">
                        {currentFolder.name}
                    </span>
                </>
            )}
        </div>
    );

    const renderRootView = () => (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-300/50">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-slate-900 tracking-tight">
                            Inventario General
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Sistema de carpetas • Gestión organizada
                        </p>
                    </div>
                </div>

                {userCanEdit && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenNewFolderModal}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 shadow-2xl shadow-purple-300 transition-all"
                    >
                        <FolderPlus className="w-5 h-5" />
                        Nueva Carpeta
                    </motion.button>
                )}
            </div>

            {/* KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="text-4xl font-light text-slate-900 mb-1">{totalItems}</div>
                    <div className="text-sm text-slate-500 font-medium">Total de Ítems</div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="text-4xl font-light text-slate-900 mb-1">{totalLoaned}</div>
                    <div className="text-sm text-slate-500 font-medium">Prestados Ahora</div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            lowStockItems.length > 0
                                ? "bg-gradient-to-br from-red-100 to-orange-200"
                                : "bg-gradient-to-br from-slate-100 to-slate-200"
                        )}>
                            <AlertTriangle className={cn(
                                "w-6 h-6",
                                lowStockItems.length > 0 ? "text-red-600" : "text-slate-400"
                            )} />
                        </div>
                    </div>
                    <div className="text-4xl font-light text-slate-900 mb-1">{lowStockItems.length}</div>
                    <div className="text-sm text-slate-500 font-medium">Alerta Bajo Stock</div>
                </div>
            </div>

            {/* Folder Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder, index) => {
                    const FolderIcon = getIconComponent(folder.icon);
                    const itemCount = getItemsByFolder(folder.id).length;

                    const colorMap = {
                        blue: 'from-blue-400 to-blue-600',
                        yellow: 'from-yellow-400 to-orange-500',
                        purple: 'from-purple-400 to-indigo-600',
                        green: 'from-green-400 to-emerald-600',
                        red: 'from-red-400 to-rose-600'
                    };

                    return (
                        <motion.div
                            key={folder.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={() => handleEnterFolder(folder)}
                            className="group bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-slate-200 cursor-pointer relative overflow-hidden"
                        >
                            {/* Gradient Background */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                                colorMap[folder.color] || colorMap.blue
                            )} />

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Folder Icon */}
                                <div className={cn(
                                    "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br shadow-lg mx-auto",
                                    colorMap[folder.color] || colorMap.blue
                                )}>
                                    <FolderIcon className="w-10 h-10 text-white" />
                                </div>

                                {/* Folder Name */}
                                <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
                                    {folder.name}
                                </h3>

                                {/* Item Count */}
                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span className="text-sm font-medium">
                                        {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                                    </span>
                                </div>

                                {/* Hover Action Buttons - Top Right */}
                                {userCanEdit && (
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button
                                            onClick={(e) => handleOpenEditFolderModal(folder, e)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                                            title="Renombrar Carpeta"
                                        >
                                            <Pencil className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                                        </button>
                                        <button
                                            onClick={(e) => handleOpenDeleteModal(folder, e)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn"
                                            title="Eliminar Carpeta"
                                        >
                                            <Trash2 className="w-4 h-4 text-gray-400 group-hover/btn:text-red-600 transition-colors" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Click Indicator */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-slate-900/10 flex items-center justify-center">
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty State */}
            {folders.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg mb-2">
                        No hay carpetas creadas
                    </p>
                    <p className="text-slate-400 text-sm">
                        Crea tu primera carpeta para organizar el inventario
                    </p>
                </div>
            )}
        </>
    );

    const renderFolderView = () => {
        const getAvailableCount = (item) => item.stock;

        return (
            <>
                {/* Breadcrumbs */}
                {renderBreadcrumbs()}

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {(() => {
                            const FolderIcon = getIconComponent(currentFolder.icon);
                            const colorMap = {
                                blue: 'from-blue-500 to-blue-600',
                                yellow: 'from-yellow-500 to-orange-600',
                                purple: 'from-purple-500 to-indigo-600',
                                green: 'from-green-500 to-emerald-600',
                                red: 'from-red-500 to-rose-600'
                            };

                            return (
                                <div className={cn(
                                    "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl bg-gradient-to-br",
                                    colorMap[currentFolder.color] || 'from-blue-500 to-blue-600'
                                )}>
                                    <FolderIcon className="w-8 h-8 text-white" />
                                </div>
                            );
                        })()}
                        <div>
                            <h1 className="text-4xl font-light text-slate-900 tracking-tight">
                                {currentFolder.name}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {currentItems.length} {currentItems.length === 1 ? 'artículo' : 'artículos'} en esta carpeta
                            </p>
                        </div>
                    </div>

                    {userCanEdit && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddNewItem}
                            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 shadow-2xl shadow-purple-300 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Artículo
                        </motion.button>
                    )}
                </div>

                {/* Item Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((item, index) => {
                        const IconComponent = getIconComponent(item.icon);
                        const available = getAvailableCount(item);
                        const stockPercentage = (available / item.stock) * 100;
                        const isLowStock = item.stock < 3;
                        const isMaintenance = item.status === 'maintenance';

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ y: -4 }}
                                className={cn(
                                    "group bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden",
                                    isMaintenance && "border-orange-300 bg-orange-50/30",
                                    !isMaintenance && isLowStock && "border-red-200",
                                    !isMaintenance && !isLowStock && "border-slate-200"
                                )}
                            >
                                {isMaintenance && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-300 rounded-full text-xs font-medium text-orange-700">
                                        <Wrench className="w-3 h-3" />
                                        Mantención
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-6">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                                        isMaintenance && "bg-orange-100",
                                        !isMaintenance && "bg-gradient-to-br from-purple-100 to-indigo-200"
                                    )}>
                                        <IconComponent className={cn(
                                            "w-7 h-7",
                                            isMaintenance ? "text-orange-600" : "text-indigo-600"
                                        )} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {item.category}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            Stock disponible
                                        </span>
                                        <span className={cn(
                                            "text-sm font-semibold",
                                            isLowStock ? "text-red-600" : "text-slate-900"
                                        )}>
                                            {available} de {item.stock}
                                        </span>
                                    </div>

                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stockPercentage}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                isLowStock
                                                    ? "bg-gradient-to-r from-red-400 to-orange-500"
                                                    : "bg-gradient-to-r from-blue-400 to-indigo-500"
                                            )}
                                        />
                                    </div>

                                    {/* Quick Stock Adjustment */}
                                    {userCanEdit ? (
                                        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 mb-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.stock > 0) {
                                                        updateItem(item.id, { stock: item.stock - 1 });
                                                    }
                                                }}
                                                disabled={item.stock <= 0}
                                                className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <span className="font-semibold text-slate-700 w-12 text-center text-sm">
                                                {item.stock}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateItem(item.id, { stock: item.stock + 1 });
                                                }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center bg-slate-50 rounded-xl p-2 mb-4">
                                            <span className="font-semibold text-slate-700 text-sm">
                                                Stock: {item.stock}
                                            </span>
                                        </div>
                                    )}

                                    {userCanEdit && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(item.id)}
                                                className={cn(
                                                    "flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                                    isMaintenance
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                                        : "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                                                )}
                                            >
                                                {isMaintenance ? 'Activar' : 'Mantención'}
                                            </button>

                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="px-3 py-2 rounded-xl text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleOpenDeleteItemModal(item)}
                                                className="px-3 py-2 rounded-xl text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {currentItems.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg mb-2">
                            No hay artículos en esta carpeta
                        </p>
                        <p className="text-slate-400 text-sm mb-4">
                            Agrega tu primer artículo para comenzar
                        </p>
                        {userCanEdit && (
                            <button
                                onClick={handleAddNewItem}
                                className="px-6 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg transition-all"
                            >
                                + Agregar Artículo
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/30 p-8">
            <div className="max-w-7xl mx-auto">
                {currentFolder ? renderFolderView() : renderRootView()}

                {/* Item Modal */}
                {isItemModalOpen && (
                    <ModalContainer onClose={() => setIsItemModalOpen(false)} maxWidth="max-w-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="font-headline font-extrabold text-eyr-on-surface text-2xl">
                                    {editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}
                                </h2>
                            </div>
                            <button onClick={() => setIsItemModalOpen(false)} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmitItem} className="px-8 pb-4 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Nombre del Artículo *</label>
                                <input
                                    type="text"
                                    required
                                    value={itemFormData.name}
                                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                                    placeholder="Ej: Proyector Epson"
                                    className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Categoría *</label>
                                <input
                                    type="text"
                                    required
                                    value={itemFormData.category}
                                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                                    placeholder="Ej: Tecnología, Audio"
                                    className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Stock Total *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={itemFormData.stock}
                                        onChange={(e) => setItemFormData({ ...itemFormData, stock: e.target.value })}
                                        placeholder="Cantidad"
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Icono</label>
                                    <select
                                        value={itemFormData.icon}
                                        onChange={(e) => setItemFormData({ ...itemFormData, icon: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    >
                                        {Object.keys(ICON_MAP).map(iconName => (
                                            <option key={iconName} value={iconName}>{iconName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Descripción (opcional)</label>
                                <textarea
                                    value={itemFormData.description}
                                    onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                                    placeholder="Breve descripción..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface resize-none"
                                />
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                            <button type="button" onClick={() => setIsItemModalOpen(false)} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                            <button type="submit" form="item-form" onClick={handleSubmitItem} className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                                {editingItem ? 'Guardar Cambios' : 'Crear Artículo'}
                            </button>
                        </div>
                    </ModalContainer>
                )}

                {/* Folder Modal (Create & Edit) */}
                {(isFolderModalOpen || isEditFolderModalOpen) && (
                    <ModalContainer
                        onClose={() => { setIsFolderModalOpen(false); setIsEditFolderModalOpen(false); }}
                        maxWidth="max-w-md"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                                    <FolderPlus className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="font-headline font-extrabold text-eyr-on-surface text-2xl">
                                    {editingFolder ? 'Renombrar Carpeta' : 'Nueva Carpeta'}
                                </h2>
                            </div>
                            <button
                                onClick={() => { setIsFolderModalOpen(false); setIsEditFolderModalOpen(false); }}
                                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} className="px-8 pb-4 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Nombre de la Carpeta *</label>
                                <input
                                    type="text"
                                    required
                                    value={folderFormData.name}
                                    onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                                    placeholder="Ej: Materiales Deportivos"
                                    className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Icono</label>
                                    <select
                                        value={folderFormData.icon}
                                        onChange={(e) => setFolderFormData({ ...folderFormData, icon: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    >
                                        <option value="Package">Package</option>
                                        <option value="Store">Store</option>
                                        <option value="Monitor">Monitor</option>
                                        <option value="Laptop">Laptop</option>
                                        <option value="Volume2">Volume2</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">Color</label>
                                    <select
                                        value={folderFormData.color}
                                        onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    >
                                        <option value="blue">Azul</option>
                                        <option value="yellow">Amarillo</option>
                                        <option value="purple">Morado</option>
                                        <option value="green">Verde</option>
                                        <option value="red">Rojo</option>
                                    </select>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                            <button type="button" onClick={() => { setIsFolderModalOpen(false); setIsEditFolderModalOpen(false); }} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                            <button type="submit" onClick={editingFolder ? handleUpdateFolder : handleCreateFolder} className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                                {editingFolder ? 'Guardar Cambios' : 'Crear Carpeta'}
                            </button>
                        </div>
                    </ModalContainer>
                )}

                {/* Delete Folder Confirmation Modal */}
                {isDeleteFolderModalOpen && folderToDelete && (
                    <ModalContainer onClose={() => setIsDeleteFolderModalOpen(false)} maxWidth="max-w-sm" noGradient>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-red-50 p-4 rounded-full shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-headline font-extrabold text-eyr-on-surface mb-1">
                                        ¿Eliminar carpeta "{folderToDelete.name}"?
                                    </h3>
                                    <p className="text-sm text-eyr-on-variant leading-relaxed">
                                        Si eliminas esta carpeta, todos los artículos en su interior también serán eliminados. Esta acción no se puede deshacer.
                                    </p>
                                    {getItemsByFolder(folderToDelete.id).length > 0 && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 font-medium">
                                                Advertencia: Esta carpeta contiene {getItemsByFolder(folderToDelete.id).length} artículos que también serán eliminados.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                            <button onClick={() => setIsDeleteFolderModalOpen(false)} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                            <button onClick={confirmDeleteFolder} className="bg-red-600 text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:bg-red-700 transition-all">Sí, Eliminar</button>
                        </div>
                    </ModalContainer>
                )}

                {/* Item Delete Confirmation Modal */}
                {isDeleteItemModalOpen && itemToDelete && (
                    <ModalContainer onClose={() => setIsDeleteItemModalOpen(false)} maxWidth="max-w-sm" noGradient>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-red-50 p-4 rounded-full shrink-0">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-headline font-extrabold text-eyr-on-surface mb-1">
                                        ¿Eliminar "{itemToDelete.name || 'este artículo'}"?
                                    </h3>
                                    <p className="text-sm text-eyr-on-variant leading-relaxed">
                                        Este artículo se eliminará permanentemente del inventario. Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                            <button onClick={() => setIsDeleteItemModalOpen(false)} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                            <button onClick={confirmDeleteItem} className="bg-red-600 text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:bg-red-700 transition-all">Eliminar Artículo</button>
                        </div>
                    </ModalContainer>
                )}
            </div>
        </div>
    );
}
