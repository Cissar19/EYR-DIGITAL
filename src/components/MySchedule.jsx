import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_SCHEDULES, DAYS_ORDER, BLOCKS } from '../data/scheduleData';
import { cn } from '../lib/utils';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MySchedule() {
    const { user } = useAuth();
    const schedule = MOCK_SCHEDULES[user.id] || [];

    // Mobile: Active day state
    const currentDayIndex = new Date().getDay() - 1; // 0=Mon, 4=Fri
    const initialDay = (currentDayIndex >= 0 && currentDayIndex <= 4) ? DAYS_ORDER[currentDayIndex] : 'Lunes';
    const [activeDay, setActiveDay] = useState(initialDay);

    const getBlockData = (day, startTime) => {
        return schedule.find(s => s.day === day && s.startTime === startTime);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-blue-600" />
                        Mi Horario
                    </h1>
                    <p className="text-slate-500">Visualiza tus clases semanales</p>
                </div>
            </div>

            {/* Desktop Layout (Table) */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                    <div className="p-4 font-semibold text-slate-500 text-sm">Horario</div>
                    {DAYS_ORDER.map(day => (
                        <div key={day} className="p-4 font-bold text-slate-700 text-center border-l border-slate-100">
                            {day}
                        </div>
                    ))}
                </div>

                {BLOCKS.map(time => (
                    <div key={time} className="grid grid-cols-6 border-b border-slate-100 last:border-0">
                        <div className="p-4 text-sm font-medium text-slate-500 flex items-center justify-center bg-slate-50/50">
                            {time}
                        </div>
                        {DAYS_ORDER.map(day => {
                            const classData = getBlockData(day, time);
                            return (
                                <div key={`${day}-${time}`} className="border-l border-slate-100 relative min-h-[100px] p-2">
                                    {classData ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 h-full flex flex-col justify-center text-center hover:shadow-md transition-shadow">
                                            <div className="font-bold text-slate-800 text-sm">{classData.subject}</div>
                                            <div className="text-xs text-blue-600 font-semibold mt-1">{classData.grade}</div>
                                            <div className="text-xs text-slate-500 mt-1">{classData.room}</div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-slate-200 text-xs">Libre</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Mobile Layout (Tabs/Cards) */}
            <div className="md:hidden">
                {/* Day Tabs */}
                <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-4">
                    {DAYS_ORDER.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={cn(
                                "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                                activeDay === day
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200"
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Schedule List for Active Day */}
                <div className="space-y-4">
                    <div className="text-lg font-bold text-slate-700 mb-2">{activeDay}</div>
                    {BLOCKS.map(time => {
                        const classData = getBlockData(activeDay, time);
                        if (!classData) return null; // Only show actual classes on mobile to save space
                        return (
                            <div key={time} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 mb-1">{classData.startTime} - {classData.endTime}</div>
                                    <h3 className="font-bold text-slate-800 text-lg">{classData.subject}</h3>
                                    <div className="text-sm text-slate-600">{classData.grade}</div>
                                </div>
                                <div className="bg-slate-100 px-3 py-1 rounded text-xs font-bold text-slate-600">
                                    {classData.room}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty state for the day */}
                    {BLOCKS.every(time => !getBlockData(activeDay, time)) && (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-400">No tienes clases este día.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
