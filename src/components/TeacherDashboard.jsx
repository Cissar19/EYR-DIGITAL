import React, { useState } from 'react';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, ChevronRight, Hourglass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const { addRequest, getUserRequests, getBalance } = useAdministrativeDays();
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('Personal'); // Default select value
    const [message, setMessage] = useState('');

    const requests = getUserRequests(user.id);
    const balance = getBalance(user.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date) {
            setMessage({ text: 'Por favor selecciona una fecha.', type: 'error' });
            return;
        }

        if (balance <= 0) {
            setMessage({ text: 'No tienes días suficientes.', type: 'error' });
            return;
        }

        try {
            await addRequest(user.id, user.name, date, reason);
            setMessage({ text: 'Solicitud enviada exitosamente.', type: 'success' });
            setDate('');
            setReason('Personal');
        } catch (error) {
            console.error(error);
            setMessage({ text: error.message || 'Error al enviar solicitud.', type: 'error' });
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Aprobado' };
            case 'rejected': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rechazado' };
            default: return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Hourglass, label: 'Pendiente' };
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Días Administrativos</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus permisos y revisa tu historial.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Hero Card + Form */}
                <div className="lg:col-span-1 space-y-8">

                    {/* Hero Card: Available Days */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 group hover:scale-[1.02] transition-transform duration-300">
                        {/* Decorative Background Icon */}
                        <Calendar className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 rotate-12 group-hover:rotate-6 transition-transform duration-500" />

                        <div className="relative z-10">
                            <p className="text-indigo-100 font-medium text-sm uppercase tracking-wider mb-2">Días Disponibles</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-8xl font-extrabold tracking-tighter drop-shadow-sm">
                                    {balance}
                                </span>
                                <span className="text-2xl font-medium opacity-80">/ 6</span>
                            </div>
                            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                                <Clock className="w-4 h-4" /> Vencen el 31 Dic
                            </div>
                        </div>
                    </div>

                    {/* New Request Form */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-500" /> Nueva Solicitud
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Fecha del Permiso</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-shadow outline-none"
                                />
                            </div>
                            {/* ... (Reason Select - assumed identical to previous, keeping context concise) ... */}
                            {/* NOTE: Preserving original rendering logic for select as it wasn't shown in diff block context but is needed. I will check replaced content carefully. */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Motivo</label>
                                <div className="relative">
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 appearance-none outline-none"
                                    >
                                        <option value="Personal">Asuntos Personales</option>
                                        <option value="Médico">Consulta Médica</option>
                                        <option value="Trámite">Trámite Bancario/Legal</option>
                                        <option value="Familiar">Emergencia Familiar</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:ring-4 focus:ring-indigo-300 font-semibold rounded-xl text-sm px-5 py-3.5 text-center shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Solicitar Día <ChevronRight className="w-4 h-4" />
                            </button>
                        </form>

                        {message && (
                            <div className={cn(
                                "mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                                message.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                            )}>
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Timeline History */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 px-1">Historial de Solicitudes</h3>

                    <div className="relative pl-4">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                        <div className="space-y-6">
                            {requests.length === 0 ? (
                                <div className="ml-8 bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No has realizado solicitudes aún.</p>
                                </div>
                            ) : (
                                requests.map((req) => {
                                    const status = getStatusBadge(req.status);
                                    const StatusIcon = status.icon;

                                    return (
                                        <div key={req.id} className="relative pl-12 group">
                                            {/* Timeline Dot */}
                                            <div className={cn(
                                                "absolute left-[1.15rem] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-colors",
                                                status.color.replace('text', 'bg').split(' ')[0]
                                            )} />

                                            {/* Card */}
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group-hover:border-slate-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-lg">
                                                                {new Date(req.date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-slate-500 capitalize">{req.reason}</p>
                                                                {req.isHalfDay && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                                        ½ {req.isHalfDay === 'am' ? 'Mañana' : req.isHalfDay === 'pm' ? 'Tarde' : 'Día Admin.'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                                                        status.color
                                                    )}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.label}
                                                    </div>
                                                </div>

                                                {/* Optional: Add more details or actions here later */}
                                                <div className="text-xs text-slate-400 font-medium pl-1">
                                                    Solicitado el: {new Date().toLocaleDateString('es-CL')} {/* Mock date for created_at */}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
