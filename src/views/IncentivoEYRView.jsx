import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    Trophy, Users, Zap, Star, Search, X, CheckCircle2, Check,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Wallet, Medal, Award, LayoutList, GraduationCap,
    Minus, Plus, Settings, Save, Gift, Pencil, Trash2,
    ShoppingBag, Tag, Package, ToggleLeft, ToggleRight, Percent, QrCode, Download, Printer,
} from 'lucide-react';
import { useStudents } from '../context/StudentsContext';
import { useIncentivoEYR } from '../context/IncentivoEYRContext';
import { useAuth } from '../context/AuthContext';
import logoEyr from '../assets/logo_eyr.png';

// Contexto local para pasar la config activa a sub-componentes del mismo archivo
const RulesCtx = React.createContext(null);

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

// ── Paleta de tiers (colores fijos por id) ────────────────────────────────────
const TIER_PALETTE = {
    3: { color:'#f5a524', colorL:'#fff3da', colorD:'#c97a06', TierIcon: Trophy },
    2: { color:'#ec4899', colorL:'#ffe4f1', colorD:'#be1d6e', TierIcon: Award  },
    1: { color:'#7c5cff', colorL:'#efe9ff', colorD:'#5e3df0', TierIcon: Star   },
};

// ── Paleta EYR (design system unificado) ─────────────────────────────────────
const EYR = {
    ink:    '#1b1530',
    ink2:   '#4a4366',
    ink3:   '#8a8499',
    bg:     '#f6f4fb',
    card:   '#ffffff',
    line:   '#ece9f3',
    line2:  '#dcd6ea',
    shadowLg: '0 30px 80px -20px rgba(57,32,110,.28),0 8px 24px -8px rgba(57,32,110,.12)',
    shadowMd: '0 8px 24px -10px rgba(57,32,110,.18)',
    overlay: 'rgba(27,21,48,.55)',
    pri:    '#7c5cff',
    priD:   '#5e3df0',
    priS:   '#efe9ff',
    sec:    '#14b8a6',
    secD:   '#0e8c7e',
    secS:   '#dffaf3',
    accent: '#ec4899',
    accentD:'#be1d6e',
    accentS:'#ffe4f1',
    amber:  '#f5a524',
    amberD: '#c97a06',
    amberS: '#fff3da',
    red:    '#ef4444',
    redD:   '#dc2626',
    redS:   '#fee2e2',
    green:  '#22c55e',
    greenD: '#16a34a',
    greenS: '#dcfce7',
    stripe: 'linear-gradient(90deg,#7c5cff,#ec4899,#f5a524)',
};

const TIER_CATEGORIES = {
    3: ['Instrumentos musicales', 'Tecnología avanzada', 'Ciencia y Educación'],
    2: ['Vestimenta', 'Entretención', 'Tecnología'],
    1: ['Útiles escolares', 'Papelería', 'Cuidado personal'],
};

