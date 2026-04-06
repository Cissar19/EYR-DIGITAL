import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';

const ROLE_LABELS = {
    super_admin:   'Super Admin',
    admin:         'Admin',
    director:      'Director',
    utp_head:      'UTP',
    inspector:     'Inspector',
    convivencia:   'Convivencia',
    teacher:       'Docente',
    staff:         'Staff',
};

const ROLE_COLORS = {
    super_admin: 'bg-red-100 text-red-700',
    admin:       'bg-purple-100 text-purple-700',
    director:    'bg-slate-200 text-slate-700',
    utp_head:    'bg-indigo-100 text-indigo-700',
    inspector:   'bg-sky-100 text-sky-700',
    teacher:     'bg-emerald-100 text-emerald-700',
};

function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export default function ComentariosPanel({ evaluacion }) {
    const { user } = useAuth();
    const { addComment } = useEvaluaciones();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    const comments = (evaluacion.comments || []).slice().sort((a, b) => a.createdAt?.localeCompare(b.createdAt));

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments.length]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        const comment = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            text: trimmed,
            createdBy: { id: user.uid, name: user.displayName || user.name || '' },
            createdAt: new Date().toISOString(),
            role: user.role || 'teacher',
        };
        await addComment(evaluacion.id, comment);
        setText('');
        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800">Comentarios</h3>
                {comments.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400">{comments.length} comentario{comments.length !== 1 ? 's' : ''}</span>
                )}
            </div>

            {/* Lista de comentarios */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                        <MessageSquare className="w-8 h-8" />
                        <p className="text-sm">Sin comentarios aún</p>
                        <p className="text-xs">UTP y el docente pueden dejar retroalimentación aquí</p>
                    </div>
                ) : (
                    comments.map(c => {
                        const isOwn = c.createdBy?.id === user?.uid;
                        const roleCls = ROLE_COLORS[c.role] || 'bg-slate-100 text-slate-600';
                        const inicial = (c.createdBy?.name || '?').charAt(0).toUpperCase();

                        return (
                            <div key={c.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                    {inicial}
                                </div>
                                {/* Burbuja */}
                                <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-xs font-semibold text-slate-700">{c.createdBy?.name}</span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleCls}`}>
                                            {ROLE_LABELS[c.role] || c.role}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{formatTime(c.createdAt)}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-snug whitespace-pre-wrap ${
                                        isOwn
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                    }`}>
                                        {c.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-end gap-2 shrink-0">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un comentario… (Enter para enviar, Shift+Enter para nueva línea)"
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none transition-all"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
