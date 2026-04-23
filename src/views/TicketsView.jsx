import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, MapPin, FileText, CheckCircle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { useAuth, isManagement } from '../context/AuthContext';
import { useTickets, TICKET_CATEGORIES, PRIORITY_LEVELS, TICKET_STATUS } from '../context/TicketContext';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6'];
const STATUS_COLORS = { 'Abierto': '#3b82f6', 'En Proceso': '#f97316', 'Resuelto': '#22c55e' };
const PRIORITY_COLORS = { 'Baja': '#22c55e', 'Media': '#eab308', 'Alta': '#ef4444' };

export default function TicketsView() {
    const { user } = useAuth();
    const { addTicket, getUserTickets } = useTickets();

    // Form state
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState(PRIORITY_LEVELS.MEDIUM.id);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    // Get user's tickets
    const userTickets = getUserTickets(user?.id || '');
    const showCharts = isManagement(user);
    const allTickets = useTickets().getAllTickets();

    // Chart data
    const categoryData = useMemo(() => {
        const source = showCharts ? allTickets : userTickets;
        return TICKET_CATEGORIES.map(cat => ({
            name: cat.label,
            value: source.filter(t => t.category === cat.id).length,
            icon: cat.icon
        })).filter(d => d.value > 0);
    }, [allTickets, userTickets, showCharts]);

    const statusData = useMemo(() => {
        const source = showCharts ? allTickets : userTickets;
        return Object.values(TICKET_STATUS).map(s => ({
            name: s.label,
            value: source.filter(t => t.status === s.id).length
        })).filter(d => d.value > 0);
    }, [allTickets, userTickets, showCharts]);

    const priorityData = useMemo(() => {
        const source = showCharts ? allTickets : userTickets;
        return Object.values(PRIORITY_LEVELS).map(p => ({
            name: p.label,
            value: source.filter(t => t.priority === p.id).length
        })).filter(d => d.value > 0);
    }, [allTickets, userTickets, showCharts]);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!category || !location || !description) {
            return;
        }

        addTicket({
            userId: user?.id,
            userName: user?.name,
            category,
            priority,
            location,
            description
        });

        // Reset form
        setCategory('');
        setPriority(PRIORITY_LEVELS.MEDIUM.id);
        setLocation('');
        setDescription('');
    };

    // Get category info
    const getCategoryInfo = (categoryId) => {
        return TICKET_CATEGORIES.find(c => c.id === categoryId);
    };

    // Get priority info
    const getPriorityInfo = (priorityId) => {
        return Object.values(PRIORITY_LEVELS).find(p => p.id === priorityId);
    };

    // Get status info
    const getStatusInfo = (statusId) => {
        return Object.values(TICKET_STATUS).find(s => s.id === statusId);
    };

    // Format date
    const formatDate = (dateString) => {
        // Append T12:00:00 to date-only strings to prevent UTC timezone shift
        const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
                        Mesa de Ayuda
                    </h1>
                    <p className="text-slate-600 text-base md:text-lg">
                        Reporta problemas técnicos y realiza seguimiento de tus solicitudes
                    </p>
                </motion.div>

                {/* Charts Section */}
                {(categoryData.length > 0 || statusData.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Distribucion de Tickets {showCharts ? '(Global)' : ''}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {showCharts ? allTickets.length : userTickets.length} tickets en total
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* By Category - Pie */}
                            {categoryData.length > 0 && (
                                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                                    <h3 className="text-base font-bold text-slate-700 mb-4 uppercase tracking-wider">Por Categoria</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {categoryData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => {
                                                const total = categoryData.reduce((s, d) => s + d.value, 0);
                                                const pct = ((value / total) * 100).toFixed(1);
                                                return [`${value} tickets (${pct}%)`, name];
                                            }} />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* By Status - Bar */}
                            {statusData.length > 0 && (
                                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                                    <h3 className="text-base font-bold text-slate-700 mb-4 uppercase tracking-wider">Por Estado</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={statusData} barSize={32}>
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(value) => [`${value} tickets`, '']} />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                {statusData.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* By Priority - Bar */}
                            {priorityData.length > 0 && (
                                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                                    <h3 className="text-base font-bold text-slate-700 mb-4 uppercase tracking-wider">Por Prioridad</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={priorityData} barSize={32}>
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(value) => [`${value} tickets`, '']} />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                {priorityData.map((entry, i) => (
                                                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Panel: Report Form (2/5) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-8 shadow-lg border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Reportar Problema
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Describe el inconveniente técnico
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Categoría del Problema
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                                        {TICKET_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all duration-200",
                                                    "h-auto min-h-[110px]",
                                                    "flex flex-col items-center justify-center gap-2",
                                                    category === cat.id
                                                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="text-2xl">{cat.icon}</div>
                                                <div className="text-center">
                                                    <div className="font-medium text-sm text-slate-900 break-words whitespace-normal">
                                                        {cat.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5 break-words whitespace-normal">
                                                        {cat.description}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Prioridad
                                    </label>
                                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                                        {Object.values(PRIORITY_LEVELS).map((level) => (
                                            <button
                                                key={level.id}
                                                type="button"
                                                onClick={() => setPriority(level.id)}
                                                className={cn(
                                                    "flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200",
                                                    priority === level.id
                                                        ? "bg-white shadow-sm text-slate-900"
                                                        : "text-slate-600 hover:text-slate-900"
                                                )}
                                            >
                                                <span className="mr-1.5">{level.icon}</span>
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ubicación
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Ej: Sala de Computación, Sala 4B"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Descripción del Problema
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe el problema con el mayor detalle posible..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!category || !location || !description}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2",
                                        category && location && description
                                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]"
                                            : "bg-slate-300 cursor-not-allowed"
                                    )}
                                >
                                    <FileText className="w-5 h-5" />
                                    Abrir Ticket de Soporte
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Right Panel: Ticket History (3/5) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3"
                    >
                        <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-8 shadow-lg border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Mis Reportes
                            </h2>

                            {userTickets.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">
                                        No has reportado ningún problema aún
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Usa el formulario para crear un ticket
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userTickets.map((ticket, index) => {
                                        const catInfo = getCategoryInfo(ticket.category);
                                        const priorityInfo = getPriorityInfo(ticket.priority);
                                        const statusInfo = getStatusInfo(ticket.status);

                                        return (
                                            <motion.div
                                                key={ticket.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{catInfo?.icon}</div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">
                                                                {catInfo?.label} - {ticket.location}
                                                            </h3>
                                                            <p className="text-xs text-slate-500">
                                                                {formatDate(ticket.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                                statusInfo?.color === 'blue' && "bg-blue-100 text-blue-700",
                                                                statusInfo?.color === 'orange' && "bg-orange-100 text-orange-700",
                                                                statusInfo?.color === 'green' && "bg-green-100 text-green-700"
                                                            )}
                                                        >
                                                            {statusInfo?.icon} {statusInfo?.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600 mb-3">
                                                    {ticket.description}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">
                                                        Prioridad:
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-xs font-semibold",
                                                        priorityInfo?.color === 'green' && "bg-green-100 text-green-700",
                                                        priorityInfo?.color === 'yellow' && "bg-yellow-100 text-yellow-700",
                                                        priorityInfo?.color === 'red' && "bg-red-100 text-red-700"
                                                    )}>
                                                        {priorityInfo?.icon} {priorityInfo?.label}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