// tiers viene de config (ordenado desc por minCoins)
function getTier(coins, tiers) {
    const sorted = [...tiers].sort((a, b) => b.minCoins - a.minCoins);
    return sorted.find(t => coins >= t.minCoins) ?? sorted[sorted.length - 1];
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
    const { tiers } = useContext(RulesCtx);
    const tier = getTier(coins, tiers);
    const pal  = TIER_PALETTE[tier.id] ?? TIER_PALETTE[1];
    return (
        <span style={{ fontSize:10, fontWeight:800, color:pal.colorD, background:pal.colorL, borderRadius:99, padding:'2px 9px', display:'inline-flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
            <pal.TierIcon size={10} /> {tier.label}
        </span>
    );
}

// ── Modal QR / Tarjeta alumno (diseño Antorcha) ───────────────────────────────
// Calcula "MM/YY" de caducidad: el alumno egresa de 8vo el diciembre del año correspondiente
function calcValidDate(curso) {
    if (!curso) return '—';
    const match = curso.match(/^(\d+)/);
    if (!match) return '—';
    const grade = parseInt(match[1], 10);
    if (grade < 1 || grade > 8) return '—';
    const expiryYear = new Date().getFullYear() + (8 - grade);
    return `12/${String(expiryYear).slice(2)}`;
}

const AT = {
    navy:    '#16285A',
    navyD:   '#0E1B40',
    gold:    '#F2C233',
    goldD:   '#D9A91A',
    red:     '#C8102E',
    cream:   '#FBF6E7',
    ink:     '#0B1430',
};

// ── Tarjetas para impresión (escala 600×424 → 7.5cm×5.3cm) ───────────────────
// La inner div es 600×424 px escalada con transform; el wrapper tiene dimensiones físicas en cm.
// En pantalla: 7.5cm ≈ 283px. En impresión: exactamente 7.5cm.

function PrintCardFront({ student }) {
    return (
        <div style={{ width:'7.5cm', height:'5.3cm', overflow:'hidden', position:'relative', flexShrink:0, borderRadius:'0.35cm' }}>
            <div style={{ position:'absolute', top:0, left:0, width:600, height:424, transform:'scale(0.4724)', transformOrigin:'top left', background:AT.navy, fontFamily:"'Fredoka', system-ui, sans-serif", color:'#fff' }}>
                <div style={{ position:'absolute', right:-120, top:-120, width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(242,194,51,0.33) 0%, rgba(242,194,51,0.13) 35%, transparent 65%)' }} />
                <svg style={{ position:'absolute', right:-100, top:-100, width:440, height:440, opacity:0.35 }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#F2C233" strokeWidth="0.4" strokeDasharray="0.6 1.2" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F2C233" strokeWidth="0.3" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#F2C233" strokeWidth="0.3" strokeDasharray="2 1" />
                </svg>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }} viewBox="0 0 600 424" preserveAspectRatio="none">
                    <defs>
                        <radialGradient id="ryMaskPF" cx="78%" cy="42%" r="60%">
                            <stop offset="0%" stopColor="white" stopOpacity="1" /><stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                        <mask id="rysMaskPF"><rect width="600" height="424" fill="url(#ryMaskPF)" /></mask>
                    </defs>
                    <g mask="url(#rysMaskPF)" stroke="#F2C233" strokeWidth="1.2">
                        <line x1="468" y1="178" x2="968" y2="178" /><line x1="468" y1="178" x2="936" y2="349" />
                        <line x1="468" y1="178" x2="818" y2="496" /><line x1="468" y1="178" x2="618" y2="657" />
                        <line x1="468" y1="178" x2="381" y2="671" /><line x1="468" y1="178" x2="155" y2="554" />
                        <line x1="468" y1="178" x2="-21" y2="356" /><line x1="468" y1="178" x2="-32" y2="178" />
                        <line x1="468" y1="178" x2="0" y2="7" /><line x1="468" y1="178" x2="118" y2="-140" />
                        <line x1="468" y1="178" x2="318" y2="-301" /><line x1="468" y1="178" x2="555" y2="-315" />
                        <line x1="468" y1="178" x2="781" y2="-198" /><line x1="468" y1="178" x2="957" y2="0" />
                    </g>
                </svg>
                <img src="/logo_eyr.png" alt="" style={{ position:'absolute', right:18, top:60, width:220, height:220, objectFit:'contain', filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.45)) drop-shadow(0 0 24px rgba(242,194,51,0.35))' }} />
                <div style={{ position:'absolute', top:22, left:28, right:250 }}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:2.5, color:AT.gold }}>CENTRO EDUCACIONAL</div>
                    <div style={{ fontSize:17, fontWeight:700, lineHeight:1.05, marginTop:4, color:'#fff' }}>Ernesto Yáñez Rivera</div>
                    <div style={{ fontSize:10, fontWeight:500, marginTop:3, color:'rgba(255,255,255,0.7)', letterSpacing:1 }}>N° 1353 · TARJETA ESCOLAR</div>
                </div>
                <div style={{ position:'absolute', top:112, left:28, display:'inline-flex', alignItems:'baseline', gap:2, background:AT.gold, color:AT.navyD, padding:'6px 14px 7px', borderRadius:8 }}>
                    <span style={{ fontSize:22, fontWeight:700, lineHeight:1 }}>EYR</span>
                    <span style={{ fontSize:18, fontWeight:700, lineHeight:1 }}>·</span>
                    <span style={{ fontSize:22, fontWeight:700, lineHeight:1 }}>pesos</span>
                </div>
                <div style={{ position:'absolute', top:168, left:28, display:'flex', alignItems:'center', gap:8 }}>
                    <svg width="58" height="44" viewBox="0 0 58 44">
                        <rect x="1" y="1" width="56" height="42" rx="8" fill="#F2C233" stroke="#0E1B40" strokeWidth="2" />
                        <path d="M 1 22 H 14 M 44 22 H 57 M 22 1 V 12 M 22 32 V 43 M 36 1 V 12 M 36 32 V 43" stroke="#0E1B40" strokeWidth="2" fill="none" />
                        <rect x="14" y="12" width="30" height="20" rx="3" fill="none" stroke="#0E1B40" strokeWidth="2" />
                        <line x1="14" y1="22" x2="44" y2="22" stroke="#0E1B40" strokeWidth="1.5" />
                        <line x1="29" y1="12" x2="29" y2="32" stroke="#0E1B40" strokeWidth="1.5" />
                    </svg>
                    <svg width="24" height="28" viewBox="0 0 24 28">
                        <path d="M 4 6 Q 12 14 4 22" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <path d="M 10 4 Q 20 14 10 24" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <path d="M 16 2 Q 28 14 16 26" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
                <div style={{ position:'absolute', top:232, left:28, width:360, fontFamily:"'JetBrains Mono', monospace", fontSize:21, fontWeight:700, letterSpacing:1.5, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.55)' }}>
                    {student.rut || '—'}
                </div>
                <div style={{ position:'absolute', bottom:18, left:18, right:18, background:AT.cream, borderRadius:14, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1.5px solid ${AT.gold}` }}>
                    <div>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:AT.red }}>ESTUDIANTE</div>
                        <div style={{ fontSize:21, fontWeight:700, marginTop:2, color:AT.navyD, lineHeight:1.05 }}>{(student.fullName||'').toUpperCase()}</div>
                        {student.curso && <div style={{ fontSize:11, fontWeight:600, color:AT.navyD, opacity:0.85, marginTop:2 }}>{student.curso.toUpperCase()}</div>}
                    </div>
                    <div style={{ textAlign:'right', borderLeft:`2px solid ${AT.gold}`, paddingLeft:14 }}>
                        <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:AT.red }}>VÁLIDA</div>
                        <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:17, fontWeight:700, marginTop:2, color:AT.navyD }}>{calcValidDate(student.curso)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrintCardBack({ student }) {
    const url = `${window.location.origin}/kiosko/${student.id}`;
    return (
        <div style={{ width:'7.5cm', height:'5.3cm', overflow:'hidden', position:'relative', flexShrink:0, borderRadius:'0.35cm' }}>
            <div style={{ position:'absolute', top:0, left:0, width:600, height:424, transform:'scale(0.4724)', transformOrigin:'top left', background:AT.cream, fontFamily:"'Fredoka', system-ui, sans-serif", color:AT.navyD }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:16, background:AT.red }} />
                <div style={{ position:'absolute', top:16, left:0, right:0, height:3, background:AT.gold }} />
                <div style={{ position:'absolute', top:44, left:0, right:0, height:52, background:'#000' }} />
                <div style={{ position:'absolute', top:128, left:28, right:28, height:50, background:'#fff', borderRadius:6, border:`1.5px solid ${AT.navy}`, display:'flex', alignItems:'center', padding:'0 14px' }}>
                    <div style={{ flex:1, height:22, background:'repeating-linear-gradient(45deg, #e8e2cf, #e8e2cf 4px, #fff 4px, #fff 8px)', borderRadius:3, marginRight:12 }} />
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:14, fontWeight:700, color:AT.navyD, background:AT.gold, padding:'4px 10px', borderRadius:4 }}>
                        CVV {student.rut ? student.rut.replace(/[^0-9]/g,'').slice(-3) : '???'}
                    </div>
                </div>
                <div style={{ position:'absolute', top:198, left:28, right:28+108+12, fontSize:13, lineHeight:1.55, fontWeight:500, color:AT.navyD }}>
                    Tarjeta personal del Centro Educacional Ernesto Yáñez Rivera N°1353. Los EYR-pesos se ganan con logros académicos, conducta y proyectos. Canjeables en kiosco y tienda escolar.
                </div>
                <div style={{ position:'absolute', top:198, right:28, width:108, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ background:'#fff', padding:6, borderRadius:8, border:`1.5px solid ${AT.navy}`, lineHeight:0 }}>
                        <QRCodeSVG value={url} size={90} level="M" />
                    </div>
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:1.5, color:AT.navy, opacity:0.6 }}>KIOSCO EYR</div>
                </div>
                <div style={{ position:'absolute', bottom:22, left:28, right:28+108+12, display:'flex', alignItems:'flex-end', gap:8 }}>
                    <img src="/logo_eyr.png" alt="" style={{ width:32, height:32, objectFit:'contain' }} />
                    <div style={{ fontSize:10, opacity:0.85, lineHeight:1.5, fontWeight:500, color:AT.navyD }}>
                        <div>Si me pierdes, llévame a Inspectoría</div>
                        <div>eyr.cl/pesos · {new Date().getFullYear()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Vista de impresión de tarjetas del curso ──────────────────────────────────
// Frentes en la primera sección, reversos (orden espejado por fila para dúplex) en la segunda.
function PrintCourseView({ roster, courseName, onClose }) {
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'print-course-style';
        style.textContent = `
            @media print {
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                #root { display: none !important; }
                #print-course-overlay {
                    position: static !important;
                    overflow: visible !important;
                    background: white !important;
                    padding: 0 !important;
                }
                .no-print { display: none !important; }
                @page { size: A4 portrait; margin: 12mm; }
            }
        `;
        document.head.appendChild(style);
        return () => document.getElementById('print-course-style')?.remove();
    }, []);

    return createPortal(
        <div id="print-course-overlay" style={{ position:'fixed', inset:0, zIndex:9999, background:'#ebe7df', overflowY:'auto' }}>

            {/* Barra de herramientas */}
            <div className="no-print" style={{ position:'sticky', top:0, background:'#fff', borderBottom:'1.5px solid #e0ddd6', padding:'10px 20px', display:'flex', alignItems:'center', gap:10, zIndex:10 }}>
                <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1.5px solid #ddd', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', color:'#666' }}>
                    <X size={13} /> Cerrar
                </button>
                <span style={{ fontSize:13, fontWeight:700, color:'#333', flex:1 }}>
                    Tarjetas · {courseName} · {roster.length} alumnos
                </span>
                <button onClick={() => window.print()} style={{ display:'flex', alignItems:'center', gap:6, background:AT.navy, border:'none', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'inherit' }}>
                    <Printer size={14} /> Imprimir / Guardar PDF
                </button>
            </div>

            {/* Pares frente + reverso, uno por alumno */}
            <div style={{ padding:'10mm 12mm', display:'flex', flexDirection:'column', gap:'6mm', alignItems:'flex-start' }}>
                {roster.map(s => (
                    <div key={s.id} style={{ display:'flex', gap:'4mm', alignItems:'stretch', pageBreakInside:'avoid', breakInside:'avoid' }}>
                        <PrintCardFront student={s} />
                        <PrintCardBack student={s} />
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
}

function QrModal({ student, onClose }) {
    const url = `${window.location.origin}/kiosko/${student.id}`;
    const [flipped, setFlipped] = useState(false);

    function handleDownload() {
        const svg = document.getElementById('qr-svg-export');
        if (!svg) return;
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const canvas = document.createElement('canvas');
        const SIZE = 400;
        canvas.width = SIZE; canvas.height = SIZE + 80;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, (SIZE - 280) / 2, 20, 280, 280);
            ctx.fillStyle = AT.ink;
            ctx.font = 'bold 15px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(student.fullName, SIZE / 2, 330);
            ctx.font = '13px system-ui';
            ctx.fillStyle = '#8a8499';
            ctx.fillText(student.curso || '', SIZE / 2, 352);
            const link = document.createElement('a');
            link.download = `QR_${student.fullName.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    }

    // Dimensiones: proporción 600×424 del diseño original, escalado a 480px de ancho
    const CW = 480;
    const CH = Math.round(CW * 424 / 600); // ~339 px
    const scale = CW / 600;

    // Escala una medida del diseño original (en px base 600×424)
    const s = (v) => Math.round(v * scale);

    return createPortal(
        <div
            onClick={onClose}
            style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(14,27,64,0.72)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:16 }}
        >
            {/* Botón cerrar */}
            <button
                onClick={onClose}
                style={{ alignSelf:'flex-end', marginRight:`calc(50% - ${CW/2}px)`, width:32, height:32, display:'grid', placeItems:'center', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', cursor:'pointer', borderRadius:10, backdropFilter:'blur(4px)' }}
            >
                <X size={16} />
            </button>

            {/* Flip card */}
            <div
                onClick={e => { e.stopPropagation(); setFlipped(f => !f); }}
                style={{ perspective:1200, width:CW, height:CH, cursor:'pointer', flexShrink:0 }}
            >
                <div style={{
                    width:'100%', height:'100%',
                    position:'relative',
                    transformStyle:'preserve-3d',
                    transition:'transform 0.7s cubic-bezier(.4,0,.2,1)',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>

                    {/* ── CARA FRONTAL — Tarjeta Antorcha ───────────────── */}
                    <div style={{
                        position:'absolute', inset:0,
                        backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                        background:AT.navy,
                        borderRadius:s(28),
                        overflow:'hidden',
                        boxShadow:'0 20px 50px -20px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.18)',
                        fontFamily:"'Fredoka', system-ui, sans-serif",
                        color:'#fff',
                    }}>
                        {/* Halo dorado */}
                        <div style={{
                            position:'absolute', right:s(-120), top:s(-120),
                            width:s(520), height:s(520),
                            borderRadius:'50%',
                            background:'radial-gradient(circle, rgba(242,194,51,0.33) 0%, rgba(242,194,51,0.13) 35%, transparent 65%)',
                        }} />

                        {/* Anillos concéntricos */}
                        <svg style={{ position:'absolute', right:s(-100), top:s(-100), width:s(440), height:s(440), opacity:0.35 }} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#F2C233" strokeWidth="0.4" strokeDasharray="0.6 1.2" />
                            <circle cx="50" cy="50" r="38" fill="none" stroke="#F2C233" strokeWidth="0.3" />
                            <circle cx="50" cy="50" r="32" fill="none" stroke="#F2C233" strokeWidth="0.3" strokeDasharray="2 1" />
                        </svg>

                        {/* Rayos de luz */}
                        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }} viewBox="0 0 600 424" preserveAspectRatio="none">
                            <defs>
                                <radialGradient id="rayMaskAt" cx="78%" cy="42%" r="60%">
                                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                                </radialGradient>
                                <mask id="raysMaskAt">
                                    <rect width="600" height="424" fill="url(#rayMaskAt)" />
                                </mask>
                            </defs>
                            <g mask="url(#raysMaskAt)" stroke="#F2C233" strokeWidth="1.2">
                                <line x1="468" y1="178" x2="968" y2="178" />
                                <line x1="468" y1="178" x2="936" y2="349" />
                                <line x1="468" y1="178" x2="818" y2="496" />
                                <line x1="468" y1="178" x2="618" y2="657" />
                                <line x1="468" y1="178" x2="381" y2="671" />
                                <line x1="468" y1="178" x2="155" y2="554" />
                                <line x1="468" y1="178" x2="-21" y2="356" />
                                <line x1="468" y1="178" x2="-32" y2="178" />
                                <line x1="468" y1="178" x2="0" y2="7" />
                                <line x1="468" y1="178" x2="118" y2="-140" />
                                <line x1="468" y1="178" x2="318" y2="-301" />
                                <line x1="468" y1="178" x2="555" y2="-315" />
                                <line x1="468" y1="178" x2="781" y2="-198" />
                                <line x1="468" y1="178" x2="957" y2="0" />
                            </g>
                        </svg>

                        {/* Escudo */}
                        <img
                            src={logoEyr}
                            alt="Escudo EYR"
                            style={{ position:'absolute', right:s(18), top:s(60), width:s(220), height:s(220), objectFit:'contain', filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.45)) drop-shadow(0 0 24px rgba(242,194,51,0.35))' }}
                        />

                        {/* Encabezado escuela */}
                        <div style={{ position:'absolute', top:s(22), left:s(28), right:s(250) }}>
                            <div style={{ fontSize:s(9), fontWeight:700, letterSpacing:2.5, color:AT.gold }}>CENTRO EDUCACIONAL</div>
                            <div style={{ fontSize:s(17), fontWeight:700, lineHeight:1.05, marginTop:s(4), color:'#fff' }}>Ernesto Yáñez Rivera</div>
                            <div style={{ fontSize:s(10), fontWeight:500, marginTop:s(3), color:'rgba(255,255,255,0.7)', letterSpacing:1 }}>N° 1353 · TARJETA ESCOLAR</div>
                        </div>

                        {/* Badge EYR·pesos */}
                        <div style={{ position:'absolute', top:s(112), left:s(28), display:'inline-flex', alignItems:'baseline', gap:2, background:AT.gold, color:AT.navyD, padding:`${s(6)}px ${s(14)}px ${s(7)}px`, borderRadius:s(8), boxShadow:'0 4px 12px rgba(217,169,26,0.25)' }}>
                            <span style={{ fontSize:s(22), fontWeight:700, lineHeight:1, letterSpacing:-0.3 }}>EYR</span>
                            <span style={{ fontSize:s(18), fontWeight:700, lineHeight:1 }}>·</span>
                            <span style={{ fontSize:s(22), fontWeight:700, lineHeight:1, letterSpacing:-0.3 }}>pesos</span>
                        </div>

                        {/* Chip + NFC */}
                        <div style={{ position:'absolute', top:s(168), left:s(28), display:'flex', alignItems:'center', gap:s(8) }}>
                            <svg width={s(58)} height={s(44)} viewBox="0 0 58 44">
                                <rect x="1" y="1" width="56" height="42" rx="8" fill="#F2C233" stroke="#0E1B40" strokeWidth="2" />
                                <path d="M 1 22 H 14 M 44 22 H 57 M 22 1 V 12 M 22 32 V 43 M 36 1 V 12 M 36 32 V 43" stroke="#0E1B40" strokeWidth="2" fill="none" />
                                <rect x="14" y="12" width="30" height="20" rx="3" fill="none" stroke="#0E1B40" strokeWidth="2" />
                                <line x1="14" y1="22" x2="44" y2="22" stroke="#0E1B40" strokeWidth="1.5" />
                                <line x1="29" y1="12" x2="29" y2="32" stroke="#0E1B40" strokeWidth="1.5" />
                            </svg>
                            <svg width={s(24)} height={s(28)} viewBox="0 0 24 28">
                                <path d="M 4 6 Q 12 14 4 22" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <path d="M 10 4 Q 20 14 10 24" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <path d="M 16 2 Q 28 14 16 26" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* Número de tarjeta = RUT */}
                        <div style={{ position:'absolute', top:s(232), left:s(28), width:s(360), fontFamily:"'JetBrains Mono', monospace", fontSize:s(21), fontWeight:700, letterSpacing:1.5, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.55)' }}>
                            {student.rut || '—'}
                        </div>

                        {/* Panel del estudiante */}
                        <div style={{
                            position:'absolute', bottom:s(18), left:s(18), right:s(18),
                            background:AT.cream,
                            borderRadius:s(14),
                            padding:`${s(10)}px ${s(16)}px`,
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            boxShadow:'0 6px 14px rgba(0,0,0,0.25)',
                            border:`1.5px solid ${AT.gold}`,
                        }}>
                            <div>
                                <div style={{ fontSize:s(9), fontWeight:700, letterSpacing:1.5, color:AT.red }}>ESTUDIANTE</div>
                                <div style={{ fontSize:s(21), fontWeight:700, marginTop:s(2), color:AT.navyD, lineHeight:1.05, fontFamily:"'Fredoka', system-ui, sans-serif" }}>
                                    {(student.fullName || '').toUpperCase()}
                                </div>
                                {student.curso && (
                                    <div style={{ fontSize:s(11), fontWeight:600, color:AT.navyD, opacity:0.85, marginTop:s(2) }}>
                                        {student.curso.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign:'right', borderLeft:`2px solid ${AT.gold}`, paddingLeft:s(14) }}>
                                <div style={{ fontSize:s(9), fontWeight:700, letterSpacing:1.5, color:AT.red }}>VÁLIDA</div>
                                <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:s(17), fontWeight:700, marginTop:s(2), color:AT.navyD }}>{calcValidDate(student.curso)}</div>
                            </div>
                        </div>

                        {/* Hint flip */}
                        <div style={{ position:'absolute', bottom:s(4), left:0, right:0, textAlign:'center', fontSize:s(9), color:'rgba(255,255,255,0.35)', letterSpacing:1 }}>
                            toca para ver reverso
                        </div>
                    </div>

                    {/* ── CARA TRASERA — Reverso Antorcha ───────────────── */}
                    <div style={{
                        position:'absolute', inset:0,
                        backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                        transform:'rotateY(180deg)',
                        background:AT.cream,
                        borderRadius:s(28),
                        overflow:'hidden',
                        boxShadow:'0 20px 50px -20px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.12)',
                        fontFamily:"'Fredoka', system-ui, sans-serif",
                        color:AT.navyD,
                    }}>
                        {/* Franja roja */}
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:s(16), background:AT.red }} />
                        {/* Franja dorada */}
                        <div style={{ position:'absolute', top:s(16), left:0, right:0, height:s(3), background:AT.gold }} />
                        {/* Banda magnética */}
                        <div style={{ position:'absolute', top:s(44), left:0, right:0, height:s(52), background:'#000' }} />

                        {/* Panel de firma */}
                        <div style={{
                            position:'absolute', top:s(128), left:s(28), right:s(28), height:s(50),
                            background:'#fff', borderRadius:s(6),
                            border:`1.5px solid ${AT.navy}`,
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:`0 ${s(14)}px`,
                        }}>
                            <div style={{
                                flex:1, height:s(22),
                                background:'repeating-linear-gradient(45deg, #e8e2cf, #e8e2cf 4px, #fff 4px, #fff 8px)',
                                borderRadius:s(3), marginRight:s(12),
                            }} />
                            <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:s(14), fontWeight:700, color:AT.navyD, background:AT.gold, padding:`${s(4)}px ${s(10)}px`, borderRadius:s(4) }}>
                                CVV {student.rut ? student.rut.replace(/[^0-9]/g, '').slice(-3) : '???'}
                            </div>
                        </div>

                        {/* Texto legal — columna izquierda */}
                        <div style={{ position:'absolute', top:s(198), left:s(28), right:s(28+108+12), fontSize:s(12), lineHeight:1.55, color:AT.navyD, fontWeight:500 }}>
                            Tarjeta personal del Centro Educacional Ernesto Yáñez Rivera N°1353. Los EYR-pesos se ganan con logros académicos, conducta y proyectos. Canjeables en kiosco y tienda escolar.
                        </div>

                        {/* QR — columna derecha */}
                        <div style={{
                            position:'absolute', top:s(198), right:s(28),
                            width:s(108), display:'flex', flexDirection:'column', alignItems:'center', gap:s(6),
                        }}>
                            <div style={{ background:'#fff', padding:s(6), borderRadius:s(8), border:`1.5px solid ${AT.navy}`, lineHeight:0 }}>
                                <QRCodeSVG id="qr-svg-export" value={url} size={s(90)} level="M" />
                            </div>
                            <div style={{ fontSize:s(8), fontWeight:700, letterSpacing:1.5, color:AT.navy, opacity:0.6 }}>KIOSCO EYR</div>
                        </div>

                        {/* Pie */}
                        <div style={{ position:'absolute', bottom:s(22), left:s(28), right:s(28+108+12), display:'flex', alignItems:'flex-end', gap:s(8) }}>
                            <img src={logoEyr} alt="Escudo" style={{ width:s(32), height:s(32), objectFit:'contain', flexShrink:0 }} />
                            <div style={{ fontSize:s(10), opacity:0.85, lineHeight:1.5, fontWeight:500, color:AT.navyD }}>
                                <div>Si me pierdes, llévame a Inspectoría</div>
                                <div>eyr.cl/pesos · {new Date().getFullYear()}</div>
                            </div>
                        </div>

                        {/* Hint flip */}
                        <div style={{ position:'absolute', bottom:s(4), left:0, right:0, textAlign:'center', fontSize:s(9), color:'rgba(14,27,64,0.3)', letterSpacing:1 }}>
                            toca para ver frente
                        </div>
                    </div>
                </div>
            </div>

            {/* Descargar QR */}
            <button
                onClick={e => { e.stopPropagation(); handleDownload(); }}
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:10, padding:'9px 20px', cursor:'pointer', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'inherit', backdropFilter:'blur(4px)' }}
            >
                <Download size={14} /> Descargar QR
            </button>
        </div>
    , document.body);
}

