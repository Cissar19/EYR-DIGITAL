import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Calendar,
    Clock,
    ChevronRight,
    Projector,
    Laptop,
    Volume2,
    PlugZap,
    Cable,
    Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useEquipment, EQUIPMENT_CATALOG, TIME_BLOCKS, REQUEST_STATUS } from '../context/EquipmentContext';

export default function EquipmentRequestView() {
    const { user } = useAuth();
    const { addRequest, getUserRequests } = useEquipment();

    // Selection state
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedBlock, setSelectedBlock] = useState(null);

    // Get user's requests
    const userRequests = getUserRequests(user?.id || '');

    // Toggle item selection
    const toggleItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Handle request submission
    const handleSubmit = () => {
        if (selectedItems.length === 0 || !selectedBlock) {
            return;
        }

        const getLocalDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const now = new Date();
        const requestDate = selectedDate === 'today'
            ? getLocalDate(now)
            : getLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

        addRequest({
            userId: user?.id,
            userName: user?.name,
            items: selectedItems,
            date: requestDate,
            block: selectedBlock
        });

        // Reset form
        setSelectedItems([]);
        setSelectedBlock(null);
    };

    // Format date
    const formatDate = (dateString) => {
        // Append T12:00:00 to date-only strings to prevent UTC timezone shift
        const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status info
    const getStatusInfo = (statusId) => {
        return Object.values(REQUEST_STATUS).find(s => s.id === statusId);
    };

    // Get equipment info
    const getEquipmentInfo = (equipmentId) => {
        return EQUIPMENT_CATALOG.find(eq => eq.id === equipmentId);
    };

    // Get block info
    const getBlockInfo = (blockId) => {
        return TIME_BLOCKS.find(b => b.id === blockId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/30 p-4 md:p-8 pb-40">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
                        Solicitar Equipos
                    </h1>
                    <p className="text-slate-600 text-lg">
                        Selecciona los recursos que necesitas para tu clase
                    </p>
                </motion.div>

                {/* Equipment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {EQUIPMENT_CATALOG.map((equipment, index) => {
                        const IconComponent = equipment.icon;
                        const isSelected = selectedItems.includes(equipment.id);

                        return (
                            <motion.button
                                key={equipment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleItem(equipment.id)}
                                className={cn(
                                    "relative p-8 rounded-2xl transition-all duration-300",
                                    "flex flex-col items-center justify-center gap-4",
                                    "bg-white shadow-sm hover:shadow-xl",
                                    isSelected
                                        ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100"
                                        : "border border-slate-200/60 hover:border-slate-300"
                                )}
                            >
                                {/* Selection Indicator */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 180 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                            className="absolute top-4 right-4 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md"
                                        >
                                            <Check className="w-4 h-4 text-white stroke-[3]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Icon Container */}
                                <div className={cn(
                                    "w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    isSelected
                                        ? "bg-gradient-to-br from-blue-100 to-indigo-100"
                                        : "bg-slate-50"
                                )}>
                                    <IconComponent className={cn(
                                        "w-12 h-12 transition-colors duration-300",
                                        isSelected ? "text-blue-600" : "text-slate-400"
                                    )} />
                                </div>

                                {/* Info */}
                                <div className="text-center space-y-1">
                                    <h3 className={cn(
                                        "text-lg font-bold transition-colors duration-300",
                                        isSelected ? "text-blue-900" : "text-slate-900"
                                    )}>
                                        {equipment.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-snug">
                                        {equipment.description}
                                    </p>
                                    <p className={cn(
                                        "text-xs font-medium mt-2 transition-colors",
                                        isSelected ? "text-blue-600" : "text-slate-400"
                                    )}>
                                        Stock: {equipment.stock} unidades
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* My Requests Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 md:p-8 shadow-xl border border-slate-100/50"
                >
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        Mis Préstamos
                    </h2>

                    {userRequests.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-semibold text-lg">
                                No has solicitado equipos aún
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                Selecciona equipos arriba para hacer tu primera solicitud
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userRequests.map((request, index) => {
                                const statusInfo = getStatusInfo(request.status);
                                const blockInfo = getBlockInfo(request.block);

                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg mb-2">
                                                    {request.items.length} Equipo{request.items.length > 1 ? 's' : ''}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {request.items.map(itemId => {
                                                        const equipment = getEquipmentInfo(itemId);
                                                        const EquipIcon = equipment?.icon || Projector;
                                                        return (
                                                            <div
                                                                key={itemId}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-slate-700 border border-slate-200"
                                                            >
                                                                <EquipIcon className="w-3.5 h-3.5 text-blue-500" />
                                                                {equipment?.name}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <span
                                                className={cn(
                                                    "px-4 py-1.5 rounded-full text-xs font-bold shadow-sm",
                                                    statusInfo?.color === 'yellow' && "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
                                                    statusInfo?.color === 'green' && "bg-green-100 text-green-700 ring-1 ring-green-200",
                                                    statusInfo?.color === 'red' && "bg-red-100 text-red-700 ring-1 ring-red-200",
                                                    statusInfo?.color === 'blue' && "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                                                )}
                                            >
                                                {statusInfo?.icon} {statusInfo?.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{formatDate(request.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{blockInfo?.label}</span>
                                                <span className="text-slate-400">({blockInfo?.time})</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Glassmorphism Sticky Confirmation Bar */}
            <AnimatePresence>
                {selectedItems.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 z-50"
                        style={{
                            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/50">
                            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
                                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-8">
                                    {/* Summary */}
                                    <div className="flex-shrink-0">
                                        <p className="text-xs text-slate-500 font-medium mb-1">
                                            Equipos seleccionados
                                        </p>
                                        <p className="font-bold text-slate-900 text-xl">
                                            {selectedItems.length} {selectedItems.length === 1 ? 'equipo' : 'equipos'}
                                        </p>
                                    </div>

                                    {/* Date Selector */}
                                    <div className="flex-1 max-w-xs">
                                        <p className="text-xs text-slate-500 font-medium mb-2">¿Para cuándo?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedDate('today')}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all",
                                                    selectedDate === 'today'
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                )}
                                            >
                                                Hoy
                                            </button>
                                            <button
                                                onClick={() => setSelectedDate('tomorrow')}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all",
                                                    selectedDate === 'tomorrow'
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                )}
                                            >
                                                Mañana
                                            </button>
                                        </div>
                                    </div>

                                    {/* Block Selector */}
                                    <div className="flex-1 max-w-md">
                                        <p className="text-xs text-slate-500 font-medium mb-2">¿Qué bloque?</p>
                                        <div className="flex gap-2">
                                            {TIME_BLOCKS.map(block => (
                                                <button
                                                    key={block.id}
                                                    onClick={() => setSelectedBlock(block.id)}
                                                    className={cn(
                                                        "flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                                                        selectedBlock === block.id
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105"
                                                    )}
                                                >
                                                    {block.id}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selectedBlock}
                                        className={cn(
                                            "flex-shrink-0 px-8 py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl w-full md:w-auto",
                                            selectedBlock
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-300 active:scale-95"
                                                : "bg-slate-300 cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        Solicitar Ahora
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
