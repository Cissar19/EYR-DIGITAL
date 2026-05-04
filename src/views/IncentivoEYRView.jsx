import React, { useState, useMemo } from 'react';
import {
    Trophy, Users, Zap, Star, Search, X, CheckCircle2, Check,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    TrendingDown, Wallet, Medal, Award, LayoutList, GraduationCap,
    Minus, Plus, Sparkles,
} from 'lucide-react';
import { useStudents } from '../context/StudentsContext';
import { useIncentivoEYR } from '../context/IncentivoEYRContext';

// ── Paleta de colores ─────────────────────────────────────────────────────────
const C = {
    blue:'#3B6FE8', blueL:'#EEF3FD', blueD:'#2855c4',
    green:'#22C55E', greenL:'#DCFCE7', greenD:'#16a34a',
    orange:'#F97316', orangeL:'#FFF0E6', orangeD:'#ea6a0a',
    purple:'#8B5CF6', purpleL:'#F3EFFE', purpleD:'#7c3aed',
    pink:'#EC4899', pinkL:'#FDF2F8', pinkD:'#db2777',
    teal:'#14B8A6', tealL:'#E0FAFA', tealD:'#0d9488',
    yellow:'#EAB308', yellowL:'#FEFCE8', yellowD:'#ca8a04',
    red:'#EF4444', redL:'#FEE2E2', redD:'#dc2626',
    text:'#1a2340', text2:'#5a6585', text3:'#9BA5BE',
    border:'rgba(26,35,64,0.08)', bg:'#F4F6FB', surface:'#fff',
};
const COURSE_COLORS = [
    { main:C.pink,   light:C.pinkL,   dark:C.pinkD   },
    { main:C.orange, light:C.orangeL, dark:C.orangeD },
    { main:C.blue,   light:C.blueL,   dark:C.blueD   },
    { main:C.purple, light:C.purpleL, dark:C.purpleD },
    { main:C.teal,   light:C.tealL,   dark:C.tealD   },
    { main:C.green,  light:C.greenL,  dark:C.greenD  },
    { main:C.yellow, light:C.yellowL, dark:C.yellowD },
    { main:C.blue,   light:C.blueL,   dark:C.blueD   },
    { main:C.purple, light:C.purpleL, dark:C.purpleD },
    { main:C.orange, light:C.orangeL, dark:C.orangeD },
];
const PAGE_SIZE = 25;

// ── Reglas del motor (Economía de Estrellas) ──────────────────────────────────
const BONUS_EVENTS = [
    { key:'BONUS_ASISTENCIA_PERFECTA',  label:'Asistencia perfecta semanal',   amount:10 },
    { key:'BONUS_PUNTUALIDAD_PERFECTA', label:'Puntualidad perfecta semanal',  amount:5  },
    { key:'BONUS_CONDUCTA_PERFECTA',    label:'Conducta perfecta semanal',     amount:5  },
    { key:'LOGRO_ANOTACION_POSITIVA',   label:'Anotación positiva',            amount:5  },
];

const PENALTY_EVENTS = [
    { key:'PENALTI_ATRASO',          label:'Atraso al llegar',            amount:3,  perUnit:true  },
    { key:'PENALTI_INASISTENCIA',    label:'Inasistencia injustificada',  amount:10, perUnit:true  },
    { key:'PENALTI_CONDUCTA_LEVE',   label:'Anotación negativa leve',     amount:15, perUnit:false },
    { key:'PENALTI_CONDUCTA_GRAVE',  label:'Anotación negativa grave',    amount:30, perUnit:false },
];

// ── Sistema de Tiers ──────────────────────────────────────────────────────────
// Umbrales mensuales: semana perfecta = +20 pts, mes perfecto ≈ 80 pts
const TIERS = [
    { id:3, label:'Excelencia', minCoins:80, color:'#EAB308', colorL:'#FEFCE8', colorD:'#a16207', TierIcon: Trophy },
    { id:2, label:'Destacado',  minCoins:30, color:'#8B5CF6', colorL:'#F3EFFE', colorD:'#7c3aed', TierIcon: Award  },
    { id:1, label:'Regular',    minCoins:0,  color:'#3B6FE8', colorL:'#EEF3FD', colorD:'#2855c4', TierIcon: Star   },
];

function getTier(coins) {
    return TIERS.find(t => coins >= t.minCoins) ?? TIERS[TIERS.length - 1];
}

function sortCursos(cursos) {
    const order = ['Pre-Kinder','Kinder','1° Básico','2° Básico','3° Básico','4° Básico','5° Básico','6° Básico','7° Básico','8° Básico'];
    return [...cursos].sort((a, b) => {
        const ia = order.indexOf(a), ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b, 'es');
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });
}

function hashHue(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
}

function formatFecha(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CL', { day:'2-digit', month:'short' });
}

// ── Componentes base ──────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
    React.useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
    return (
        <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:'#1a2340', color:'#fff', borderRadius:12, padding:'13px 22px', fontSize:14, fontWeight:700, zIndex:9999, display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 32px rgba(26,35,64,0.22)' }}>
            <CheckCircle2 size={18} color={C.green} /> {msg}
        </div>
    );
}

