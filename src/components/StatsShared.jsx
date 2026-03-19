import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================
// SHARED CHART COLORS
// ============================================

export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];
export const PIE_COLORS_BALANCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
export const PIE_COLORS_STATUS = ['#3b82f6', '#f59e0b', '#10b981'];
export const GLOBAL_SOURCE_COLORS = ['#6366f1', '#f43f5e', '#f59e0b'];

// ============================================
// SHARED UI COMPONENTS
// ============================================

export const KpiCard = ({ icon: Icon, label, value, sublabel, color = 'indigo' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60"
    >
        <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2.5 rounded-xl", `bg-${color}-50 text-${color}-600`)}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
            {sublabel && <span className="text-sm text-slate-400 font-medium">{sublabel}</span>}
        </div>
    </motion.div>
);

export const ChartCard = ({ title, description, children, className, onExpand }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/60", onExpand && "group", className)}
    >
        <div className="flex items-start justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-700">{title}</h4>
            {onExpand && (
                <button
                    onClick={(e) => { e.stopPropagation(); onExpand(); }}
                    className="p-1.5 -mt-1 -mr-1 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Expandir grafico"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            )}
        </div>
        {description && <p className="text-xs text-slate-400 mb-4 leading-relaxed">{description}</p>}
        {!description && <div className="mb-3" />}
        {children}
    </motion.div>
);

export const InsightCard = ({ icon: Icon, color, title, value, active, onClick }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClick}
        className={cn(
            "flex items-start gap-3 p-4 rounded-xl border transition-all",
            `bg-${color}-50 border-${color}-100`,
            onClick && "cursor-pointer hover:shadow-md",
            active && "ring-2 ring-offset-1 ring-indigo-400 shadow-md"
        )}
    >
        <div className={cn("p-2 rounded-lg shrink-0", `bg-${color}-100 text-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className={cn("text-sm font-semibold mt-0.5", `text-${color}-700`)}>{value}</p>
        </div>
    </motion.div>
);

export const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};
