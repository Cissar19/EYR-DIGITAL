import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import {
    doc, getDoc, onSnapshot, writeBatch, collection,
    serverTimestamp, increment,
} from 'firebase/firestore';
import { Star, ShoppingBag, Trophy, Award, CheckCircle2, AlertTriangle, X } from 'lucide-react';

// ── Paleta (misma que IncentivoEYRView) ──────────────────────────────────────
const P = {
    pri:    '#7c5cff',
    priS:   '#efe9ff',
    priD:   '#5e3df0',
    acc:    '#ec4899',
    accS:   '#ffe4f1',
    amb:    '#f5a524',
    ambS:   '#fff3da',
    ink:    '#1b1530',
    ink2:   '#4a4366',
    ink3:   '#8a8499',
    bg:     '#f6f4fb',
    line:   '#ece9f3',
    red:    '#ef4444',
    redS:   '#fee2e2',
    green:  '#22c55e',
    greenS: '#dcfce7',
    stripe: 'linear-gradient(90deg,#7c5cff,#ec4899,#f5a524)',
};

const TIER_PALETTE = {
    3: { color: P.amb,  colorS: P.ambS, Icon: Trophy,  label: 'Excelencia' },
    2: { color: P.acc,  colorS: P.accS, Icon: Award,   label: 'Destacado'  },
    1: { color: P.pri,  colorS: P.priS, Icon: Star,    label: 'Regular'    },
};

function getTier(coins, tiers) {
    const sorted = [...tiers].sort((a, b) => b.minCoins - a.minCoins);
    return sorted.find(t => coins >= t.minCoins) ?? sorted[sorted.length - 1];
}

function getEffectivePrice(p, today) {
    if (p.precioOferta && p.precioOferta < p.precio && (!p.ofertaHasta || p.ofertaHasta >= today)) {
        return p.precioOferta;
    }
    return p.precio;
}

// ── Pantallas de estado ───────────────────────────────────────────────────────
function Spinner() {
    return (
        <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg }}>
            <div style={{ textAlign:'center' }}>
                <div style={{ width:40, height:40, border:`3px solid ${P.line}`, borderTopColor:P.pri, borderRadius:'50%', margin:'0 auto 14px', animation:'spin 0.8s linear infinite' }} />
                <p style={{ color:P.ink3, fontSize:14 }}>Cargando…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

function ErrorScreen({ msg }) {
    return (
        <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg, padding:24 }}>
            <div style={{ textAlign:'center', maxWidth:320 }}>
                <AlertTriangle size={40} color={P.ink3} style={{ margin:'0 auto 12px' }} />
                <h2 style={{ fontSize:17, fontWeight:800, color:P.ink, marginBottom:6 }}>Alumno no encontrado</h2>
                <p style={{ fontSize:13, color:P.ink3 }}>{msg || 'Este código QR no corresponde a ningún alumno activo.'}</p>
            </div>
        </div>
    );
}

// ── Modal de confirmación de compra ──────────────────────────────────────────
function ConfirmModal({ producto, precio, saldo, onConfirm, onClose, buying }) {
    const canBuy = saldo >= precio;
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(27,21,48,.5)', backdropFilter:'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:480, background:'#fff', borderRadius:'22px 22px 0 0', padding:'28px 24px 36px', boxShadow:'0 -8px 40px rgba(27,21,48,.18)' }}>
                {/* Barra gradiente */}
                <div style={{ height:4, background:P.stripe, borderRadius:99, marginBottom:20 }} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <span style={{ fontSize:16, fontWeight:800, color:P.ink }}>Confirmar compra</span>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:P.ink3, display:'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background:P.bg, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:P.ink, marginBottom:4 }}>{producto.nombre}</div>
                    {producto.categoria && (
                        <div style={{ fontSize:12, color:P.ink3 }}>{producto.categoria}</div>
                    )}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:P.ink2 }}>Costo</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Star size={13} fill={P.amb} color={P.amb} />
                        <span style={{ fontSize:16, fontWeight:900, color:P.ink }}>{precio}</span>
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                    <span style={{ fontSize:13, color:P.ink2 }}>Tu saldo actual</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Star size={13} fill={P.amb} color={P.amb} />
                        <span style={{ fontSize:16, fontWeight:900, color:P.ink }}>{saldo}</span>
                    </div>
                </div>

                {canBuy ? (
                    <div style={{ background:P.greenS, borderRadius:10, padding:'10px 14px', marginBottom:20, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#16a34a' }}>Saldo restante</span>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Star size={13} fill="#16a34a" color="#16a34a" />
                            <span style={{ fontSize:16, fontWeight:900, color:'#16a34a' }}>{saldo - precio}</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ background:P.redS, borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:P.red }}>Saldo insuficiente — te faltan {precio - saldo} ⭐</span>
                    </div>
                )}

                <button
                    onClick={onConfirm}
                    disabled={!canBuy || buying}
                    style={{ width:'100%', background: canBuy ? P.pri : '#e5e7eb', color:'#fff', border:'none', borderRadius:14, padding:'15px', fontSize:15, fontWeight:800, cursor: canBuy ? 'pointer' : 'not-allowed', fontFamily:'inherit', opacity: buying ? 0.7 : 1 }}
                >
                    {buying ? 'Procesando…' : canBuy ? 'Confirmar compra' : 'Sin estrellas suficientes'}
                </button>
            </div>
        </div>
    );
}