function TierBadge({ coins }) {
    const tier = getTier(coins);
    return (
        <span style={{ fontSize:10, fontWeight:800, color:tier.colorD, background:tier.colorL, borderRadius:99, padding:'2px 9px', display:'inline-flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
            <tier.TierIcon size={10} /> {tier.label}
        </span>
    );
}

// ── Modal DAR estrellas ───────────────────────────────────────────────────────
function GiveCoinsModal({ student, onClose, onGive }) {
    const [selected, setSelected] = useState(null);   // null = manual
    const [manualAmount, setManualAmount] = useState(5);
    const [saving, setSaving] = useState(false);

    const amount = selected ? selected.amount : manualAmount;
    const nota   = selected ? selected.label : `Dar ${manualAmount} estrellas`;

    const handleGive = async () => {
        setSaving(true);
        try { await onGive(student, amount, nota); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.35)', backdropFilter:'blur(2px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, padding:28, width:380, boxShadow:'0 20px 60px rgba(26,35,64,0.2)', zIndex:1 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.yellowL, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Sparkles size={22} color={C.yellow} />
                    </div>
                    <div>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Dar estrellas</div>
                        <div style={{ fontSize:13, color:C.text2 }}>{student.fullName}</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.text3, padding:4, display:'flex' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Eventos bonus */}
                <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Bonificaciones semanales</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {BONUS_EVENTS.map(ev => {
                            const active = selected?.key === ev.key;
                            return (
                                <button key={ev.key} onClick={() => setSelected(active ? null : ev)}
                                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`2px solid ${active ? C.blue : C.border}`, background:active ? C.blueL : '#f8f9fc', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                                    <div style={{ width:14, height:14, borderRadius:99, border:`2px solid ${active ? C.blue : C.text3}`, background:active ? C.blue : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        {active && <div style={{ width:5, height:5, background:'#fff', borderRadius:99 }} />}
                                    </div>
                                    <span style={{ flex:1, fontSize:13, fontWeight:active ? 700 : 500, color:active ? C.blueD : C.text }}>{ev.label}</span>
                                    <span style={{ fontSize:13, fontWeight:800, color:C.greenD, background:C.greenL, borderRadius:99, padding:'1px 8px' }}>+{ev.amount}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Monto manual */}
                <div style={{ marginBottom:22 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Monto manual</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, background: selected ? '#f0f2f7' : '#f8f9fc', borderRadius:10, padding:'8px 14px', border:`2px solid ${!selected ? C.blue : C.border}`, cursor:selected ? 'pointer' : 'default' }}
                        onClick={() => selected && setSelected(null)}>
                        <span style={{ fontSize:13, color:C.text2, fontWeight:700 }}>Otro:</span>
                        <input type="number" min="1" max="999" value={manualAmount} disabled={!!selected}
                            onChange={e => setManualAmount(Number(e.target.value) || 1)}
                            style={{ border:'none', background:'transparent', outline:'none', fontSize:18, fontWeight:800, color: selected ? C.text3 : C.text, width:60, fontFamily:'inherit', cursor: selected ? 'not-allowed' : 'text' }} />
                        <span style={{ fontSize:13, color:C.text3 }}>estrellas</span>
                    </div>
                </div>

                <button onClick={handleGive} disabled={saving}
                    style={{ width:'100%', background:C.blue, color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving ? 0.7 : 1 }}>
                    <Star size={16} fill="#fff" color="#fff" />
                    Dar {amount} estrella{amount !== 1 ? 's' : ''} a {student.fullName.split(' ')[0]}
                </button>
            </div>
        </div>
    );
}

// ── Modal DESCONTAR estrellas ─────────────────────────────────────────────────
function TakeCoinsModal({ student, currentCoins, onClose, onTake }) {
    const [selected, setSelected] = useState(null);
    const [qty, setQty] = useState(1);
    const [saving, setSaving] = useState(false);

    const totalAmount = selected
        ? selected.perUnit ? selected.amount * qty : selected.amount
        : 0;
    const newBalance = Math.max(0, currentCoins - totalAmount);

    const handleTake = async () => {
        if (!selected) return;
        setSaving(true);
        const nota = selected.perUnit
            ? `${selected.label} (×${qty})`
            : selected.label;
        try { await onTake(student, totalAmount, nota); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.35)', backdropFilter:'blur(2px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, padding:28, width:380, boxShadow:'0 20px 60px rgba(26,35,64,0.2)', zIndex:1 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.redL, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <TrendingDown size={22} color={C.red} />
                    </div>
                    <div>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Descontar estrellas</div>
                        <div style={{ fontSize:13, color:C.text2 }}>{student.fullName}</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.text3, padding:4, display:'flex' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Saldo actual */}
                <div style={{ background:'#f8f9fc', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text2 }}>Saldo actual</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Star size={14} fill={C.yellow} color={C.yellow} />
                        <span style={{ fontSize:16, fontWeight:900, color:C.text }}>{currentCoins}</span>
                    </div>
                </div>

                {/* Tipos de penalización */}
                <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Tipo de penalización</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {PENALTY_EVENTS.map(ev => {
                            const active = selected?.key === ev.key;
                            return (
                                <button key={ev.key} onClick={() => { setSelected(active ? null : ev); setQty(1); }}
                                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`2px solid ${active ? C.red : C.border}`, background:active ? C.redL : '#f8f9fc', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                                    <div style={{ width:14, height:14, borderRadius:99, border:`2px solid ${active ? C.red : C.text3}`, background:active ? C.red : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        {active && <div style={{ width:5, height:5, background:'#fff', borderRadius:99 }} />}
                                    </div>
                                    <span style={{ flex:1, fontSize:13, fontWeight:active ? 700 : 500, color:active ? C.redD : C.text }}>{ev.label}</span>
                                    <span style={{ fontSize:12, fontWeight:800, color:C.redD, background:C.redL, borderRadius:99, padding:'1px 8px', whiteSpace:'nowrap' }}>
                                        -{ev.amount}{ev.perUnit ? ' c/u' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cantidad (solo para per-unit) */}
                {selected?.perUnit && (
                    <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:10, fontWeight:800, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Cantidad</div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8f9fc', borderRadius:10, padding:'8px 14px' }}>
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                style={{ width:30, height:30, borderRadius:8, background:'#fff', border:`1.5px solid ${C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text2, flexShrink:0 }}>
                                <Minus size={14} />
                            </button>
                            <span style={{ flex:1, textAlign:'center', fontSize:18, fontWeight:900, color:C.text }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)}
                                style={{ width:30, height:30, borderRadius:8, background:'#fff', border:`1.5px solid ${C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text2, flexShrink:0 }}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Resumen */}
                {selected && (
                    <div style={{ background:C.redL, borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.redD }}>Total a descontar</span>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:16, fontWeight:900, color:C.redD }}>-{totalAmount}</span>
                            <Star size={13} fill={C.redD} color={C.redD} />
                            <span style={{ fontSize:11, color:C.text3, marginLeft:4 }}>→ saldo: {newBalance}</span>
                        </div>
                    </div>
                )}

                <button onClick={handleTake} disabled={saving || !selected}
                    style={{ width:'100%', background:selected ? C.red : '#e5e7eb', color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:15, fontWeight:800, cursor:selected ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving ? 0.7 : 1 }}>
                    <TrendingDown size={16} />
                    {selected ? `Descontar ${totalAmount} estrella${totalAmount !== 1 ? 's' : ''}` : 'Selecciona un tipo'}
                </button>
            </div>
        </div>
    );
}

// ── Drawer historial ──────────────────────────────────────────────────────────
function MovementsDrawer({ student, coins, color, transacciones, onClose }) {
    if (!student) return null;
    const tier = getTier(coins);
    return (
        <div style={{ position:'fixed', inset:0, zIndex:150, display:'flex', alignItems:'stretch', justifyContent:'flex-end' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.2)' }} />
            <div style={{ width:340, background:'#fff', display:'flex', flexDirection:'column', position:'relative', zIndex:1, boxShadow:'-8px 0 40px rgba(26,35,64,0.12)' }}>
                <div style={{ background:color.main, padding:'24px 22px 20px', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:99, background:'rgba(255,255,255,0.12)' }} />
                    <div style={{ position:'absolute', right:20, bottom:-30, width:80, height:80, borderRadius:99, background:'rgba(255,255,255,0.08)' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{student.fullName[0]}</span>
                            </div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Alumno</div>
                                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{student.fullName}</div>
                                {student.curso && (
                                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>{student.curso}</div>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center' }}>
                            <X size={16} />
                        </button>
                    </div>
                    <div style={{ marginTop:16, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                        <div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Saldo</div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:30, fontWeight:900, color:'#fff' }}>{coins}</span>
                                <Star size={18} fill="rgba(255,255,255,0.7)" color="rgba(255,255,255,0.7)" />
                            </div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:800, color:tier.colorD, background:'rgba(255,255,255,0.92)', borderRadius:99, padding:'4px 12px', display:'inline-flex', alignItems:'center', gap:4 }}>
                            <tier.TierIcon size={11} /> Nivel {tier.label}
                        </span>
                    </div>
                </div>

                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
                    <div style={{ fontSize:11, fontWeight:800, color:C.text2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Historial de movimientos</div>
                    {transacciones.length === 0 ? (
                        <div style={{ textAlign:'center', color:C.text3, fontSize:13, padding:'32px 0' }}>Sin movimientos registrados.</div>
                    ) : transacciones.map((m, i) => {
                        const pos = m.tipo === 'ingreso';
                        return (
                            <div key={m.id || i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                                <div style={{ width:36, height:36, borderRadius:99, background:pos ? C.greenL : C.redL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    {pos ? <Star size={16} fill={C.greenD} color={C.greenD} /> : <TrendingDown size={16} color={C.redD} />}
                                </div>
                                <div style={{ flex:1 }}>
                                    <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{m.nota || (pos ? 'Ingreso' : 'Egreso')}</div>
                                    <div style={{ fontSize:11, color:C.text3 }}>{formatFecha(m.fecha)} · Por {m.registradoPor}</div>
                                </div>
                                <div style={{ fontSize:14, fontWeight:800, color:pos ? C.greenD : C.redD }}>
                                    {pos ? '+' : '-'}{m.monto}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Paginador ─────────────────────────────────────────────────────────────────
function Pager({ page, totalPages, total, onPrev, onNext }) {
    if (totalPages <= 1) return null;
    return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:`1px solid ${C.border}`, background:'#fafbfd' }}>
            <span style={{ fontSize:12, color:C.text3, fontWeight:600 }}>
                {total} resultado{total !== 1 ? 's' : ''}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={onPrev} disabled={page === 1} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'#fff', cursor:page===1?'default':'pointer', color:page===1?C.text3:C.text2, fontWeight:700, fontSize:12, fontFamily:'inherit', opacity:page===1?0.5:1 }}>
                    <ChevronLeft size={14} /> Anterior
                </button>
                <span style={{ fontSize:13, fontWeight:700, color:C.blueD, background:C.blueL, borderRadius:8, padding:'5px 12px' }}>
                    {page} / {totalPages}
                </span>
                <button onClick={onNext} disabled={page === totalPages} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'#fff', cursor:page===totalPages?'default':'pointer', color:page===totalPages?C.text3:C.text2, fontWeight:700, fontSize:12, fontFamily:'inherit', opacity:page===totalPages?0.5:1 }}>
                    Siguiente <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

const thStyle = { padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#9BA5BE', letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:'2px solid rgba(26,35,64,0.08)' };

function SortIcon({ col, sortBy, sortDir }) {
    if (sortBy !== col) return <ChevronDown size={11} color={C.text3} style={{ opacity:0.4 }} />;
    return sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />;
}

// ── Vista todos los alumnos ───────────────────────────────────────────────────
function AllStudentsView({ courses, estrellas, registrarMovimiento, getTransaccionesAlumno }) {
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [sortBy, setSortBy] = useState('coins');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [drawer, setDrawer] = useState(null);
    const [giveModal, setGiveModal] = useState(null);
    const [takeModal, setTakeModal] = useState(null);
    const [toast, setToast] = useState(null);

    const allStudents = useMemo(() =>
        courses.flatMap(c =>
            c.alumnos.map(s => ({ ...s, curso: c.name, color: c.color, coins: estrellas[s.id] ?? 0 }))
        ),
        [courses, estrellas]
    );

    const filtered = useMemo(() => {
        let list = allStudents.filter(s => {
            const mn = s.fullName.toLowerCase().includes(search.toLowerCase());
            const mc = !courseFilter || s.curso === courseFilter;
            return mn && mc;
        });
        list.sort((a, b) => {
            let v = 0;
            if (sortBy === 'coins') v = a.coins - b.coins;
            else if (sortBy === 'name') v = a.fullName.localeCompare(b.fullName, 'es');
            else if (sortBy === 'curso') v = a.curso.localeCompare(b.curso, 'es');
            return sortDir === 'desc' ? -v : v;
        });
        return list;
    }, [allStudents, search, courseFilter, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    function handleSearch(v) { setSearch(v); setPage(1); }
    function handleCourse(v) { setCourseFilter(v); setPage(1); }
    function toggleSort(col) {
        if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortBy(col); setSortDir('desc'); setPage(1); }
    }

    async function handleGive(student, amount, nota) {
        await registrarMovimiento({ studentId: student.id, monto: amount, tipo: 'ingreso', nota });
        setGiveModal(null);
        setToast(`+${amount} estrella${amount !== 1 ? 's' : ''} a ${student.fullName.split(' ')[0]}`);
    }
    async function handleTake(student, amount, nota) {
        await registrarMovimiento({ studentId: student.id, monto: amount, tipo: 'egreso', nota });
        setTakeModal(null);
        setToast(`-${amount} estrella${amount !== 1 ? 's' : ''} a ${student.fullName.split(' ')[0]}`);
    }

    const drawerColor = drawer ? (drawer.color || { main:C.blue, light:C.blueL, dark:C.blueD }) : { main:C.blue };

    return (
        <div style={{ padding:'24px 26px', display:'flex', flexDirection:'column', gap:16 }}>
            {/* Toolbar */}
            <div style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f4f6fb', borderRadius:10, padding:'0 12px', height:38, flex:1, minWidth:180 }}>
                    <Search size={14} color={C.text3} />
                    <input placeholder="Buscar por nombre…" value={search} onChange={e => handleSearch(e.target.value)}
                        style={{ border:'none', background:'transparent', outline:'none', fontSize:13, width:'100%', fontFamily:'inherit', color:C.text }} />
                    {search && (
                        <button onClick={() => handleSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.text3, display:'flex', padding:0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f4f6fb', borderRadius:10, padding:'0 12px', height:38 }}>
                    <GraduationCap size={14} color={C.text3} />
                    <select value={courseFilter} onChange={e => handleCourse(e.target.value)}
                        style={{ border:'none', background:'transparent', outline:'none', fontSize:13, fontFamily:'inherit', color:courseFilter ? C.text : C.text3, cursor:'pointer', paddingRight:4, minWidth:130 }}>
                        <option value="">Todos los cursos</option>
                        {courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    {courseFilter && (
                        <button onClick={() => handleCourse('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.text3, display:'flex', padding:0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.text3 }}>
                    {filtered.length} alumno{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Tabla */}
            <div style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'#fafbfd' }}>
                                <th style={thStyle}>#</th>
                                <th onClick={() => toggleSort('name')} style={{ ...thStyle, color:sortBy==='name'?C.blueD:C.text3, cursor:'pointer', userSelect:'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>Alumno <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} /></div>
                                </th>
                                <th onClick={() => toggleSort('curso')} style={{ ...thStyle, color:sortBy==='curso'?C.blueD:C.text3, cursor:'pointer', userSelect:'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>Curso <SortIcon col="curso" sortBy={sortBy} sortDir={sortDir} /></div>
                                </th>
                                <th onClick={() => toggleSort('coins')} style={{ ...thStyle, color:sortBy==='coins'?C.blueD:C.text3, cursor:'pointer', userSelect:'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                        <Star size={11} fill={sortBy==='coins'?C.blueD:C.text3} color={sortBy==='coins'?C.blueD:C.text3} /> Estrellas <SortIcon col="coins" sortBy={sortBy} sortDir={sortDir} />
                                    </div>
                                </th>
                                <th style={thStyle}>Nivel</th>
                                <th style={{ ...thStyle, textAlign:'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding:'40px 0', textAlign:'center', color:C.text3, fontSize:13 }}>
                                        No se encontraron alumnos.
                                    </td>
                                </tr>
                            ) : paginated.map((s, idx) => {
                                const globalRank = (safePage - 1) * PAGE_SIZE + idx + 1;
                                const hue = hashHue(s.id);
                                const color = s.color || { main:C.blue, light:C.blueL, dark:C.blueD };
                                return (
                                    <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}` }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfd'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding:'11px 16px' }}>
                                            <span style={{ fontSize:11, fontWeight:700, color:C.text3 }}>{globalRank}</span>
                                        </td>
                                        <td style={{ padding:'11px 14px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                <div style={{ width:32, height:32, borderRadius:99, background:`hsl(${hue},55%,88%)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    <span style={{ fontSize:12, fontWeight:800, color:`hsl(${hue},55%,35%)` }}>{s.fullName[0]}</span>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.fullName}</div>
                                                    <div style={{ fontSize:11, color:C.text3, fontFamily:'monospace' }}>{s.rut}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding:'11px 14px' }}>
                                            <span style={{ fontSize:12, fontWeight:700, color:color.dark, background:color.light, borderRadius:8, padding:'4px 10px' }}>
                                                {s.curso}
                                            </span>
                                        </td>
                                        <td style={{ padding:'11px 14px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <Star size={15} fill={C.yellow} color={C.yellow} />
                                                <span style={{ fontSize:17, fontWeight:900, color:C.text, letterSpacing:'-0.02em' }}>{s.coins}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding:'11px 14px' }}>
                                            <TierBadge coins={s.coins} />
                                        </td>
                                        <td style={{ padding:'11px 14px' }}>
                                            <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                                                <button onClick={() => setGiveModal(s)} style={{ display:'flex', alignItems:'center', gap:5, background:color.light, border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:800, color:color.dark, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    <Star size={12} fill={color.dark} color={color.dark} /> Dar
                                                </button>
                                                <button onClick={() => setTakeModal(s)} style={{ display:'flex', alignItems:'center', gap:5, background:C.redL, border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:800, color:C.redD, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    <Minus size={12} /> Restar
                                                </button>
                                                <button onClick={() => setDrawer(s)} style={{ display:'flex', alignItems:'center', gap:5, background:'#f4f6fb', border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:700, color:C.text2, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pager page={safePage} totalPages={totalPages} total={filtered.length}
                    onPrev={() => setPage(p => Math.max(1, p - 1))}
                    onNext={() => setPage(p => Math.min(totalPages, p + 1))} />
            </div>

            {drawer && (
                <MovementsDrawer student={drawer} coins={estrellas[drawer.id] ?? 0} color={drawerColor}
                    transacciones={getTransaccionesAlumno(drawer.id)} onClose={() => setDrawer(null)} />
            )}
            {giveModal && <GiveCoinsModal student={giveModal} onClose={() => setGiveModal(null)} onGive={handleGive} />}
            {takeModal && <TakeCoinsModal student={takeModal} currentCoins={estrellas[takeModal.id] ?? 0} onClose={() => setTakeModal(null)} onTake={handleTake} />}
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
        </div>
    );
}

// ── Vista detalle curso ───────────────────────────────────────────────────────
function CourseDetailView({ course, color, onBack, estrellas, registrarMovimiento, getTransaccionesAlumno }) {
    const [searchSt, setSearchSt] = useState('');
    const [filterActive, setFilterActive] = useState('todos');
    const [sortBy, setSortBy] = useState('coins');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [drawer, setDrawer] = useState(null);
    const [giveModal, setGiveModal] = useState(null);
    const [takeModal, setTakeModal] = useState(null);
    const [toast, setToast] = useState(null);

    const roster = useMemo(() =>
        course.alumnos.map(a => ({ ...a, coins: estrellas[a.id] ?? 0 })),
        [course.alumnos, estrellas]
    );

    const sorted = useMemo(() => {
        let list = [...roster].filter(s => {
            const ms = s.fullName.toLowerCase().includes(searchSt.toLowerCase());
            const isActive = s.coins > 0;
            const ma = filterActive === 'todos' || (filterActive === 'activos' ? isActive : !isActive);
            return ms && ma;
        });
        list.sort((a, b) => {
            let v = 0;
            if (sortBy === 'coins') v = a.coins - b.coins;
            else if (sortBy === 'name') v = a.fullName.localeCompare(b.fullName, 'es');
            return sortDir === 'desc' ? -v : v;
        });
        return list;
    }, [roster, searchSt, filterActive, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const maxCoins  = roster.length > 0 ? Math.max(...roster.map(s => s.coins), 1) : 1;
    const avgCoins  = roster.length > 0 ? Math.round(roster.reduce((a, s) => a + s.coins, 0) / roster.length) : 0;
    const totalCoins = roster.reduce((a, s) => a + s.coins, 0);
    const activeCount = roster.filter(s => s.coins > 0).length;
    const destacadosCount = roster.filter(s => s.coins >= TIERS[1].minCoins).length;
    const pct = roster.length > 0 ? Math.round(activeCount / roster.length * 100) : 0;

    const rankedIds = useMemo(() =>
        [...roster].sort((a, b) => b.coins - a.coins).map(s => s.id),
        [roster]
    );

    function toggleSort(col) {
        if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortBy(col); setSortDir('desc'); setPage(1); }
    }
    function handleSearch(v) { setSearchSt(v); setPage(1); }
    function handleFilter(v) { setFilterActive(v); setPage(1); }

    async function handleGive(student, amount, nota) {
        await registrarMovimiento({ studentId: student.id, monto: amount, tipo: 'ingreso', nota });
        setGiveModal(null);
        setToast(`+${amount} estrella${amount !== 1 ? 's' : ''} a ${student.fullName.split(' ')[0]}`);
    }
    async function handleTake(student, amount, nota) {
        await registrarMovimiento({ studentId: student.id, monto: amount, tipo: 'egreso', nota });
        setTakeModal(null);
        setToast(`-${amount} estrella${amount !== 1 ? 's' : ''} a ${student.fullName.split(' ')[0]}`);
    }

    const kpis = [
        { Icon: Users,  label:'Alumnos',         value:course.alumnos.length, bg:'#f4f6fb',   tc:C.text,      fill:false },
        { Icon: Zap,    label:'Activos',          value:`${pct}%`,             bg:C.greenL,    tc:C.greenD,    fill:false },
        { Icon: Star,   label:'Prom. estrellas',  value:avgCoins,              bg:C.yellowL,   tc:C.yellowD,   fill:true  },
        { Icon: Award,  label:'Nivel Destacado+', value:destacadosCount,       bg:C.purpleL,   tc:C.purpleD,   fill:false },
        { Icon: Wallet, label:'Total',            value:totalCoins,            bg:color.light, tc:color.dark,  fill:false },
    ];

    return (
        <div style={{ padding:'24px 26px', display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:10, padding:'8px 14px', cursor:'pointer', fontSize:13, fontWeight:700, color:C.text2, fontFamily:'inherit' }}>
                    <ChevronLeft size={15} /> Todos los cursos
                </button>
                <div style={{ background:color.light, borderRadius:10, padding:'6px 14px', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:17, fontWeight:900, color:color.dark }}>{course.name}</span>
                </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {kpis.map(k => (
                    <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:'13px 15px', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <k.Icon size={20} color={k.tc} fill={k.fill ? k.tc : 'none'} />
                        </div>
                        <div>
                            <div style={{ fontSize:9, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</div>
                            <div style={{ fontSize:20, fontWeight:900, color:k.tc, letterSpacing:'-0.02em' }}>{k.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f4f6fb', borderRadius:10, padding:'0 11px', height:36, flex:1, maxWidth:240 }}>
                        <Search size={14} color={C.text3} />
                        <input placeholder="Buscar alumno…" value={searchSt} onChange={e => handleSearch(e.target.value)}
                            style={{ border:'none', background:'transparent', outline:'none', fontSize:13, width:'100%', fontFamily:'inherit', color:C.text }} />
                        {searchSt && (
                            <button onClick={() => handleSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.text3, display:'flex', padding:0 }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                        {[['todos','Todos'],['activos','Activos'],['inactivos','Inactivos']].map(([v, l]) => (
                            <button key={v} onClick={() => handleFilter(v)} style={{ fontSize:12, fontWeight:700, padding:'5px 13px', borderRadius:99, border:'none', background:filterActive===v ? color.main : '#f4f6fb', color:filterActive===v ? '#fff' : C.text2, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
                        ))}
                    </div>
                    <div style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:C.text3 }}>{sorted.length} alumnos</div>
                </div>

                <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'#fafbfd' }}>
                                <th style={thStyle}>#</th>
                                <th onClick={() => toggleSort('name')} style={{ ...thStyle, color:sortBy==='name'?color.dark:C.text3, cursor:'pointer', userSelect:'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>Alumno <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} /></div>
                                </th>
                                <th onClick={() => toggleSort('coins')} style={{ ...thStyle, color:sortBy==='coins'?color.dark:C.text3, cursor:'pointer', userSelect:'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                        <Star size={11} fill={sortBy==='coins'?color.dark:C.text3} color={sortBy==='coins'?color.dark:C.text3} /> Estrellas <SortIcon col="coins" sortBy={sortBy} sortDir={sortDir} />
                                    </div>
                                </th>
                                <th style={thStyle}>Distribución</th>
                                <th style={thStyle}>Nivel</th>
                                <th style={{ ...thStyle, textAlign:'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(s => {
                                const rank = rankedIds.indexOf(s.id) + 1;
                                const top3 = rank <= 3;
                                const medalColors = ['#EAB308','#9BA5BE','#a0522d'];
                                const hue = hashHue(s.id);
                                return (
                                    <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}` }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfd'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding:'12px 16px' }}>
                                            <div style={{ width:26, height:26, borderRadius:99, background:top3 ? medalColors[rank-1]+'22' : '#f0f2f7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                {top3
                                                    ? <Medal size={14} color={medalColors[rank-1]} fill={medalColors[rank-1]+'44'} />
                                                    : <span style={{ fontSize:10, fontWeight:800, color:C.text3 }}>{rank}</span>
                                                }
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 14px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                <div style={{ width:32, height:32, borderRadius:99, background:`hsl(${hue},55%,88%)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    <span style={{ fontSize:12, fontWeight:800, color:`hsl(${hue},55%,35%)` }}>{s.fullName[0]}</span>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.fullName}</div>
                                                    <div style={{ fontSize:11, color:C.text3, fontFamily:'monospace' }}>{s.rut}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 14px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <Star size={15} fill={C.yellow} color={C.yellow} />
                                                <span style={{ fontSize:18, fontWeight:900, color:C.text, letterSpacing:'-0.02em' }}>{s.coins}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 14px', minWidth:120 }}>
                                            <div style={{ width:'100%', height:8, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
                                                <div style={{ width:`${Math.min(100, (s.coins / maxCoins) * 100)}%`, height:'100%', background:color.main, borderRadius:99 }} />
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 14px' }}>
                                            <TierBadge coins={s.coins} />
                                        </td>
                                        <td style={{ padding:'12px 14px' }}>
                                            <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                                                <button onClick={e => { e.stopPropagation(); setGiveModal(s); }} style={{ display:'flex', alignItems:'center', gap:5, background:color.light, border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:800, color:color.dark, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    <Star size={12} fill={color.dark} color={color.dark} /> Dar
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); setTakeModal(s); }} style={{ display:'flex', alignItems:'center', gap:5, background:C.redL, border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:800, color:C.redD, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    <Minus size={12} /> Restar
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); setDrawer(s); }} style={{ display:'flex', alignItems:'center', gap:5, background:'#f4f6fb', border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontSize:12, fontWeight:700, color:C.text2, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                                    Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pager page={safePage} totalPages={totalPages} total={sorted.length}
                    onPrev={() => setPage(p => Math.max(1, p - 1))}
                    onNext={() => setPage(p => Math.min(totalPages, p + 1))} />
            </div>

            {drawer && (
                <MovementsDrawer student={drawer} coins={estrellas[drawer.id] ?? 0} color={color}
                    transacciones={getTransaccionesAlumno(drawer.id)} onClose={() => setDrawer(null)} />
            )}
            {giveModal && <GiveCoinsModal student={giveModal} onClose={() => setGiveModal(null)} onGive={handleGive} />}
            {takeModal && <TakeCoinsModal student={takeModal} currentCoins={estrellas[takeModal.id] ?? 0} onClose={() => setTakeModal(null)} onTake={handleTake} />}
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
        </div>
    );
}

// ── Vista lista de cursos ─────────────────────────────────────────────────────
function CourseListView({ courses, onSelectCourse }) {
    const [filterLevel, setFilterLevel] = useState('Todos');
    const [search, setSearch] = useState('');

    const totalStudents  = courses.reduce((a, c) => a + c.alumnos.length, 0);
    const totalActive    = courses.reduce((a, c) => a + c.alumnos.filter(s => c.coinsMap[s.id] > 0).length, 0);
    const totalCoins     = courses.reduce((a, c) => a + c.alumnos.reduce((s, st) => s + (c.coinsMap[st.id] ?? 0), 0), 0);
    const avgCoins       = totalStudents > 0 ? Math.round(totalCoins / totalStudents) : 0;
    const totalDestacados = courses.reduce((a, c) => a + c.alumnos.filter(s => (c.coinsMap[s.id] ?? 0) >= TIERS[1].minCoins).length, 0);

    const filtered = courses.filter(c => {
        const ms = c.name.toLowerCase().includes(search.toLowerCase());
        const ml = filterLevel === 'Todos' || c.level === filterLevel;
        return ms && ml;
    });

    const topKpis = [
        { Icon: Users,  label:'Total alumnos',   value:totalStudents,   sub:`${courses.length} cursos`,                                                       bg:C.blueL,   color:C.blue,    fill:false },
        { Icon: Zap,    label:'Alumnos activos',  value:totalActive,     sub:`${totalStudents>0?Math.round(totalActive/totalStudents*100):0}% participación`,   bg:C.greenL,  color:C.greenD,  fill:false },
        { Icon: Star,   label:'Prom. estrellas',  value:avgCoins,        sub:'por alumno',                                                                     bg:C.yellowL, color:C.yellowD, fill:true  },
        { Icon: Award,  label:'Nivel Destacado+', value:totalDestacados, sub:`≥${TIERS[1].minCoins} estrellas`,                                                bg:C.purpleL, color:C.purpleD, fill:false },
    ];

    return (
        <div style={{ padding:'26px 26px', display:'flex', flexDirection:'column', gap:22 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {topKpis.map(k => (
                    <div key={k.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <k.Icon size={22} color={k.color} fill={k.fill ? k.color : 'none'} />
                        </div>
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</div>
                            <div style={{ fontSize:24, fontWeight:900, color:C.text, letterSpacing:'-0.02em', lineHeight:1.1 }}>{k.value}</div>
                            <div style={{ fontSize:11, color:C.text2, fontWeight:600 }}>{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:10, padding:'0 11px', height:36 }}>
                    <Search size={14} color={C.text3} />
                    <input placeholder="Buscar curso…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ border:'none', background:'transparent', outline:'none', fontSize:13, width:130, fontFamily:'inherit', color:C.text }} />
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:C.text3 }}>Ver:</span>
                {['Todos','Pre-Escolar','Básica'].map(f => (
                    <button key={f} onClick={() => setFilterLevel(f)} style={{ fontSize:13, fontWeight:700, padding:'6px 16px', borderRadius:99, border:'none', background:filterLevel===f ? C.blue : '#fff', color:filterLevel===f ? '#fff' : C.text2, cursor:'pointer', fontFamily:'inherit', boxShadow:filterLevel===f ? '0 2px 8px rgba(59,111,232,0.3)' : '0 1px 4px rgba(26,35,64,0.06)' }}>
                        {f}
                    </button>
                ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:12 }}>
                {filtered.map(c => {
                    const activeC = c.alumnos.filter(st => (c.coinsMap[st.id] ?? 0) > 0).length;
                    const pct     = c.alumnos.length > 0 ? Math.round(activeC / c.alumnos.length * 100) : 0;
                    const destC   = c.alumnos.filter(st => (c.coinsMap[st.id] ?? 0) >= TIERS[1].minCoins).length;
                    return (
                        <div key={c.name} onClick={() => onSelectCourse(c)}
                            style={{ background:'#fff', border:`2px solid ${C.border}`, borderRadius:16, padding:'18px 18px', cursor:'pointer', display:'flex', flexDirection:'column', gap:13, transition:'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color.main; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                            <div style={{ background:c.color.light, borderRadius:10, padding:'7px 10px', display:'inline-flex', flexDirection:'column', alignSelf:'flex-start' }}>
                                <div style={{ fontSize:10, fontWeight:700, color:c.color.dark, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.level}</div>
                                <div style={{ fontSize:17, fontWeight:900, color:c.color.dark }}>{c.name}</div>
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                                <div style={{ flex:1, textAlign:'center', background:'#f8f9fc', borderRadius:10, padding:'8px 0' }}>
                                    <div style={{ fontSize:10, color:C.text3, fontWeight:700 }}>Alumnos</div>
                                    <div style={{ fontSize:18, fontWeight:900, color:C.text }}>{c.alumnos.length}</div>
                                </div>
                                <div style={{ flex:1, textAlign:'center', background:c.color.light, borderRadius:10, padding:'8px 0' }}>
                                    <div style={{ fontSize:10, color:c.color.dark, fontWeight:700 }}>Activos</div>
                                    <div style={{ fontSize:18, fontWeight:900, color:c.color.dark }}>{pct}%</div>
                                </div>
                                <div style={{ flex:1, textAlign:'center', background:C.purpleL, borderRadius:10, padding:'8px 0' }}>
                                    <div style={{ fontSize:10, color:C.purpleD, fontWeight:700 }}>Dest.+</div>
                                    <div style={{ fontSize:18, fontWeight:900, color:C.purpleD }}>{destC}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:C.text3 }}>Participación</span>
                                    <span style={{ fontSize:11, fontWeight:800, color:C.text2 }}>{activeC}/{c.alumnos.length}</span>
                                </div>
                                <div style={{ width:'100%', height:7, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
                                    <div style={{ width:`${pct}%`, height:'100%', background:c.color.main, borderRadius:99 }} />
                                </div>
                            </div>
                            <div style={{ background:c.color.main, color:'#fff', borderRadius:10, padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:800 }}>
                                Ver {c.alumnos.length} alumnos <ChevronRight size={14} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function IncentivoEYRView() {
    const { students, loading: loadingStudents } = useStudents();
    const { estrellas, loading: loadingEstrellas, registrarMovimiento, getTransaccionesAlumno } = useIncentivoEYR();
    const [tab, setTab] = useState('cursos');
    const [view, setView] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);

    const courses = useMemo(() => {
        const cursos = sortCursos([...new Set(students.map(s => s.curso).filter(Boolean))]);
        return cursos.map((name, i) => {
            const alumnos = students
                .filter(s => s.curso === name)
                .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
            const level = name.includes('Básico') ? 'Básica' : 'Pre-Escolar';
            const coinsMap = Object.fromEntries(alumnos.map(a => [a.id, estrellas[a.id] ?? 0]));
            return { name, level, alumnos, color: COURSE_COLORS[i % COURSE_COLORS.length], coinsMap };
        });
    }, [students, estrellas]);

    const loading = loadingStudents || loadingEstrellas;

    if (loading) {
        return (
            <div style={{ padding:'26px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:12 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} style={{ background:'#fff', borderRadius:16, height:180, border:`2px solid ${C.border}` }} />
                ))}
            </div>
        );
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:0 }}>
            {/* Header + tabs */}
            <div style={{ padding:'22px 26px 0', display:'flex', alignItems:'center', gap:14, borderBottom:`1px solid ${C.border}`, background:'#fff' }}>
                <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,#3B6FE8,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Trophy size={22} color="#fff" />
                </div>
                <div style={{ flex:1 }}>
                    <h1 style={{ fontSize:20, fontWeight:900, color:C.text, letterSpacing:'-0.02em', margin:0 }}>Incentivo-EYR</h1>
                    <div style={{ fontSize:12, color:C.text2, fontWeight:600 }}>Sistema de recompensas por buena conducta</div>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', gap:2, background:'#f4f6fb', borderRadius:12, padding:4 }}>
                    {[
                        { key:'cursos',  label:'Por curso', Icon: GraduationCap },
                        { key:'alumnos', label:'Alumnos',   Icon: LayoutList },
                    ].map(t => (
                        <button key={t.key}
                            onClick={() => { setTab(t.key); if (t.key === 'cursos') { setView('list'); setSelectedCourse(null); } }}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:'none', background:tab===t.key ? '#fff' : 'transparent', color:tab===t.key ? C.text : C.text3, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:tab===t.key ? '0 1px 4px rgba(26,35,64,0.1)' : 'none', transition:'all .12s' }}>
                            <t.Icon size={15} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {tab === 'alumnos' ? (
                <AllStudentsView
                    courses={courses}
                    estrellas={estrellas}
                    registrarMovimiento={registrarMovimiento}
                    getTransaccionesAlumno={getTransaccionesAlumno}
                />
            ) : view === 'course' && selectedCourse ? (
                <CourseDetailView
                    course={selectedCourse}
                    color={selectedCourse.color}
                    onBack={() => { setView('list'); setSelectedCourse(null); }}
                    estrellas={estrellas}
                    registrarMovimiento={registrarMovimiento}
                    getTransaccionesAlumno={getTransaccionesAlumno}
                />
            ) : (
                <CourseListView
                    courses={courses}
                    onSelectCourse={c => { setSelectedCourse(c); setView('course'); }}
                />
            )}
        </div>
    );
}
