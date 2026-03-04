import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Clock, MapPin, Layers } from 'lucide-react';
import { useCurrentBlock } from '../hooks/useCurrentBlock';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function ScheduleTimeline({ schedule }) {
    const currentDayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
    const initialDay = DAYS.includes(currentDayName) ? currentDayName : 'Lunes';
    const [selectedDay, setSelectedDay] = useState(initialDay);

    const { currentBlock } = useCurrentBlock(schedule);

    // Filter for selected day
    const daySchedule = schedule.filter(b => b.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Helper to determine card state
    const getCardState = (block) => {
        // If we are looking at a different day than today, just show future style
        if (selectedDay !== currentDayName) return 'future';

        // If it's today, check against current time
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [endHour, endMin] = block.endTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMin;

        if (currentBlock && currentBlock.startTime === block.startTime) return 'current';
        if (currentMinutes > endMinutes) return 'past';
        return 'future';
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Floating Day Pills */}
            <div className="flex overflow-x-auto gap-3 py-4 mb-6 no-scrollbar sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm -mx-6 px-6">
                {DAYS.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform",
                            selectedDay === day
                                ? "bg-slate-900 text-white scan-line-shadow scale-105"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Timeline Feed */}
            <div className="space-y-6 relative ml-4 px-4 pb-20">
                {/* Continuous Line */}
                <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-slate-200" />

                {daySchedule.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
                        No hay clases programadas para este día.
                    </div>
                ) : (
                    daySchedule.map((block, index) => {
                        const state = getCardState(block);
                        const isCurrent = state === 'current';
                        const isPast = state === 'past';

                        // Color Mapping
                        const colorClass = {
                            blue: 'border-blue-500 ring-blue-100 text-blue-600',
                            indigo: 'border-indigo-500 ring-indigo-100 text-indigo-600',
                            violet: 'border-violet-500 ring-violet-100 text-violet-600',
                            emerald: 'border-emerald-500 ring-emerald-100 text-emerald-600',
                        }[block.color || 'blue'];

                        const badgeColor = {
                            blue: 'bg-blue-100 text-blue-700',
                            indigo: 'bg-indigo-100 text-indigo-700',
                            violet: 'bg-violet-100 text-violet-700',
                            emerald: 'bg-emerald-100 text-emerald-700',
                        }[block.color || 'blue'];

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "relative pl-6 transition-all duration-500 ease-out",
                                    isPast && "opacity-50 grayscale",
                                    isCurrent && "scale-105 z-10"
                                )}
                            >
                                {/* Timeline Node */}
                                <div className={cn(
                                    "absolute -left-[5px] top-6 w-3 h-3 rounded-full border-2 bg-white transition-colors duration-300",
                                    isCurrent ? "border-blue-500 bg-blue-500 ring-4 ring-blue-100 animate-pulse" : "border-slate-300"
                                )} />

                                {/* Card */}
                                <div className={cn(
                                    "bg-white rounded-2xl p-5 border transition-all duration-300",
                                    isCurrent
                                        ? `shadow-xl border-l-4 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1].replace('text', 'ring')} ring-2`
                                        : "shadow-sm border-slate-100 hover:shadow-md border-l-4 border-l-transparent"
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-sm font-semibold tracking-tight text-slate-500">
                                            {block.startTime} - {block.endTime}
                                        </span>
                                        {isCurrent && (
                                            <span className="animate-pulse inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 uppercase tracking-wide">
                                                ● En Curso
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{block.subject}</h3>

                                    <div className="flex items-center gap-4 text-sm mt-3">
                                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium", badgeColor)}>
                                            <Layers className="w-4 h-4" />
                                            {block.grade}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                            <MapPin className="w-4 h-4" />
                                            {block.room}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
