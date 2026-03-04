import React from 'react';
import { cn } from '../lib/utils';
import { MapPin } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIME_SLOTS = [
    '08:00', '08:45', '09:30', '09:45', '10:30', '11:15', '11:30', '12:15', '13:00',
    '13:45', '14:30', '15:15', '16:00' // Approximate blocks
];

export default function ScheduleGrid({ schedule }) {
    // Helper to get block for a specific day and time range
    // simplistic matching: if a block *starts* at this time
    // For a real grid, we might need more complex overlap logic, but this is a school block system.

    // Let's normalize data for easier rendering
    const getBlock = (day, time) => {
        return schedule.find(s => s.day === day && s.startTime === time);
    };

    // School usually has fixed blocks. Let's list the start times of standard blocks.
    const BLOCKS = [
        { start: '08:00', end: '09:30', label: 'Bloque 1' },
        { start: '09:45', end: '11:15', label: 'Bloque 2' },
        { start: '11:30', end: '13:00', label: 'Bloque 3' },
        { start: '13:45', end: '15:15', label: 'Bloque 4' },
        { start: '15:30', end: '17:00', label: 'Bloque 5' },
    ];

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-6">
                            Horario
                        </div>
                        {DAYS.map(day => (
                            <div key={day} className="p-4 text-sm font-bold text-slate-700 text-center py-6">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-slate-50">
                        {BLOCKS.map((block, i) => (
                            <div key={i} className="grid grid-cols-6 group hover:bg-slate-50/30 transition-colors">
                                {/* Time Column */}
                                <div className="p-4 flex flex-col justify-center items-center text-xs text-slate-400 font-medium border-r border-slate-50">
                                    <span>{block.start}</span>
                                    <div className="h-4 w-0.5 bg-slate-200 my-1 rounded-full" />
                                    <span>{block.end}</span>
                                </div>

                                {/* Days Columns */}
                                {DAYS.map(day => {
                                    // Match loose: if block corresponds to this standard block time
                                    // In real app, we check if start time matches or falls within.
                                    const classInfo = getBlock(day, block.start);

                                    return (
                                        <div key={day} className="p-2 border-r border-slate-50/50 min-h-[120px] relative">
                                            {classInfo ? (
                                                <div className={cn(
                                                    "h-full w-full rounded-2xl p-3 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg cursor-default border",
                                                    // Color variations
                                                    {
                                                        'bg-blue-50 border-blue-100 text-blue-900': classInfo.color === 'blue',
                                                        'bg-indigo-50 border-indigo-100 text-indigo-900': classInfo.color === 'indigo',
                                                        'bg-emerald-50 border-emerald-100 text-emerald-900': classInfo.color === 'emerald',
                                                        'bg-violet-50 border-violet-100 text-violet-900': classInfo.color === 'violet',
                                                        'bg-orange-50 border-orange-100 text-orange-900': classInfo.color === 'orange',
                                                        'bg-pink-50 border-pink-100 text-pink-900': classInfo.color === 'pink',
                                                    }[classInfo.color || 'blue']
                                                )}>
                                                    <div>
                                                        <span className={cn(
                                                            "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2",
                                                            {
                                                                'bg-blue-100 text-blue-700': classInfo.color === 'blue',
                                                                'bg-indigo-100 text-indigo-700': classInfo.color === 'indigo',
                                                                'bg-emerald-100 text-emerald-700': classInfo.color === 'emerald',
                                                                'bg-violet-100 text-violet-700': classInfo.color === 'violet',
                                                                'bg-orange-100 text-orange-700': classInfo.color === 'orange',
                                                                'bg-pink-100 text-pink-700': classInfo.color === 'pink',
                                                            }[classInfo.color || 'blue']
                                                        )}>
                                                            {classInfo.subject.substring(0, 12)}{classInfo.subject.length > 12 && '.'}
                                                        </span>
                                                        <p className="text-xs font-semibold leading-tight line-clamp-2">
                                                            {classInfo.grade}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[10px] opacity-80 font-medium">
                                                        <MapPin className="w-3 h-3" />
                                                        {classInfo.room}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full w-full rounded-2xl border border-dashed border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-slate-300 font-medium">Libre</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
