import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchedule, SCHEDULE_BLOCKS } from '../context/ScheduleContext';
import { useCurrentBlock } from '../hooks/useCurrentBlock';
import { Clock, BookOpen, Coffee, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Build a lookup: startTime -> endTime from SCHEDULE_BLOCKS
const END_TIME_MAP = {};
SCHEDULE_BLOCKS.forEach(b => { END_TIME_MAP[b.start] = b.end; });

export default function NextClassWidget() {
    const { user } = useAuth();
    const { getSchedule } = useSchedule();
    const rawSchedule = getSchedule(user.id);

    // Enrich blocks with endTime derived from SCHEDULE_BLOCKS
    const schedule = useMemo(() =>
        rawSchedule.map(block => ({
            ...block,
            endTime: block.endTime || END_TIME_MAP[block.startTime] || block.startTime,
        })),
        [rawSchedule]
    );

    const { currentBlock, nextBlock, minutesLeft, minutesUntilNext, progress } = useCurrentBlock(schedule);

    if (!schedule.length) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 text-base uppercase tracking-wider">Estado Actual</h3>
                    <Link to="/schedule" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {currentBlock ? (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{currentBlock.subject}</h4>
                                <p className="text-xs text-slate-500">{currentBlock.course}</p>
                            </div>
                        </div>

                        <div className="bg-slate-100 rounded-full h-2 w-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-right text-xs font-bold text-blue-600 mt-1.5">
                            Quedan {minutesLeft} min
                        </p>
                    </div>
                ) : nextBlock ? (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Próxima: {nextBlock.subject}</h4>
                                <p className="text-xs text-slate-500">en {minutesUntilNext} min • {nextBlock.course}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 py-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Tiempo Libre</h4>
                            <p className="text-xs text-slate-500">No hay más clases hoy. ¡Descansa!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        </div>
    );
}
