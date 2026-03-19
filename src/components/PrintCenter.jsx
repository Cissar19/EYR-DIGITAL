
import React, { useState } from 'react';
import { usePrint } from '../context/PrintContext';
import { useData } from '../context/DataContext';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Printer, FileText, CheckCircle, Clock, AlertTriangle, Search, Trash2, Award, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function PrintCenter() {
    const { user } = useAuth();
    const { users } = useData();
    const { requests, addRequest, updateRequestStatus, deleteRequest } = usePrint();
    const isAdmin = canEditHelper(user);

    // Filter requests based on role
    const myRequests = requests.filter(r => r.userId === user.id);
    const viewRequests = isAdmin ? requests : myRequests;

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                    <Printer className="w-8 h-8 text-indigo-600" />
                    Centro de Impresión
                </h1>
                <p className="text-slate-500 mt-1">Gestión de copias, solicitudes y contabilidad.</p>
            </div>

            {/* Consumption Widget (Teacher & Admin) */}
            <ConsumptionWidget user={user} />

            {isAdmin ? (
                <div className="space-y-8">
                    {/* Admin Accounting Table */}
                    <AdminAccountingTable users={users} requests={requests} />

                    {/* Admin Request Manager */}
                    <AdminRequestManager requests={requests} updateStatus={updateRequestStatus} deleteReq={deleteRequest} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Teacher Request Form */}
                    <div className="lg:col-span-1">
                        <PrintRequestForm user={user} onSubmit={addRequest} />
                    </div>

                    {/* Teacher History */}
                    <div className="lg:col-span-2">
                        <TeacherHistory requests={myRequests} />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB COMPONENTS ---

function ConsumptionWidget({ user }) {
    const count = user?.printCount || 0;
    const isHighUsage = count > 5000;

    return (
        <div className={cn(
            "p-6 rounded-2xl border flex items-center justify-between shadow-sm relative overflow-hidden",
            isHighUsage ? "bg-red-50 border-red-100" : "bg-white border-indigo-100"
        )}>
            <div className="relative z-10">
                <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-1">Tu Consumo Anual</h3>
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-4xl font-black", isHighUsage ? "text-red-600" : "text-indigo-600")}>
                        {count.toLocaleString()}
                    </span>
                    <span className="text-slate-400 font-medium">copias</span>
                </div>
                {isHighUsage && (
                    <div className="flex items-center gap-1 text-red-500 text-xs font-bold mt-2 bg-red-100/50 px-2 py-1 rounded-full w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Has superado el límite sugerido</span>
                    </div>
                )}
            </div>
            {/* Decoration */}
            <Printer className={cn(
                "w-32 h-32 absolute -right-6 -bottom-6 opacity-10 transform rotate-12",
                isHighUsage ? "text-red-500" : "text-indigo-500"
            )} />
        </div>
    );
}

function PrintRequestForm({ user, onSubmit }) {
    const [formData, setFormData] = useState({
        fileName: '', // In real app, this would be file obj
        copies: 1,
        pages: 1,
        doubleSided: false
    });

    const totalPrints = formData.copies * formData.pages;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, user);
        setFormData({ fileName: '', copies: 1, pages: 1, doubleSided: false }); // Reset
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Nueva Solicitud
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mock File Upload */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documento</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group relative">
                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">
                            {formData.fileName ? formData.fileName : "Arrastra tu archivo PDF aquí"}
                        </span>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFormData({ ...formData, fileName: e.target.files[0]?.name || "Documento.pdf" })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Copias</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.copies}
                            onChange={(e) => setFormData({ ...formData, copies: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-center"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Páginas por Doc</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.pages}
                            onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-center"
                        />
                    </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <input
                        type="checkbox"
                        id="doubleSided"
                        checked={formData.doubleSided}
                        onChange={(e) => setFormData({ ...formData, doubleSided: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="doubleSided" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Impresión Doble Faz</label>
                </div>

                {/* Live Calc */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-600 mb-1 font-medium">Resumen del Pedido:</p>
                    <p className="text-sm text-indigo-800">
                        {formData.copies} copias x {formData.pages} págs = <strong className="text-indigo-900 text-lg">{totalPrints} impresiones</strong>
                    </p>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                    Enviar Solicitud
                </button>
            </form>
        </div>
    );
}

function TeacherHistory({ requests }) {
    if (requests.length === 0) {
        return (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-600 font-medium text-lg">Sin solicitudes recientes</h3>
                <p className="text-slate-400 mt-2">Tus solicitudes de impresión aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Historial de Solicitudes</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {requests.map(req => (
                    <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                req.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                            )}>
                                {req.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">{req.fileName}</h4>
                                <p className="text-xs text-slate-500">
                                    {new Date(req.date).toLocaleDateString()} • {req.copies} copias ({req.pages} págs) • <strong>{req.copies * req.pages} Total</strong>
                                </p>
                            </div>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                            req.status === 'completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        )}>
                            {req.status === 'completed' ? 'Impreso' : 'Pendiente'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AdminAccountingTable({ users, requests }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter by Search Term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users by consumption (Descending)
    const sortedUsers = [...filteredUsers].sort((a, b) => (b.printCount || 0) - (a.printCount || 0));

    // Pagination
    const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Award className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Contabilidad de Copias</h3>
                        <p className="text-xs text-slate-500">Consumo acumulado por docente</p>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar docente..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on search
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Docente / Personal</th>
                            <th className="px-6 py-3 text-center">Rol</th>
                            <th className="px-6 py-3 text-right">Impresiones Totales</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    No se encontraron docentes con ese nombre.
                                </td>
                            </tr>
                        )}
                        {paginatedUsers.map(u => {
                            const count = u.printCount || 0;
                            const isHigh = count > 5000;
                            return (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                                    <td className="px-6 py-4 text-center text-slate-500 capitalize">{u.role}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn("font-mono text-base", isHigh ? "text-red-600 font-bold" : "text-slate-700")}>
                                            {count.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isHigh ? (
                                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-200">Alto Consumo</span>
                                        ) : (
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold border border-emerald-100">Normal</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, sortedUsers.length)} de {sortedUsers.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-medium text-slate-600 px-2">
                            {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminRequestManager({ requests, updateStatus, deleteReq }) {
    // State: Current Date (Default: Today)
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    // State: Pagination (Page 1)
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Date Navigation
    const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const handlePrevDay = () => {
        const date = new Date(currentDate + 'T12:00:00');
        date.setDate(date.getDate() - 1);
        setCurrentDate(toLocalDateStr(date));
        setCurrentPage(1);
    };

    const handleNextDay = () => {
        const date = new Date(currentDate + 'T12:00:00');
        date.setDate(date.getDate() + 1);
        setCurrentDate(toLocalDateStr(date));
        setCurrentPage(1);
    };

    // Filter Logic
    const filteredRequests = requests.filter(req => {
        // Compare YYYY-MM-DD
        return req.date.startsWith(currentDate);
    });

    // Pagination Logic
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    // Sort by Date Descending within the day
    const paginatedRequests = filteredRequests
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const pending = paginatedRequests.filter(r => r.status === 'pending');
    const completed = paginatedRequests.filter(r => r.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Toolbar: Date & Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevDay}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => {
                                setCurrentDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <button
                        onClick={handleNextDay}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                        Total Solicitudes del Día: {totalItems}
                    </span>
                    {totalItems > 0 && (
                        <span className="text-xs text-slate-400 font-medium">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900">Pendientes (Vista Parcial)</h3>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {pending.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No hay pendientes en esta página.</p>}
                        {pending.map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{req.fileName}</h4>
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {req.userName}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-sm text-slate-500 mb-4">
                                    <span>{req.copies} copias</span>
                                    <span>{req.pages} págs</span>
                                    <span>{req.doubleSided ? 'Doble Faz' : 'Simple Faz'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-slate-900">{req.copies * req.pages} copias</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => deleteReq(req.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Rechazar/Borrar"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => updateStatus(req.id, 'completed')}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            Imprimir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Completed Column */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-emerald-900">Finalizados (Vista Parcial)</h3>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{completed.length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {completed.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No hay finalizados en esta página.</p>}
                        {completed.map(req => (
                            <div key={req.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-700">{req.fileName}</p>
                                        <p className="text-xs text-slate-500">Solicitado por {req.userName}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-600">{req.copies * req.pages} prints</span>
                                        <span className="text-[10px] text-slate-400">Total descontado</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-sm font-medium text-slate-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}