// ── Pantalla de éxito ─────────────────────────────────────────────────────────
function SuccessScreen({ producto, nuevoSaldo, onClose }) {
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(27,21,48,.5)', backdropFilter:'blur(4px)', padding:24 }}>
            <div style={{ background:'#fff', borderRadius:22, padding:'36px 28px', width:'100%', maxWidth:340, textAlign:'center', boxShadow:'0 20px 60px rgba(27,21,48,.2)' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:P.greenS, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <CheckCircle2 size={34} color="#16a34a" />
                </div>
                <h2 style={{ fontSize:18, fontWeight:900, color:P.ink, marginBottom:6 }}>¡Compra realizada!</h2>
                <p style={{ fontSize:13, color:P.ink2, marginBottom:20 }}>
                    <strong>{producto.nombre}</strong> canjeado exitosamente.
                </p>
                <div style={{ background:P.bg, borderRadius:12, padding:'12px 16px', marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:P.ink2 }}>Nuevo saldo</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Star size={14} fill={P.amb} color={P.amb} />
                        <span style={{ fontSize:20, fontWeight:900, color:P.ink }}>{nuevoSaldo}</span>
                    </div>
                </div>
                <button onClick={onClose} style={{ width:'100%', background:P.pri, color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Volver al catálogo
                </button>
            </div>
        </div>
    );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function KioskoAlumnoView() {
    const { studentId } = useParams();
    const today = new Date().toISOString().slice(0, 10);

    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    const [student, setStudent] = useState(null);
    const [saldo, setSaldo] = useState(0);
    const [config, setConfig] = useState(null);
    const [productos, setProductos] = useState([]);
    const [confirmando, setConfirmando] = useState(null); // producto seleccionado
    const [buying, setBuying] = useState(false);
    const [success, setSuccess] = useState(null); // { producto, nuevoSaldo }

    // 1. Auth anónima → load data
    useEffect(() => {
        let unsubSaldo = null;

        signInAnonymously(auth).then(async () => {
            // Cargar alumno
            const snapStudent = await getDoc(doc(db, 'students', studentId));
            if (!snapStudent.exists()) { setError('Alumno no encontrado.'); setReady(true); return; }
            setStudent({ id: studentId, ...snapStudent.data() });

            // Cargar config
            const snapCfg = await getDoc(doc(db, 'incentivo_config', 'default'));
            setConfig(snapCfg.exists() ? snapCfg.data() : {
                tiers: [
                    { id:3, label:'Excelencia', minCoins:80 },
                    { id:2, label:'Destacado',  minCoins:30 },
                    { id:1, label:'Regular',    minCoins:0  },
                ],
            });

            // Cargar productos
            const { getDocs, collection: col, query: q, where } = await import('firebase/firestore');
            const snapProd = await getDocs(q(col(db, 'incentivo_productos'), where('activo', '==', true)));
            setProductos(snapProd.docs.map(d => ({ id: d.id, ...d.data() })));

            // Saldo en tiempo real
            unsubSaldo = onSnapshot(doc(db, 'incentivo_estrellas', studentId), snap => {
                setSaldo(snap.exists() ? (snap.data().saldo ?? 0) : 0);
            });

            setReady(true);
        }).catch(err => {
            setError('Error al conectar. Intenta escanear nuevamente.');
            setReady(true);
            console.error(err);
        });

        return () => { if (unsubSaldo) unsubSaldo(); };
    }, [studentId]);

    async function handleCompra(producto) {
        const precio = getEffectivePrice(producto, today);
        if (saldo < precio) return;
        setBuying(true);
        try {
            const batch = writeBatch(db);
            // Descontar estrellas
            const estrellasRef = doc(db, 'incentivo_estrellas', studentId);
            batch.set(estrellasRef, { saldo: increment(-precio) }, { merge: true });
            // Registrar transacción
            const txRef = doc(collection(db, 'incentivo_transacciones'));
            batch.set(txRef, {
                studentId,
                monto: precio,
                tipo: 'egreso',
                nota: `Compra kiosko: ${producto.nombre}`,
                fecha: serverTimestamp(),
            });
            // Descontar stock
            const prodRef = doc(db, 'incentivo_productos', producto.id);
            batch.update(prodRef, { stock: increment(-1) });
            await batch.commit();

            setSuccess({ producto, nuevoSaldo: saldo - precio });
            setConfirmando(null);
            // Actualizar stock local
            setProductos(ps => ps.map(p => p.id === producto.id ? { ...p, stock: (p.stock ?? 0) - 1 } : p));
        } catch (e) {
            console.error(e);
            alert('Error al procesar la compra. Intenta de nuevo.');
        } finally {
            setBuying(false);
        }
    }

    if (!ready) return <Spinner />;
    if (error || !student) return <ErrorScreen msg={error} />;

    const tiers = config?.tiers ?? [];
    const tierData = getTier(saldo, tiers);
    const { color: tierColor, colorS: tierColorS, Icon: TierIcon, label: tierLabel } = TIER_PALETTE[tierData?.id ?? 1];

    // Productos disponibles para el tier del alumno (tier <= su tier id)
    const disponibles = productos
        .filter(p => (p.tier ?? 1) <= (tierData?.id ?? 1) && (p.stock ?? 0) > 0)
        .sort((a, b) => (b.tier ?? 1) - (a.tier ?? 1) || (a.precio ?? 0) - (b.precio ?? 0));

    return (
        <div style={{ minHeight:'100dvh', background:P.bg, fontFamily:'system-ui, -apple-system, sans-serif' }}>
            {/* Header alumno */}
            <div style={{ background:'#fff', borderBottom:`1px solid ${P.line}`, padding:'0 20px' }}>
                <div style={{ height:5, background:P.stripe }} />
                <div style={{ padding:'18px 0 16px', display:'flex', alignItems:'center', gap:14 }}>
                    {/* Avatar inicial */}
                    <div style={{ width:52, height:52, borderRadius:14, background:tierColorS, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22, fontWeight:900, color:tierColor }}>
                        {(student.fullName || student.nombre || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:17, fontWeight:900, color:P.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {student.fullName || student.nombre}
                        </div>
                        <div style={{ fontSize:12, color:P.ink3 }}>{student.curso}</div>
                    </div>
                    {/* Saldo */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end' }}>
                            <Star size={18} fill={P.amb} color={P.amb} />
                            <span style={{ fontSize:28, fontWeight:900, color:P.ink, lineHeight:1 }}>{saldo}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end', marginTop:3 }}>
                            <TierIcon size={11} color={tierColor} />
                            <span style={{ fontSize:11, fontWeight:700, color:tierColor }}>{tierLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catálogo */}
            <div style={{ padding:'18px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <ShoppingBag size={16} color={P.pri} />
                    <span style={{ fontSize:14, fontWeight:800, color:P.ink }}>Canje de estrellas</span>
                </div>

                {disponibles.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px 0' }}>
                        <Star size={36} color={P.line} style={{ margin:'0 auto 10px' }} />
                        <p style={{ fontSize:14, color:P.ink3, fontWeight:600 }}>No hay productos disponibles para tu nivel.</p>
                        <p style={{ fontSize:12, color:P.ink3, marginTop:4 }}>Sigue acumulando estrellas para desbloquear más.</p>
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {disponibles.map(p => {
                            const precio = getEffectivePrice(p, today);
                            const hasOffer = precio < p.precio;
                            const canBuy = saldo >= precio && (p.stock ?? 0) > 0;
                            const pal = TIER_PALETTE[p.tier ?? 1];
                            return (
                                <div key={p.id} style={{ background:'#fff', borderRadius:16, border:`1px solid ${P.line}`, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, opacity: canBuy ? 1 : 0.6 }}>
                                    {/* Tier dot */}
                                    <div style={{ width:40, height:40, borderRadius:11, background:pal.colorS, display:'grid', placeItems:'center', flexShrink:0 }}>
                                        <pal.Icon size={18} color={pal.color} />
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontSize:14, fontWeight:700, color:P.ink, marginBottom:2 }}>{p.nombre}</div>
                                        {p.categoria && <div style={{ fontSize:11, color:P.ink3 }}>{p.categoria}</div>}
                                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                                            {hasOffer && (
                                                <span style={{ fontSize:11, color:P.ink3, textDecoration:'line-through' }}>{p.precio} ⭐</span>
                                            )}
                                            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                                                <Star size={12} fill={P.amb} color={P.amb} />
                                                <span style={{ fontSize:14, fontWeight:900, color:P.ink }}>{precio}</span>
                                            </div>
                                            {hasOffer && (
                                                <span style={{ fontSize:10, fontWeight:800, color:P.acc, background:P.accS, borderRadius:99, padding:'1px 7px' }}>OFERTA</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => canBuy && setConfirmando(p)}
                                        disabled={!canBuy}
                                        style={{ padding:'9px 16px', borderRadius:10, background: canBuy ? P.pri : '#e5e7eb', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor: canBuy ? 'pointer' : 'not-allowed', fontFamily:'inherit', flexShrink:0, whiteSpace:'nowrap' }}
                                    >
                                        {canBuy ? 'Canjear' : saldo < precio ? 'Sin ⭐' : 'Sin stock'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modales */}
            {confirmando && (
                <ConfirmModal
                    producto={confirmando}
                    precio={getEffectivePrice(confirmando, today)}
                    saldo={saldo}
                    onConfirm={() => handleCompra(confirmando)}
                    onClose={() => !buying && setConfirmando(null)}
                    buying={buying}
                />
            )}
            {success && (
                <SuccessScreen
                    producto={success.producto}
                    nuevoSaldo={success.nuevoSaldo}
                    onClose={() => setSuccess(null)}
                />
            )}
        </div>
    );
}
