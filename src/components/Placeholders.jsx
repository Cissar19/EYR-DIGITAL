import React from 'react';

export function Overview() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Resumen General</h1>
            <p className="text-slate-500">Bienvenido al panel de control de Escuela Demo.</p>
        </div>
    );
}

export function LabReserve() {
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Módulo de Reservas de Laboratorio</h1>
            <p className="text-slate-500 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full border border-yellow-200 inline-block">
                En construcción
            </p>
        </div>
    );
}

export function Tickets() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Tickets / Soporte</h1>
            <p className="text-slate-500">Sistema de reporte de incidencias próximamente.</p>
        </div>
    );
}

export function Settings() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Configuración</h1>
            <p className="text-slate-500">Ajustes del sistema.</p>
        </div>
    );
}