// ── Modal DAR estrellas ───────────────────────────────────────────────────────
function GiveCoinsModal({ student, onClose, onGive }) {
    const { bonusEvents } = useContext(RulesCtx);
    const [selected, setSelected] = useState(null);
    const [manualAmount, setManualAmount] = useState(5);
    const [saving, setSaving] = useState(false);

    const amount = selected ? selected.amount : manualAmount;
    const nota   = selected ? selected.label : `Dar ${manualAmount} estrellas`;

    const handleGive = async () => {
        setSaving(true);
        try { await onGive(student, amount, nota); }
        finally { setSaving(false); }
    };

    return createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.35)', backdropFilter:'blur(2px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, padding:28, width:360, maxWidth:'calc(100vw - 32px)', boxShadow:'0 20px 60px rgba(26,35,64,0.2)', zIndex:1 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.yellowL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>⭐</div>
                    <div>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Dar estrellas</div>
                        <div style={{ fontSize:13, color:C.text2 }}>{student.fullName}</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.text3, padding:4, display:'flex', borderRadius:8, fontSize:18 }}>✕</button>
                </div>

                {/* Bonificaciones */}
                <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Motivo</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {bonusEvents.map(ev => {
                            const active = selected?.key === ev.key;
                            return (
                                <button key={ev.key} onClick={() => setSelected(active ? null : ev)}
                                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:10, border:`2px solid ${active ? C.blue : C.border}`, background:active ? C.blueL : '#f8f9fc', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                                    <div style={{ width:14, height:14, borderRadius:99, border:`2px solid ${active ? C.blue : C.text3}`, background:active ? C.blue : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        {active && <div style={{ width:5, height:5, background:'#fff', borderRadius:99 }} />}
                                    </div>
                                    <span style={{ flex:1, fontSize:13, fontWeight:active ? 700 : 500, color:active ? C.blueD : C.text }}>{ev.label}</span>
                                    <span style={{ fontSize:12, fontWeight:800, color:C.greenD, background:C.greenL, borderRadius:99, padding:'2px 9px' }}>+{ev.amount}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Monto manual */}
                <div style={{ marginBottom:22 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8f9fc', borderRadius:10, padding:'8px 14px' }}
                        onClick={() => selected && setSelected(null)}>
                        <span style={{ fontSize:13, color:C.text2, fontWeight:700 }}>Otro:</span>
                        <input type="number" min="1" max="999" value={manualAmount}
                            onChange={e => { setSelected(null); setManualAmount(Number(e.target.value) || 1); }}
                            style={{ border:'none', background:'transparent', outline:'none', fontSize:18, fontWeight:800, color:C.text, width:60, fontFamily:'inherit' }} />
                        <span style={{ fontSize:13, color:C.text3 }}>estrellas</span>
                    </div>
                </div>

                <button onClick={handleGive} disabled={saving}
                    style={{ width:'100%', background:C.blue, color:'#fff', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving ? 0.7 : 1 }}>
                    ⭐ Dar {amount} estrella{amount !== 1 ? 's' : ''} a {student.fullName.split(' ')[0]}
                </button>
            </div>
        </div>
    , document.body);
}

// ── Modal DESCONTAR estrellas ─────────────────────────────────────────────────
function TakeCoinsModal({ student, currentCoins, onClose, onTake }) {
    const { penaltyEvents } = useContext(RulesCtx);
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
        const nota = selected.perUnit ? `${selected.label} (×${qty})` : selected.label;
        try { await onTake(student, totalAmount, nota); }
        finally { setSaving(false); }
    };

    return createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.35)', backdropFilter:'blur(2px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, padding:28, width:380, maxWidth:'calc(100vw - 32px)', boxShadow:'0 20px 60px rgba(26,35,64,0.2)', zIndex:1 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.redL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>🔻</div>
                    <div>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Descontar estrellas</div>
                        <div style={{ fontSize:13, color:C.text2 }}>{student.fullName}</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.text3, padding:4, fontSize:18 }}>✕</button>
                </div>

                {/* Saldo actual */}
                <div style={{ background:'#f8f9fc', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text2 }}>Saldo actual</span>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:16 }}>⭐</span>
                        <span style={{ fontSize:18, fontWeight:900, color:C.text }}>{currentCoins}</span>
                    </div>
                </div>

                {/* Penalizaciones */}
                <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Tipo de penalización</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {penaltyEvents.map(ev => {
                            const active = selected?.key === ev.key;
                            return (
                                <button key={ev.key} onClick={() => { setSelected(active ? null : ev); setQty(1); }}
                                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:10, border:`2px solid ${active ? C.red : C.border}`, background:active ? C.redL : '#f8f9fc', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                                    <div style={{ width:14, height:14, borderRadius:99, border:`2px solid ${active ? C.red : C.text3}`, background:active ? C.red : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        {active && <div style={{ width:5, height:5, background:'#fff', borderRadius:99 }} />}
                                    </div>
                                    <span style={{ flex:1, fontSize:13, fontWeight:active ? 700 : 500, color:active ? C.redD : C.text }}>{ev.label}</span>
                                    <span style={{ fontSize:12, fontWeight:800, color:C.redD, background:C.redL, borderRadius:99, padding:'2px 9px', whiteSpace:'nowrap' }}>
                                        -{ev.amount}{ev.perUnit ? ' c/u' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cantidad */}
                {selected?.perUnit && (
                    <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Cantidad</div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8f9fc', borderRadius:10, padding:'8px 14px' }}>
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text2, flexShrink:0 }}>
                                <Minus size={14} />
                            </button>
                            <span style={{ flex:1, textAlign:'center', fontSize:20, fontWeight:900, color:C.text }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)}
                                style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text2, flexShrink:0 }}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Resumen */}
                {selected && (
                    <div style={{ background:C.redL, borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.redD }}>Total a descontar</span>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:17, fontWeight:900, color:C.redD }}>-{totalAmount} ⭐</span>
                            <span style={{ fontSize:11, color:C.text2, marginLeft:4 }}>→ saldo: {newBalance}</span>
                        </div>
                    </div>
                )}

                <button onClick={handleTake} disabled={saving || !selected}
                    style={{ width:'100%', background:selected ? C.red : '#e2e6f0', color:selected ? '#fff' : C.text3, border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:800, cursor:selected ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving ? 0.7 : 1 }}>
                    🔻 {selected ? `Descontar ${totalAmount} estrella${totalAmount !== 1 ? 's' : ''}` : 'Selecciona un tipo'}
                </button>
            </div>
        </div>
    , document.body);
}

