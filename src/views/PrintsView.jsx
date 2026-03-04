import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrint } from '../context/PrintContext';
import { Upload, Printer, FileText, CheckCircle, Clock, Package, XCircle, CheckCheck, Users, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

// iOS-style Switch Component
const Switch = ({ checked, onChange, label }) => {
    return (
        <label className="flex items-center justify-between cursor-pointer group py-3">
            <span className="text-[15px] font-medium text-slate-800 select-none">
                {label}
            </span>
            <div
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out",
                    checked ? "bg-blue-500" : "bg-slate-300"
                )}
            >
                <span
                    className={cn(
                        "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out",
                        checked ? "translate-x-7" : "translate-x-1"
                    )}
                />
            </div>
        </label>
    );
};

// Teacher View Component
const TeacherView = () => {
    const { user } = useAuth();
    const { addRequest, getRequestsByUser } = usePrint();

    const [fileName, setFileName] = useState('');
    const [copies, setCopies] = useState(1);
    const [doubleSided, setDoubleSided] = useState(false);
    const [isColor, setIsColor] = useState(false);
    const [stapled, setStapled] = useState(false);
    const [legalSize, setLegalSize] = useState(false);

    const userRequests = getRequestsByUser(user.id);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!fileName) {
            return;
        }

        addRequest({
            userId: user.id,
            userName: user.name,
            fileName,
            copies,
            doubleSided,
            isColor,
            stapled,
            legalSize
        });

        // Reset form
        setFileName('');
        setCopies(1);
        setDoubleSided(false);
        setIsColor(false);
        setStapled(false);
        setLegalSize(false);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return {
                    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    icon: CheckCircle,
                    label: 'Listo'
                };
            case 'rejected':
                return {
                    color: 'bg-red-50 text-red-700 border border-red-200',
                    icon: XCircle,
                    label: 'Rechazado'
                };
            case 'reviewing':
                return {
                    color: 'bg-purple-50 text-purple-700 border border-purple-200',
                    icon: Eye,
                    label: 'En Revisión'
                };
            case 'processing':
                return {
                    color: 'bg-blue-50 text-blue-700 border border-blue-200',
                    icon: Package,
                    label: 'En Proceso'
                };
            default:
                return {
                    color: 'bg-amber-50 text-amber-700 border border-amber-200',
                    icon: Clock,
                    label: 'Pendiente'
                };
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left Column: New Request (2/5) */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100/50 p-5 md:p-8">
                    <h3 className="text-[22px] font-semibold text-slate-900 mb-6">
                        Nueva Solicitud
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div className="relative">
                            <label
                                htmlFor="file-upload"
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-[16px] cursor-pointer transition-all duration-200",
                                    fileName
                                        ? "border-blue-300 bg-blue-50/50"
                                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300"
                                )}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {fileName ? (
                                        <>
                                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                                                <FileText className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <p className="text-[15px] font-semibold text-blue-700 truncate max-w-full px-4 mb-1">
                                                {fileName}
                                            </p>
                                            <p className="text-[13px] text-blue-500">
                                                Toca para cambiar
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <Upload className="w-7 h-7 text-slate-400" />
                                            </div>
                                            <p className="text-[15px] font-medium text-slate-700 mb-1">
                                                Seleccionar archivo
                                            </p>
                                            <p className="text-[13px] text-slate-400">
                                                PDF, Word, PowerPoint
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />
                            </label>
                        </div>

                        {/* Copies */}
                        <div className="space-y-2">
                            <label className="text-[15px] font-medium text-slate-700">
                                Cantidad de Copias
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={copies}
                                onChange={(e) => setCopies(parseInt(e.target.value))}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-[17px] rounded-[12px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3.5 transition-all outline-none font-medium"
                            />
                        </div>

                        {/* Options - iOS Switches */}
                        <div className="space-y-1 pt-2">
                            <label className="text-[15px] font-medium text-slate-700 mb-3 block">
                                Opciones de Impresión
                            </label>

                            <div className="bg-slate-50/50 rounded-[12px] divide-y divide-slate-100 border border-slate-100">
                                <div className="px-4">
                                    <Switch
                                        checked={doubleSided}
                                        onChange={setDoubleSided}
                                        label="Doble Cara"
                                    />
                                </div>

                                <div className="px-4">
                                    <Switch
                                        checked={isColor}
                                        onChange={setIsColor}
                                        label="Impresión a Color"
                                    />
                                </div>

                                <div className="px-4">
                                    <Switch
                                        checked={stapled}
                                        onChange={setStapled}
                                        label="Corcheteado"
                                    />
                                </div>

                                <div className="px-4">
                                    <Switch
                                        checked={legalSize}
                                        onChange={setLegalSize}
                                        label="Tamaño Oficio"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!fileName}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 px-5 py-4 rounded-[12px] font-semibold text-[17px] transition-all duration-200 mt-6",
                                fileName
                                    ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-sm"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Printer className="w-5 h-5" />
                            Enviar a Imprenta
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Column: Request History (3/5) */}
            <div className="lg:col-span-3 space-y-5">
                <h3 className="text-[22px] font-semibold text-slate-900">
                    Mis Solicitudes
                </h3>

                {userRequests.length === 0 ? (
                    <div className="bg-white p-16 rounded-[20px] border border-slate-100/50 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <Printer className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-[17px] mb-1">
                            No hay solicitudes
                        </p>
                        <p className="text-slate-400 text-[15px]">
                            Tus pedidos aparecerán aquí
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {userRequests.map((request) => {
                            const status = getStatusBadge(request.status);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={request.id}
                                    className="bg-white rounded-[16px] p-5 border border-slate-100/50 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="bg-slate-50 p-2.5 rounded-[10px] shrink-0">
                                                <FileText className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 text-[17px] truncate mb-1">
                                                    {request.fileName}
                                                </h4>
                                                <p className="text-[15px] text-slate-500">
                                                    {request.copies} {request.copies === 1 ? 'copia' : 'copias'}
                                                    {request.doubleSided && ' • Doble cara'}
                                                    {request.isColor && ' • Color'}
                                                    {request.stapled && ' • Corcheteado'}
                                                    {request.legalSize && ' • Oficio'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold shrink-0",
                                            status.color
                                        )}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="text-[13px] text-slate-400 font-medium">
                                        {new Date(request.createdAt).toLocaleDateString('es-CL', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Printer Management View Component
const PrinterView = () => {
    const { getAllRequests, updateRequestStatus } = usePrint();
    const [filter, setFilter] = useState('pending');

    const allRequests = getAllRequests();

    const filteredRequests = allRequests.filter(req => {
        if (filter === 'pending') return req.status === 'pending' || req.status === 'reviewing';
        if (filter === 'completed') return req.status === 'completed';
        if (filter === 'rejected') return req.status === 'rejected';
        return true;
    });

    const handleReview = (requestId) => {
        updateRequestStatus(requestId, 'reviewing');
    };

    const handleApprove = (requestId) => {
        updateRequestStatus(requestId, 'completed');
    };

    const handleReject = (requestId) => {
        updateRequestStatus(requestId, 'rejected');
    };

    const handlePreview = (request) => {
        toast.info(`📥 Descargando archivo: ${request.fileName}...`);
        // Simulate opening PDF in new tab
        setTimeout(() => {
            window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
        }, 500);
    };

    const getFilterButtonClass = (filterType) => {
        return cn(
            "px-4 py-2 rounded-[10px] text-[15px] font-semibold transition-all duration-200",
            filter === filterType
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-[28px] font-bold text-slate-900 flex items-center gap-3">
                        <Users className="w-7 h-7 md:w-8 md:h-8 text-blue-500" />
                        Cola de Impresión General
                    </h2>
                    <p className="text-[15px] text-slate-500 mt-1">
                        Gestiona las solicitudes de todos los docentes
                    </p>
                </div>
                <div className="bg-white rounded-[16px] px-6 py-4 border border-slate-100 shadow-sm">
                    <div className="text-[13px] text-slate-500 font-medium">Total Pendientes</div>
                    <div className="text-[28px] font-bold text-blue-600">
                        {allRequests.filter(r => r.status === 'pending' || r.status === 'reviewing').length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setFilter('pending')}
                    className={getFilterButtonClass('pending')}
                >
                    Pendientes
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={getFilterButtonClass('completed')}
                >
                    Completadas
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    className={getFilterButtonClass('rejected')}
                >
                    Rechazadas
                </button>
            </div>

            {/* Request List */}
            {filteredRequests.length === 0 ? (
                <div className="bg-white p-16 rounded-[20px] border border-slate-100/50 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Printer className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium text-[17px] mb-1">
                        No hay solicitudes {filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completadas' : 'rechazadas'}
                    </p>
                    <p className="text-slate-400 text-[15px]">
                        Las solicitudes aparecerán aquí
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white rounded-[16px] p-6 border border-slate-100/50 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="bg-blue-50 p-3 rounded-[12px] shrink-0">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 truncate">
                                                {request.fileName}
                                            </h4>
                                            <button
                                                onClick={() => handlePreview(request)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-all group/preview"
                                                title="Ver archivo"
                                            >
                                                <Eye className="w-3.5 h-3.5 group-hover/preview:scale-110 transition-transform" />
                                                <span className="hidden sm:inline">Ver</span>
                                            </button>
                                            {request.isColor && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                                    COLOR
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[15px] text-slate-600 font-medium mb-2">
                                            👤 {request.userName}
                                        </p>

                                        <div className="flex flex-wrap gap-2 text-[13px] text-slate-500">
                                            <span className="bg-slate-50 px-2 py-1 rounded-[6px] font-medium">
                                                📋 {request.copies} {request.copies === 1 ? 'copia' : 'copias'}
                                            </span>
                                            {request.doubleSided && (
                                                <span className="bg-slate-50 px-2 py-1 rounded-[6px] font-medium">
                                                    ↔️ Doble cara
                                                </span>
                                            )}
                                            {request.stapled && (
                                                <span className="bg-slate-50 px-2 py-1 rounded-[6px] font-medium">
                                                    📎 Corcheteado
                                                </span>
                                            )}
                                            {request.legalSize && (
                                                <span className="bg-slate-50 px-2 py-1 rounded-[6px] font-medium">
                                                    📄 Oficio
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[13px] text-slate-400 font-medium mt-3">
                                            {new Date(request.createdAt).toLocaleDateString('es-CL', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {request.status === 'pending' && (
                                    <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                                        <button
                                            onClick={() => handleReview(request.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-[10px] font-semibold text-[15px] hover:bg-purple-600 active:scale-95 transition-all shadow-sm w-full md:w-auto"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Revisar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-[10px] font-semibold text-[15px] hover:bg-emerald-600 active:scale-95 transition-all shadow-sm w-full md:w-auto"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Listo
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-[10px] font-semibold text-[15px] hover:bg-red-600 active:scale-95 transition-all shadow-sm w-full md:w-auto"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                )}

                                {request.status === 'reviewing' && (
                                    <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-[10px] font-semibold text-[15px] hover:bg-emerald-600 active:scale-95 transition-all shadow-sm w-full md:w-auto"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Listo
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-[10px] font-semibold text-[15px] hover:bg-red-600 active:scale-95 transition-all shadow-sm w-full md:w-auto"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Rechazar
                                        </button>
                                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 w-full md:w-auto justify-center">
                                            <Eye className="w-4 h-4" />
                                            En Revisión
                                        </div>
                                    </div>
                                )}

                                {request.status === 'completed' && (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-4 h-4" />
                                        Completado
                                    </div>
                                )}

                                {request.status === 'rejected' && (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                        <XCircle className="w-4 h-4" />
                                        Rechazado
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main Component with Role-Based Rendering
export default function PrintsView() {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-[34px] font-bold text-slate-900 tracking-tight leading-tight mb-2">
                    Centro de Copiado
                </h1>
                <p className="text-[17px] text-slate-500">
                    {user.role === 'printer'
                        ? 'Panel de gestión para el encargado de impresiones'
                        : 'Envía tus documentos sin hacer fila'}
                </p>
            </div>

            {/* Conditional Rendering Based on Role */}
            {user.role === 'printer' ? <PrinterView /> : <TeacherView />}
        </div>
    );
}
