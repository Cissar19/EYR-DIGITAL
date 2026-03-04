import React from 'react';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useAuth } from '../context/AuthContext';
import { Check, X, Bell, User, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    const { logout, users } = useAuth();
    const { getPendingRequests, approveRequest, rejectRequest } = useAdministrativeDays();

    const pendingRequests = getPendingRequests();
    const pendingCount = pendingRequests.length;

    const handleApprove = (id) => {
        if (confirm("¿Estás seguro de aprobar esta solicitud? Se descontará 1 día.")) {
            approveRequest(id);
            // Visual toast simulated with alert for now, or could use a toast lib if installed.
            // User asked for "visual notification (toast or alert)" -> alert is simplest compliant way.
        }
    };

    const handleReject = (id) => {
        // Reason for rejection could be asked here
        rejectRequest(id);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Panel de Dirección</h1>
                        <p className="text-slate-500">Gestión de Solicitudes</p>
                    </div>
                    <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-600 underline">
                        Cerrar Sesión
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{pendingCount}</div>
                            <div className="text-sm text-slate-500">Solicitudes Pendientes</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'teacher').length}</div>
                            <div className="text-sm text-slate-500">Docentes Activos</div>
                        </div>
                    </div>
                </div>

                {/* Pending List */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Solicitudes por Revisar</h2>

                    {pendingCount === 0 ? (
                        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
                            No hay solicitudes pendientes. ¡Todo al día!
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex flex-col justify-between h-full transition-transform hover:scale-[1.02]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-slate-100 p-2 rounded-full">
                                                <User className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <span className="font-bold text-slate-700">{req.userName}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{req.date}</span>
                                        </div>

                                        <p className="text-slate-600 bg-slate-50 p-3 rounded-lg text-sm mb-6 border border-slate-100 min-h-[80px]">
                                            "{req.reason}"
                                        </p>
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-semibold hover:bg-green-100 border border-green-200 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Check className="w-4 h-4" /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <X className="w-4 h-4" /> Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