// ── Drawer historial ──────────────────────────────────────────────────────────
function MovementsDrawer({ student, coins, transacciones, onClose, color }) {
    const { tiers } = useContext(RulesCtx);
    if (!student) return null;
    const tierData = getTier(coins, tiers);
    const tier = { ...tierData, ...(TIER_PALETTE[tierData.id] ?? TIER_PALETTE[1]) };
    const headerColor = color ?? { main: C.blue, dark: C.blueD };
    return (
        <div style={{ position:'fixed', inset:0, zIndex:150, display:'flex', alignItems:'stretch', justifyContent:'flex-end' }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(26,35,64,0.2)' }} />
            <div style={{ width:340, background:'#fff', display:'flex', flexDirection:'column', position:'relative', zIndex:1, boxShadow:'-8px 0 40px rgba(26,35,64,0.12)' }}>
                {/* Header */}
                <div style={{ background: headerColor.main, padding:'24px 22px 20px', position:'relative', overflow:'hidden' }}>
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
                                {student.curso && <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>{student.curso}</div>}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#fff', fontSize:14, fontWeight:700 }}>✕</button>
                    </div>
                    <div style={{ marginTop:20, display:'flex', gap:20 }}>
                        <div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Saldo</div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:30, fontWeight:900, color:'#fff' }}>{coins}</span>
                                <span style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>⭐</span>
                            </div>
                        </div>
                        <div style={{ width:1, background:'rgba(255,255,255,0.2)' }} />
                        <div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Nivel</div>
                            <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{tier.label}</div>
                        </div>
                    </div>
                </div>

                {/* Historial */}
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
                    <div style={{ fontSize:11, fontWeight:800, color:C.text2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Historial de movimientos</div>
                    {transacciones.length === 0 ? (
                        <div style={{ textAlign:'center', color:C.text3, fontSize:13, padding:'40px 0' }}>Sin movimientos registrados.</div>
                    ) : transacciones.map((m, i) => {
                        const pos = m.tipo === 'ingreso';
                        return (
                            <div key={m.id || i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                                <div style={{ width:36, height:36, borderRadius:99, background: pos ? C.greenL : C.redL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                                    {pos ? '⭐' : '🔻'}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.nota || (pos ? 'Ingreso' : 'Egreso')}</div>
                                    <div style={{ fontSize:11, color:C.text3 }}>{formatFecha(m.fecha)} · {m.registradoPor}</div>
                                </div>
                                <div style={{ fontSize:14, fontWeight:800, color: pos ? C.greenD : C.redD, flexShrink:0 }}>
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

const thStyle  = { padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#9BA5BE', letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:'2px solid rgba(26,35,64,0.08)' };

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
    const [qrModal, setQrModal] = useState(null);
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
                                                <button onClick={() => setQrModal(s)} style={{ display:'flex', alignItems:'center', background:'#f4f6fb', border:'none', borderRadius:8, padding:'6px 9px', cursor:'pointer', color:C.text2, fontFamily:'inherit' }} title="Ver QR">
                                                    <QrCode size={13} />
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
                <MovementsDrawer student={drawer} coins={estrellas[drawer.id] ?? 0}
                    transacciones={getTransaccionesAlumno(drawer.id)} onClose={() => setDrawer(null)} />
            )}
            {giveModal && <GiveCoinsModal student={giveModal} onClose={() => setGiveModal(null)} onGive={handleGive} />}
            {takeModal && <TakeCoinsModal student={takeModal} currentCoins={estrellas[takeModal.id] ?? 0} onClose={() => setTakeModal(null)} onTake={handleTake} />}
            {qrModal && <QrModal student={qrModal} onClose={() => setQrModal(null)} />}
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
        </div>
    );
}

// ── Vista detalle curso ───────────────────────────────────────────────────────
function CourseDetailView({ course, color, onBack, estrellas, registrarMovimiento, getTransaccionesAlumno }) {
    const { tiers } = useContext(RulesCtx);
    const tier2Min  = tiers.find(t => t.id === 2)?.minCoins ?? 30;
    const [searchSt, setSearchSt] = useState('');
    const [filterActive, setFilterActive] = useState('todos');
    const [sortBy, setSortBy] = useState('coins');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [drawer, setDrawer] = useState(null);
    const [giveModal, setGiveModal] = useState(null);
    const [takeModal, setTakeModal] = useState(null);
    const [qrModal, setQrModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [printingCards, setPrintingCards] = useState(false);

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
    const destacadosCount = roster.filter(s => s.coins >= tier2Min).length;
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
                <button
                    onClick={() => setPrintingCards(true)}
                    style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:AT.navy, border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'inherit' }}
                >
                    <Printer size={14} /> Imprimir tarjetas
                </button>
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
                                                <button onClick={e => { e.stopPropagation(); setQrModal(s); }} style={{ display:'flex', alignItems:'center', background:'#f4f6fb', border:'none', borderRadius:8, padding:'6px 9px', cursor:'pointer', color:C.text2, fontFamily:'inherit' }} title="Ver QR">
                                                    <QrCode size={13} />
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
                <MovementsDrawer student={drawer} coins={estrellas[drawer.id] ?? 0}
                    transacciones={getTransaccionesAlumno(drawer.id)} onClose={() => setDrawer(null)} color={color} />
            )}
            {giveModal && <GiveCoinsModal student={giveModal} onClose={() => setGiveModal(null)} onGive={handleGive} />}
            {takeModal && <TakeCoinsModal student={takeModal} currentCoins={estrellas[takeModal.id] ?? 0} onClose={() => setTakeModal(null)} onTake={handleTake} />}
            {qrModal && <QrModal student={qrModal} onClose={() => setQrModal(null)} />}
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
            {printingCards && (
                <PrintCourseView
                    roster={roster}
                    courseName={course.name}
                    onClose={() => setPrintingCards(false)}
                />
            )}
        </div>
    );
}

// ── Vista lista de cursos ─────────────────────────────────────────────────────
function CourseListView({ courses, onSelectCourse }) {
    const { tiers } = useContext(RulesCtx);
    const tier2Min  = tiers.find(t => t.id === 2)?.minCoins ?? 30;
    const [filterLevel, setFilterLevel] = useState('Todos');
    const [search, setSearch] = useState('');

    const totalStudents  = courses.reduce((a, c) => a + c.alumnos.length, 0);
    const totalActive    = courses.reduce((a, c) => a + c.alumnos.filter(s => c.coinsMap[s.id] > 0).length, 0);
    const totalCoins     = courses.reduce((a, c) => a + c.alumnos.reduce((s, st) => s + (c.coinsMap[st.id] ?? 0), 0), 0);
    const avgCoins       = totalStudents > 0 ? Math.round(totalCoins / totalStudents) : 0;
    const totalDestacados = courses.reduce((a, c) => a + c.alumnos.filter(s => (c.coinsMap[s.id] ?? 0) >= tier2Min).length, 0);

    const filtered = courses.filter(c => {
        const ms = c.name.toLowerCase().includes(search.toLowerCase());
        const ml = filterLevel === 'Todos' || c.level === filterLevel;
        return ms && ml;
    });

    const topKpis = [
        { Icon: Users,  label:'Total alumnos',   value:totalStudents,   sub:`${courses.length} cursos`,                                                       bg:C.blueL,   color:C.blue,    fill:false },
        { Icon: Zap,    label:'Alumnos activos',  value:totalActive,     sub:`${totalStudents>0?Math.round(totalActive/totalStudents*100):0}% participación`,   bg:C.greenL,  color:C.greenD,  fill:false },
        { Icon: Star,   label:'Prom. estrellas',  value:avgCoins,        sub:'por alumno',                                                                     bg:C.yellowL, color:C.yellowD, fill:true  },
        { Icon: Award,  label:'Nivel Destacado+', value:totalDestacados, sub:`≥${tier2Min} estrellas`,                                                bg:C.purpleL, color:C.purpleD, fill:false },
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
                    const destC   = c.alumnos.filter(st => (c.coinsMap[st.id] ?? 0) >= tier2Min).length;
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

// ── Modal agregar / editar producto (Kiosko) ─────────────────────────────────
function ProductFormModal({ producto, onClose, onSave }) {
    const { tiers } = useContext(RulesCtx);
    const isNew = !producto?.id;
    const [draft, setDraft] = useState(() => producto
        ? { ...producto }
        : { sku: `EYR-${crypto.randomUUID().slice(0,6).toUpperCase()}`, nombre:'', descripcion:'', categoria:'', tier:1, precio:20, stock:10, stockMinimo:2, activo:true }
    );
    const [saving, setSaving] = useState(false);
    const catSuggestions = TIER_CATEGORIES[draft.tier] ?? [];

    async function handleSave() {
        if (!draft.nombre.trim()) return;
        setSaving(true);
        try { await onSave(draft); }
        finally { setSaving(false); }
    }

    const tierLabel = tiers.find(t => t.id === draft.tier)?.label ?? {3:'Excelencia',2:'Destacado',1:'Regular'}[draft.tier];

    return createPortal(
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:EYR.overlay, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ width:500, maxWidth:'100%', background:'#fff', borderRadius:22, border:`1px solid ${EYR.line}`, boxShadow:EYR.shadowLg, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 32px)', flexShrink:0 }}>
                <div style={{ height:6, flexShrink:0, background:EYR.stripe }} />

                <div style={{ padding:'20px 24px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${EYR.line}`, flexShrink:0 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:EYR.priS, display:'grid', placeItems:'center', flexShrink:0 }}>
                        <ShoppingBag size={20} color={EYR.pri} />
                    </div>
                    <div style={{ flex:1 }}>
                        <div style={{ fontSize:18, fontWeight:700, color:EYR.ink }}>{isNew ? 'Nuevo producto' : 'Editar producto'}</div>
                        <div style={{ fontSize:12, color:EYR.ink2 }}>Kiosko · Nivel {tierLabel}</div>
                    </div>
                    <button onClick={onClose} style={{ width:32, height:32, display:'grid', placeItems:'center', background:'none', border:'none', color:EYR.ink2, cursor:'pointer', borderRadius:8 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding:'20px 24px', overflowY:'auto', flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:14 }}>
                    {/* SKU + Nombre */}
                    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:10 }}>
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>SKU</label>
                            <input value={draft.sku || ''} onChange={e => setDraft(d => ({ ...d, sku: e.target.value }))}
                                style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${EYR.line}`, outline:'none', fontSize:13, color:EYR.ink, fontFamily:'monospace', background:'#f8f9fc', boxSizing:'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Nombre *</label>
                            <input value={draft.nombre} onChange={e => setDraft(d => ({ ...d, nombre: e.target.value }))}
                                placeholder="Ej: Guitarra eléctrica"
                                style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${draft.nombre ? EYR.pri : EYR.line}`, outline:'none', fontSize:14, color:EYR.ink, fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }} />
                        </div>
                    </div>

                    {/* Tier */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Nivel</label>
                        <div style={{ display:'flex', gap:8 }}>
                            {[3,2,1].map(id => {
                                const pal = TIER_PALETTE[id];
                                const lbl = tiers.find(t => t.id === id)?.label ?? {3:'Excelencia',2:'Destacado',1:'Regular'}[id];
                                const active = draft.tier === id;
                                return (
                                    <button key={id} onClick={() => setDraft(d => ({ ...d, tier: id, categoria: '' }))}
                                        style={{ flex:1, padding:'8px 10px', borderRadius:10, border:`2px solid ${active ? pal.color : EYR.line}`, background:active ? pal.colorL : '#fafafa', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                                        <pal.TierIcon size={12} color={pal.colorD} />
                                        <span style={{ fontSize:12, fontWeight:700, color:pal.colorD }}>{lbl}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Categoría</label>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                            {catSuggestions.map(s => (
                                <button key={s} onClick={() => setDraft(d => ({ ...d, categoria: s }))}
                                    style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:99, border:`1.5px solid ${draft.categoria === s ? EYR.pri : EYR.line}`, background:draft.categoria === s ? EYR.priS : '#fafafa', color:draft.categoria === s ? EYR.pri : EYR.ink2, cursor:'pointer', fontFamily:'inherit' }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <input value={draft.categoria} onChange={e => setDraft(d => ({ ...d, categoria: e.target.value }))}
                            placeholder="O escribe una categoría"
                            style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${EYR.line}`, outline:'none', fontSize:13, color:EYR.ink, fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }} />
                    </div>

                    {/* Precio */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Precio (★)</label>
                        <div style={{ display:'flex', alignItems:'center', gap:5, background:'#f8f9fc', borderRadius:9, padding:'6px 10px', border:`1.5px solid ${EYR.line}` }}>
                            <button onClick={() => setDraft(d => ({ ...d, precio: Math.max(1, d.precio - 5) }))}
                                style={{ width:24, height:24, borderRadius:6, background:'#fff', border:`1px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2, flexShrink:0 }}>
                                <Minus size={11} />
                            </button>
                            <input type="number" min="1" value={draft.precio} onChange={e => setDraft(d => ({ ...d, precio: Number(e.target.value) || 1 }))}
                                style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:15, fontWeight:800, color:EYR.ink, textAlign:'center', fontFamily:'inherit', minWidth:0 }} />
                            <button onClick={() => setDraft(d => ({ ...d, precio: d.precio + 5 }))}
                                style={{ width:24, height:24, borderRadius:6, background:'#fff', border:`1px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2, flexShrink:0 }}>
                                <Plus size={11} />
                            </button>
                        </div>
                    </div>

                    {/* Stock inicial + Stock mín. */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Stock inicial</label>
                            <div style={{ display:'flex', alignItems:'center', gap:5, background:'#f8f9fc', borderRadius:9, padding:'6px 10px', border:`1.5px solid ${EYR.line}` }}>
                                <button onClick={() => setDraft(d => ({ ...d, stock: Math.max(0, d.stock - 1) }))}
                                    style={{ width:24, height:24, borderRadius:6, background:'#fff', border:`1px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2, flexShrink:0 }}>
                                    <Minus size={11} />
                                </button>
                                <input type="number" min="0" value={draft.stock} onChange={e => setDraft(d => ({ ...d, stock: Number(e.target.value) || 0 }))}
                                    style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:15, fontWeight:800, color:EYR.ink, textAlign:'center', fontFamily:'inherit', minWidth:0 }} />
                                <button onClick={() => setDraft(d => ({ ...d, stock: d.stock + 1 }))}
                                    style={{ width:24, height:24, borderRadius:6, background:'#fff', border:`1px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2, flexShrink:0 }}>
                                    <Plus size={11} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Stock mín.</label>
                            <input type="number" min="0" value={draft.stockMinimo} onChange={e => setDraft(d => ({ ...d, stockMinimo: Number(e.target.value) || 0 }))}
                                style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${EYR.line}`, outline:'none', fontSize:14, fontWeight:700, color:EYR.ink, fontFamily:'inherit', background:'#f8f9fc', boxSizing:'border-box' }} />
                        </div>
                    </div>

                    {/* Activo toggle */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f8f9fc', borderRadius:10 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:EYR.ink, flex:1 }}>Producto activo (visible en el kiosko)</span>
                        <button onClick={() => setDraft(d => ({ ...d, activo: !d.activo }))}
                            style={{ background:'none', border:'none', cursor:'pointer', color:draft.activo ? EYR.pri : EYR.ink3, display:'flex', padding:0 }}>
                            {draft.activo ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                        </button>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>
                            Descripción <span style={{ color:EYR.ink3, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span>
                        </label>
                        <textarea value={draft.descripcion || ''} onChange={e => setDraft(d => ({ ...d, descripcion: e.target.value }))}
                            rows={2} placeholder="Detalles del artículo..."
                            style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${EYR.line}`, outline:'none', fontSize:13, color:EYR.ink, fontFamily:'inherit', resize:'vertical', background:'#fff', boxSizing:'border-box' }} />
                    </div>
                </div>

                <div style={{ padding:'16px 24px', borderTop:`1px solid ${EYR.line}`, display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center', flexShrink:0 }}>
                    <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:`1.5px solid ${EYR.line}`, background:'#fff', color:EYR.ink2, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center' }}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={!draft.nombre.trim() || saving}
                        style={{ padding:'9px 20px', borderRadius:10, background:draft.nombre.trim() ? EYR.pri : '#e5e7eb', color:'#fff', border:'1.5px solid transparent', fontWeight:700, fontSize:13, cursor:draft.nombre.trim() ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, opacity:saving ? 0.7 : 1 }}>
                        <Save size={14} /> {saving ? 'Guardando…' : isNew ? 'Agregar producto' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}

// ── Modal ajustar stock ────────────────────────────────────────────────────────
function StockModal({ producto, onClose, onAdjust }) {
    const [delta, setDelta] = useState(0);
    const [saving, setSaving] = useState(false);
    const newStock = Math.max(0, (producto.stock ?? 0) + delta);
    const presets = [+10, +5, +1, -1, -5, -10];

    async function handleConfirm() {
        if (delta === 0) { onClose(); return; }
        setSaving(true);
        try { await onAdjust(producto.id, delta); onClose(); }
        finally { setSaving(false); }
    }

    return createPortal(
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:EYR.overlay, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ width:360, background:'#fff', borderRadius:22, border:`1px solid ${EYR.line}`, boxShadow:EYR.shadowLg, overflow:'hidden' }}>
                <div style={{ height:6, background:EYR.stripe }} />
                <div style={{ padding:'20px 24px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${EYR.line}` }}>
                    <div style={{ width:40, height:40, borderRadius:11, background:`${EYR.amber}22`, display:'grid', placeItems:'center', flexShrink:0 }}>
                        <Package size={18} color={EYR.amber} />
                    </div>
                    <div style={{ flex:1 }}>
                        <div style={{ fontSize:16, fontWeight:700, color:EYR.ink }}>Ajustar stock</div>
                        <div style={{ fontSize:12, color:EYR.ink2, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{producto.nombre}</div>
                    </div>
                    <button onClick={onClose} style={{ width:30, height:30, display:'grid', placeItems:'center', background:'none', border:'none', color:EYR.ink2, cursor:'pointer', borderRadius:8 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', background:'#f8f9fc', borderRadius:10, padding:'10px 16px' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:EYR.ink2 }}>Stock actual</span>
                        <span style={{ fontSize:16, fontWeight:900, color:EYR.ink }}>{producto.stock ?? 0}</span>
                    </div>

                    <div>
                        <div style={{ fontSize:10, fontWeight:800, color:EYR.ink3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Ajuste rápido</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                            {presets.map(p => {
                                const isPos = p > 0;
                                const active = delta === p;
                                return (
                                    <button key={p} onClick={() => setDelta(d => d === p ? 0 : p)}
                                        style={{ padding:'8px 0', borderRadius:9, border:`2px solid ${active ? (isPos ? EYR.pri : EYR.accent) : EYR.line}`, background:active ? (isPos ? EYR.priS : `${EYR.accent}22`) : '#fafafa', color:active ? (isPos ? EYR.pri : EYR.accent) : EYR.ink2, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                                        {isPos ? `+${p}` : p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize:10, fontWeight:800, color:EYR.ink3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>O ingresa manualmente</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <button onClick={() => setDelta(d => d - 1)} style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2 }}>
                                <Minus size={13} />
                            </button>
                            <input type="number" value={delta} onChange={e => setDelta(Number(e.target.value))}
                                style={{ flex:1, border:`1.5px solid ${EYR.line}`, borderRadius:9, padding:'8px 12px', outline:'none', fontSize:16, fontWeight:800, color:delta > 0 ? EYR.pri : delta < 0 ? EYR.accent : EYR.ink, textAlign:'center', fontFamily:'inherit' }} />
                            <button onClick={() => setDelta(d => d + 1)} style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2 }}>
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>

                    {delta !== 0 && (
                        <div style={{ background:delta > 0 ? EYR.priS : `${EYR.accent}22`, borderRadius:10, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:12, fontWeight:700, color:delta > 0 ? EYR.pri : EYR.accent }}>Nuevo stock</span>
                            <span style={{ fontSize:18, fontWeight:900, color:delta > 0 ? EYR.pri : EYR.accent }}>{newStock}</span>
                        </div>
                    )}
                </div>

                <div style={{ padding:'16px 24px', borderTop:`1px solid ${EYR.line}`, display:'flex', gap:10, justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:`1.5px solid ${EYR.line}`, background:'#fff', color:EYR.ink2, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} disabled={delta === 0 || saving}
                        style={{ padding:'9px 20px', borderRadius:10, background:delta !== 0 ? EYR.pri : '#e5e7eb', color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:delta !== 0 ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, opacity:saving ? 0.7 : 1 }}>
                        <Check size={14} /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}

// ── Modal oferta ───────────────────────────────────────────────────────────────
function OfertaModal({ producto, onClose, onSave }) {
    const hasOffer = !!(producto.precioOferta && producto.ofertaHasta);
    const [oferta, setOferta] = useState(producto.precioOferta || Math.max(1, Math.floor((producto.precio || 20) * 0.8)));
    const [hasta, setHasta] = useState(producto.ofertaHasta || '');
    const [saving, setSaving] = useState(false);
    const descPct = producto.precio > 0 ? Math.round((1 - oferta / producto.precio) * 100) : 0;

    async function handleSave(remove) {
        setSaving(true);
        try {
            await onSave(producto.id, remove
                ? { precioOferta: null, ofertaHasta: null }
                : { precioOferta: oferta, ofertaHasta: hasta || null }
            );
            onClose();
        } finally { setSaving(false); }
    }

    return createPortal(
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:EYR.overlay, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ width:380, background:'#fff', borderRadius:22, border:`1px solid ${EYR.line}`, boxShadow:EYR.shadowLg, overflow:'hidden' }}>
                <div style={{ height:6, background:EYR.stripe }} />
                <div style={{ padding:'20px 24px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${EYR.line}` }}>
                    <div style={{ width:40, height:40, borderRadius:11, background:`${EYR.accent}22`, display:'grid', placeItems:'center', flexShrink:0 }}>
                        <Percent size={18} color={EYR.accent} />
                    </div>
                    <div style={{ flex:1 }}>
                        <div style={{ fontSize:16, fontWeight:700, color:EYR.ink }}>Establecer oferta</div>
                        <div style={{ fontSize:12, color:EYR.ink2, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{producto.nombre}</div>
                    </div>
                    <button onClick={onClose} style={{ width:30, height:30, display:'grid', placeItems:'center', background:'none', border:'none', color:EYR.ink2, cursor:'pointer', borderRadius:8 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', background:'#f8f9fc', borderRadius:10, padding:'10px 16px' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:EYR.ink2 }}>Precio normal</span>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ fontSize:16, fontWeight:900, color:EYR.ink }}>{producto.precio}</span>
                            <Star size={13} fill={C.yellow} color={C.yellow} />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Precio de oferta (★)</label>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <button onClick={() => setOferta(o => Math.max(1, o - 1))} style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2 }}>
                                <Minus size={13} />
                            </button>
                            <input type="number" min="1" value={oferta} onChange={e => setOferta(Number(e.target.value) || 1)}
                                style={{ flex:1, border:`1.5px solid ${EYR.accent}`, borderRadius:9, padding:'8px 12px', outline:'none', fontSize:18, fontWeight:900, color:EYR.accent, textAlign:'center', fontFamily:'inherit' }} />
                            <button onClick={() => setOferta(o => o + 1)} style={{ width:32, height:32, borderRadius:8, background:'#fff', border:`1.5px solid ${EYR.line}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:EYR.ink2 }}>
                                <Plus size={13} />
                            </button>
                        </div>
                        {oferta < producto.precio && (
                            <div style={{ marginTop:6 }}>
                                <span style={{ fontSize:12, fontWeight:800, color:EYR.accent, background:`${EYR.accent}18`, borderRadius:99, padding:'2px 10px' }}>
                                    -{descPct}% descuento
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize:11, fontWeight:700, color:EYR.ink2, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>
                            Válida hasta <span style={{ color:EYR.ink3, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span>
                        </label>
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                            style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${EYR.line}`, outline:'none', fontSize:13, color:EYR.ink, fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }} />
                    </div>
                </div>

                <div style={{ padding:'16px 24px', borderTop:`1px solid ${EYR.line}`, display:'flex', gap:10 }}>
                    {hasOffer && (
                        <button onClick={() => handleSave(true)} disabled={saving}
                            style={{ padding:'9px 14px', borderRadius:10, border:`1.5px solid ${EYR.accent}`, background:'#fff', color:EYR.accent, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                            Quitar oferta
                        </button>
                    )}
                    <div style={{ flex:1 }} />
                    <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:10, border:`1.5px solid ${EYR.line}`, background:'#fff', color:EYR.ink2, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        Cancelar
                    </button>
                    <button onClick={() => handleSave(false)} disabled={oferta <= 0 || saving}
                        style={{ padding:'9px 20px', borderRadius:10, background:EYR.accent, color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, opacity:saving ? 0.7 : 1 }}>
                        <Tag size={14} /> Aplicar oferta
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}

// ── Kiosko e-commerce ─────────────────────────────────────────────────────────
function KioskoView() {
    const { productos, loadingProductos, addProducto, updateProducto, deleteProducto, adjustStock } = useIncentivoEYR();
    const { tiers } = useContext(RulesCtx);
    const { user, isManagement } = useAuth();
    const canCRUD = isManagement(user);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [search, setSearch]         = useState('');
    const [filterTier, setFilterTier] = useState(0);
    const [filterEstado, setFilterEstado] = useState('todos');
    const [productModal, setProductModal] = useState(null);
    const [stockModal, setStockModal]     = useState(null);
    const [ofertaModal, setOfertaModal]   = useState(null);
    const [confirmDel, setConfirmDel]     = useState(null);

    const displayed = useMemo(() => {
        let list = [...productos];
        if (search) list = list.filter(p =>
            p.nombre.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase())
        );
        if (filterTier) list = list.filter(p => p.tier === filterTier);
        if (filterEstado === 'activos')    list = list.filter(p => p.activo !== false);
        if (filterEstado === 'inactivos')  list = list.filter(p => p.activo === false);
        if (filterEstado === 'oferta')     list = list.filter(p => !!(p.precioOferta && p.precioOferta < p.precio && (!p.ofertaHasta || p.ofertaHasta >= today)));
        if (filterEstado === 'stock_bajo') list = list.filter(p => (p.stock ?? 0) <= (p.stockMinimo ?? 2));
        return list;
    }, [productos, search, filterTier, filterEstado, today]);

    const totalActivos   = productos.filter(p => p.activo !== false).length;
    const totalOferta    = productos.filter(p => !!(p.precioOferta && p.precioOferta < p.precio && (!p.ofertaHasta || p.ofertaHasta >= today))).length;
    const totalStockBajo = productos.filter(p => (p.stock ?? 0) <= (p.stockMinimo ?? 2)).length;

    async function handleSaveProduct(draft) {
        if (draft.id) {
            const { id, creadoEn: _c, actualizadoEn: _a, ...changes } = draft;
            await updateProducto(id, changes);
        } else {
            await addProducto(draft);
        }
        setProductModal(null);
    }

    async function handleSaveOferta(id, changes) {
        await updateProducto(id, changes);
    }

    async function handleDelete(p) {
        await deleteProducto(p.id, p.nombre);
        setConfirmDel(null);
    }

    const kpis = [
        { label:'Total',      value:productos.length, color:EYR.ink,    bg:'#f4f6fb'            },
        { label:'Activos',    value:totalActivos,      color:EYR.pri,    bg:EYR.priS             },
        { label:'En oferta',  value:totalOferta,       color:EYR.accent, bg:`${EYR.accent}18`    },
        { label:'Stock bajo', value:totalStockBajo,    color:EYR.amber,  bg:`${EYR.amber}22`     },
    ];

    return (
        <div style={{ padding:'24px 26px', background:EYR.bg, minHeight:'100%', overflowY:'auto' }}>
            <div style={{ background:'#fff', borderRadius:22, border:`1px solid ${EYR.line}`, boxShadow:EYR.shadowMd, overflow:'hidden' }}>
                <div style={{ height:6, background:EYR.stripe }} />

                {/* Header */}
                <div style={{ padding:'20px 26px 16px', borderBottom:`1px solid ${EYR.line}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:16 }}>
                        <div style={{ width:44, height:44, borderRadius:13, background:EYR.priS, display:'grid', placeItems:'center', flexShrink:0 }}>
                            <ShoppingBag size={22} color={EYR.pri} />
                        </div>
                        <div style={{ flex:1 }}>
                            <div style={{ fontSize:20, fontWeight:700, color:EYR.ink, letterSpacing:'-0.3px' }}>Kiosko de Canje</div>
                            <div style={{ fontSize:12, color:EYR.ink2 }}>{productos.length} producto{productos.length !== 1 ? 's' : ''} registrados</div>
                        </div>
                        {canCRUD && (
                            <button onClick={() => setProductModal({})}
                                style={{ display:'flex', alignItems:'center', gap:6, background:EYR.pri, color:'#fff', border:'none', borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                                <Plus size={15} /> Agregar producto
                            </button>
                        )}
                    </div>

                    {/* KPIs */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                        {kpis.map(k => (
                            <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span style={{ fontSize:11, fontWeight:700, color:k.color, opacity:0.8 }}>{k.label}</span>
                                <span style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Filtros */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f4f6fb', borderRadius:10, padding:'0 12px', height:36, flex:1, minWidth:160 }}>
                            <Search size={14} color={EYR.ink3} />
                            <input placeholder="Buscar por nombre o SKU…" value={search} onChange={e => setSearch(e.target.value)}
                                style={{ border:'none', background:'transparent', outline:'none', fontSize:13, width:'100%', fontFamily:'inherit', color:EYR.ink }} />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:EYR.ink3, display:'flex', padding:0 }}>
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                        <div style={{ display:'flex', gap:4, background:'#f4f6fb', borderRadius:10, padding:3 }}>
                            {[{ v:0, l:'Todos' }, ...([3,2,1].map(id => ({ v:id, l:tiers.find(t=>t.id===id)?.label ?? {3:'Exc',2:'Dest',1:'Reg'}[id] })))].map(({ v, l }) => (
                                <button key={v} onClick={() => setFilterTier(v)}
                                    style={{ padding:'5px 12px', borderRadius:8, border:'none', background:filterTier===v?'#fff':'transparent', color:filterTier===v?EYR.ink:EYR.ink3, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', boxShadow:filterTier===v?'0 1px 4px rgba(31,42,46,.1)':'none', whiteSpace:'nowrap' }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <div style={{ display:'flex', gap:4, background:'#f4f6fb', borderRadius:10, padding:3 }}>
                            {[['todos','Todos'],['activos','Activos'],['inactivos','Inactivos'],['oferta','Oferta'],['stock_bajo','Stock bajo']].map(([v, l]) => (
                                <button key={v} onClick={() => setFilterEstado(v)}
                                    style={{ padding:'5px 12px', borderRadius:8, border:'none', background:filterEstado===v?'#fff':'transparent', color:filterEstado===v?EYR.ink:EYR.ink3, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', boxShadow:filterEstado===v?'0 1px 4px rgba(31,42,46,.1)':'none', whiteSpace:'nowrap' }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loadingProductos ? (
                    <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
                        {Array.from({length:6}).map((_,i) => (
                            <div key={i} style={{ height:200, background:EYR.bg, borderRadius:14, border:`1px solid ${EYR.line}` }} />
                        ))}
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{ padding:'60px 0', textAlign:'center', color:EYR.ink3, fontSize:14 }}>
                        {productos.length === 0 ? 'No hay productos en el kiosko aún.' : 'Sin resultados para el filtro actual.'}
                        {canCRUD && productos.length === 0 && (
                            <div style={{ marginTop:12 }}>
                                <button onClick={() => setProductModal({})}
                                    style={{ background:EYR.pri, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                    + Agregar primer producto
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
                        {displayed.map(p => {
                            const pal = TIER_PALETTE[p.tier] ?? TIER_PALETTE[1];
                            const ofertaActiva = !!(p.precioOferta && p.precioOferta < p.precio && (!p.ofertaHasta || p.ofertaHasta >= today));
                            const precioMostrado = ofertaActiva ? p.precioOferta : p.precio;
                            const stockBajo = (p.stock ?? 0) <= (p.stockMinimo ?? 2);
                            const inactivo = p.activo === false;
                            const tierLabel = tiers.find(t => t.id === p.tier)?.label ?? {3:'Excelencia',2:'Destacado',1:'Regular'}[p.tier ?? 1];
                            return (
                                <div key={p.id}
                                    style={{ background:'#fff', border:`1.5px solid ${inactivo ? EYR.line : stockBajo ? EYR.amber : pal.color+'44'}`, borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', opacity:inactivo ? 0.65 : 1, boxShadow:'0 2px 8px rgba(57,32,110,.06)', transition:'box-shadow .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(57,32,110,.14)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(57,32,110,.06)'}>
                                    <div style={{ height:4, background:inactivo ? EYR.line : pal.color }} />
                                    <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                                        {/* Badges */}
                                        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                            {p.sku && <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, color:EYR.ink3, background:'#f4f6fb', borderRadius:6, padding:'2px 7px' }}>{p.sku}</span>}
                                            <span style={{ fontSize:10, fontWeight:800, color:pal.colorD, background:pal.colorL, borderRadius:99, padding:'2px 8px', display:'inline-flex', alignItems:'center', gap:3 }}>
                                                <pal.TierIcon size={9} /> {tierLabel}
                                            </span>
                                            {ofertaActiva && <span style={{ fontSize:10, fontWeight:800, color:EYR.accent, background:`${EYR.accent}18`, borderRadius:99, padding:'2px 8px' }}>OFERTA</span>}
                                            {inactivo && <span style={{ fontSize:10, fontWeight:800, color:EYR.ink3, background:'#f0f2f7', borderRadius:99, padding:'2px 8px' }}>INACTIVO</span>}
                                        </div>
                                        {/* Nombre */}
                                        <div style={{ fontSize:15, fontWeight:700, color:EYR.ink, lineHeight:1.3, flex:1 }}>{p.nombre}</div>
                                        {p.categoria && <div style={{ fontSize:11, color:EYR.ink2, fontWeight:600 }}>{p.categoria}</div>}
                                        {/* Precio */}
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                                <span style={{ fontSize:22, fontWeight:900, color:ofertaActiva ? EYR.accent : EYR.ink, letterSpacing:'-0.03em' }}>{precioMostrado}</span>
                                                <Star size={14} fill={C.yellow} color={C.yellow} />
                                            </div>
                                            {ofertaActiva && <span style={{ fontSize:13, color:EYR.ink3, textDecoration:'line-through' }}>{p.precio}</span>}
                                        </div>
                                        {/* Stock */}
                                        <div>
                                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                                <span style={{ fontSize:10, fontWeight:700, color:stockBajo ? EYR.amber : EYR.ink3, textTransform:'uppercase' }}>
                                                    {stockBajo ? '⚠ Stock bajo' : 'Stock'}
                                                </span>
                                                <span style={{ fontSize:11, fontWeight:800, color:stockBajo ? EYR.amber : EYR.ink2 }}>{p.stock ?? 0}</span>
                                            </div>
                                            <div style={{ height:5, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
                                                <div style={{ width:`${Math.min(100, ((p.stock ?? 0) / Math.max(10, (p.stock ?? 0) + (p.stockMinimo ?? 2))) * 100)}%`, height:'100%', background:stockBajo ? EYR.amber : EYR.pri, borderRadius:99 }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Acciones */}
                                    {canCRUD && (
                                        <div style={{ padding:'10px 12px', borderTop:`1px solid ${EYR.line}`, display:'flex', gap:5, background:EYR.bg }}>
                                            {confirmDel === p.id ? (
                                                <>
                                                    <span style={{ fontSize:12, color:EYR.ink2, fontWeight:600, flex:1, display:'flex', alignItems:'center' }}>¿Eliminar?</span>
                                                    <button onClick={() => handleDelete(p)} style={{ fontSize:11, fontWeight:700, padding:'5px 10px', borderRadius:7, background:'#FEE2E2', border:'none', color:'#dc2626', cursor:'pointer', fontFamily:'inherit' }}>Sí</button>
                                                    <button onClick={() => setConfirmDel(null)} style={{ fontSize:11, fontWeight:700, padding:'5px 10px', borderRadius:7, background:'#f4f6fb', border:'none', color:EYR.ink2, cursor:'pointer', fontFamily:'inherit' }}>No</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => setProductModal(p)} style={{ flex:1, height:30, borderRadius:8, background:EYR.priS, border:'none', color:EYR.pri, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                                                        <Pencil size={12} /> Editar
                                                    </button>
                                                    <button onClick={() => setStockModal(p)} style={{ flex:1, height:30, borderRadius:8, background:`${EYR.amber}22`, border:'none', color:EYR.amber, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                                                        <Package size={12} /> Stock
                                                    </button>
                                                    <button onClick={() => setOfertaModal(p)} style={{ flex:1, height:30, borderRadius:8, background:`${EYR.accent}18`, border:'none', color:EYR.accent, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                                                        <Percent size={12} /> Oferta
                                                    </button>
                                                    <button onClick={() => setConfirmDel(p.id)} style={{ width:30, height:30, borderRadius:8, background:'#FEE2E2', border:'none', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {productModal !== null && (
                <ProductFormModal
                    producto={productModal?.id ? productModal : null}
                    onClose={() => setProductModal(null)}
                    onSave={handleSaveProduct}
                />
            )}
            {stockModal && <StockModal producto={stockModal} onClose={() => setStockModal(null)} onAdjust={adjustStock} />}
            {ofertaModal && <OfertaModal producto={ofertaModal} onClose={() => setOfertaModal(null)} onSave={handleSaveOferta} />}
        </div>
    );
}

// ── Panel de configuración de reglas ─────────────────────────────────────────
function ConfigView() {
    const { config, saveConfig } = useIncentivoEYR();
    const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(config)));
    const [saving, setSaving] = useState(false);

    // Sincronizar draft si otro usuario guardó cambios en Firestore
    React.useEffect(() => {
        setDraft(JSON.parse(JSON.stringify(config)));
    }, [config]);

    const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

    function setTierMin(id, val) {
        if (id === 1) return; // Regular siempre en 0
        setDraft(d => ({ ...d, tiers: d.tiers.map(t => t.id === id ? { ...t, minCoins: Math.max(1, val) } : t) }));
    }
    function setBonusAmount(key, val) {
        setDraft(d => ({ ...d, bonusEvents: d.bonusEvents.map(ev => ev.key === key ? { ...ev, amount: Math.max(1, val) } : ev) }));
    }
    function setPenaltyAmount(key, val) {
        setDraft(d => ({ ...d, penaltyEvents: d.penaltyEvents.map(ev => ev.key === key ? { ...ev, amount: Math.max(1, val) } : ev) }));
    }

    async function handleSave() {
        setSaving(true);
        try { await saveConfig(draft); }
        finally { setSaving(false); }
    }

    const sortedTiers = [...draft.tiers].sort((a, b) => b.id - a.id);

    const sectionStyle = { background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:16, padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 };
    const labelStyle   = { fontSize:10, fontWeight:800, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em' };
    const rowStyle     = { display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8f9fc', borderRadius:10 };
    const numInput     = (val, onChange, disabled) => (
        <div style={{ display:'flex', alignItems:'center', gap:6, background:disabled?'#f0f2f7':'#fff', border:`1.5px solid ${C.border}`, borderRadius:9, padding:'4px 10px', minWidth:90 }}>
            <input type="number" min="1" max="9999" value={val} disabled={disabled}
                onChange={e => onChange(Number(e.target.value) || 1)}
                style={{ border:'none', background:'transparent', outline:'none', fontSize:15, fontWeight:800, color:disabled?C.text3:C.text, width:50, fontFamily:'inherit', textAlign:'center', cursor:disabled?'not-allowed':'text' }} />
            <Star size={12} fill={disabled?C.text3:C.yellow} color={disabled?C.text3:C.yellow} />
        </div>
    );

    return (
        <div style={{ padding:'24px 26px', display:'flex', flexDirection:'column', gap:18, maxWidth:680 }}>

            {/* Niveles (Tiers) */}
            <div style={sectionStyle}>
                <div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:3 }}>Niveles del sistema</div>
                    <div style={{ fontSize:12, color:C.text2 }}>Estrellas mínimas para desbloquear cada nivel de recompensas del Kiosko.</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    {sortedTiers.map(t => {
                        const pal = TIER_PALETTE[t.id] ?? TIER_PALETTE[1];
                        const locked = t.id === 1;
                        return (
                            <div key={t.id} style={{ background:pal.colorL, borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, border:`2px solid ${pal.color}22` }}>
                                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                    <pal.TierIcon size={16} color={pal.colorD} />
                                    <span style={{ fontSize:13, fontWeight:800, color:pal.colorD }}>Nivel {t.label}</span>
                                </div>
                                <div>
                                    <div style={{ ...labelStyle, color:pal.colorD, marginBottom:6 }}>Mínimo de estrellas</div>
                                    {numInput(t.minCoins, val => setTierMin(t.id, val), locked)}
                                    {locked && <div style={{ fontSize:10, color:C.text3, marginTop:4 }}>Nivel base, siempre 0</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bonificaciones */}
            <div style={sectionStyle}>
                <div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:3 }}>Bonificaciones semanales</div>
                    <div style={{ fontSize:12, color:C.text2 }}>Estrellas que se suman al cumplir cada condición en la semana.</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {draft.bonusEvents.map(ev => (
                        <div key={ev.key} style={rowStyle}>
                            <div style={{ width:10, height:10, borderRadius:99, background:C.green, flexShrink:0 }} />
                            <span style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{ev.label}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:11, fontWeight:700, color:C.greenD }}>+</span>
                                {numInput(ev.amount, val => setBonusAmount(ev.key, val), false)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Penalizaciones */}
            <div style={sectionStyle}>
                <div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:3 }}>Penalizaciones</div>
                    <div style={{ fontSize:12, color:C.text2 }}>Estrellas que se descuentan por cada evento negativo registrado.</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {draft.penaltyEvents.map(ev => (
                        <div key={ev.key} style={rowStyle}>
                            <div style={{ width:10, height:10, borderRadius:99, background:C.red, flexShrink:0 }} />
                            <span style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{ev.label}</span>
                            {ev.perUnit && (
                                <span style={{ fontSize:10, fontWeight:700, color:C.text3, background:'#f0f2f7', borderRadius:6, padding:'2px 7px' }}>por unidad</span>
                            )}
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:11, fontWeight:700, color:C.redD }}>-</span>
                                {numInput(ev.amount, val => setPenaltyAmount(ev.key, val), false)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón guardar */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={handleSave} disabled={!isDirty || saving}
                    style={{ display:'flex', alignItems:'center', gap:8, background:isDirty?C.blue:'#e5e7eb', color:'#fff', border:'none', borderRadius:12, padding:'12px 22px', fontSize:14, fontWeight:800, cursor:isDirty?'pointer':'not-allowed', fontFamily:'inherit', opacity:saving?0.7:1 }}>
                    <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                {isDirty && (
                    <button onClick={() => setDraft(JSON.parse(JSON.stringify(config)))}
                        style={{ fontSize:13, fontWeight:700, color:C.text2, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                        Descartar
                    </button>
                )}
                {!isDirty && !saving && (
                    <span style={{ fontSize:12, color:C.text3, fontWeight:600 }}>Sin cambios pendientes</span>
                )}
            </div>
        </div>
    );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function IncentivoEYRView() {
    const { students, loading: loadingStudents } = useStudents();
    const { estrellas, config, loading: loadingEstrellas, registrarMovimiento, getTransaccionesAlumno } = useIncentivoEYR();
    const { user, isManagement } = useAuth();
    const canConfig = isManagement(user);

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

    const TABS = [
        { key:'cursos',  label:'Por curso', Icon: GraduationCap },
        { key:'alumnos', label:'Alumnos',   Icon: LayoutList },
        { key:'kiosko',  label:'Kiosko',    Icon: Gift },
        ...(canConfig ? [{ key:'config', label:'Configuración', Icon: Settings }] : []),
    ];

    return (
        <RulesCtx.Provider value={config}>
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

                <div style={{ display:'flex', gap:2, background:'#f4f6fb', borderRadius:12, padding:4 }}>
                    {TABS.map(t => (
                        <button key={t.key}
                            onClick={() => { setTab(t.key); if (t.key === 'cursos') { setView('list'); setSelectedCourse(null); } }}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:'none', background:tab===t.key?'#fff':'transparent', color:tab===t.key?C.text:C.text3, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:tab===t.key?'0 1px 4px rgba(26,35,64,0.1)':'none', transition:'all .12s' }}>
                            <t.Icon size={15} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {tab === 'config' ? (
                <ConfigView />
            ) : tab === 'kiosko' ? (
                <KioskoView />
            ) : tab === 'alumnos' ? (
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
        </RulesCtx.Provider>
    );
}
