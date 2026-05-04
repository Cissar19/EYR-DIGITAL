import React, { useState, useMemo } from 'react';
import { Scroll, ChevronDown, ChevronRight, BookOpen, Search } from 'lucide-react';
import { ASIGNATURAS, CURSOS, CURSO_TO_LEVEL, OA_DATA } from '../data/objetivosAprendizaje';

// ── Design tokens UTP ──────────────────────────────────────────────────────
const DT = {
    primary: '#7B5BE0', primaryDark: '#5028B8',
    pink: '#EC5BA1', coral: '#FF7A4D', amber: '#F4B400',
    mint: '#2BB673', sky: '#3B8FE5',
    bgSoft: '#F4F1FB', ink: '#2a1a3a', muted: '#7a6a8a',
    line: 'rgba(20,10,40,0.06)',
};

// Paleta de colores para los ejes
const EJE_COLORS = [
    { bg: '#F0EBFF', border: '#C4B0F8', text: '#5028B8', dot: '#7B5BE0' },
    { bg: '#FFF0F7', border: '#F8B0D4', text: '#A0215A', dot: '#EC5BA1' },
    { bg: '#FFF6E8', border: '#F8D880', text: '#7A4B00', dot: '#F4B400' },
    { bg: '#E8FFF4', border: '#90E0B8', text: '#0A5E35', dot: '#2BB673' },
    { bg: '#E8F4FF', border: '#90C8F8', text: '#0A3E6E', dot: '#3B8FE5' },
    { bg: '#FFF0EB', border: '#F8C4B0', text: '#7A2A10', dot: '#FF7A4D' },
];

function EjeCard({ eje, oas, colorIndex, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    const c = EJE_COLORS[colorIndex % EJE_COLORS.length];

    return (
        <div style={{
            background: 'white', borderRadius: 14,
            border: `1.5px solid ${c.border}40`,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(40,20,80,0.04)',
        }}>
            {/* Eje header */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', background: c.bg,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left',
                }}
            >
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: c.dot, flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: c.text }}>
                    {eje}
                </span>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: c.text,
                    background: `${c.dot}22`, borderRadius: 8,
                    padding: '2px 8px',
                }}>
                    {oas.length} OA{oas.length !== 1 ? 's' : ''}
                </span>
                {open
                    ? <ChevronDown style={{ width: 15, height: 15, color: c.dot, flexShrink: 0 }} />
                    : <ChevronRight style={{ width: 15, height: 15, color: c.dot, flexShrink: 0 }} />
                }
            </button>

            {/* OA list */}
            {open && (
                <div style={{ padding: '8px 16px 12px' }}>
                    {oas.map((oa, idx) => (
                        <div key={oa.code} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            padding: '9px 0',
                            borderBottom: idx < oas.length - 1
                                ? `1px solid ${DT.line}` : 'none',
                        }}>
                            {/* OA code badge */}
                            <span style={{
                                flexShrink: 0, fontSize: 10.5, fontWeight: 800,
                                color: c.dot, background: c.bg,
                                border: `1px solid ${c.border}80`,
                                borderRadius: 6, padding: '2px 7px',
                                lineHeight: 1.6, marginTop: 1,
                                letterSpacing: 0.3,
                            }}>
                                {oa.code.split('-')[1]}
                            </span>
                            {/* Description */}
                            <p style={{
                                margin: 0, fontSize: 13, color: DT.ink,
                                lineHeight: 1.55,
                            }}>
                                {oa.description}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TemarioView() {
    const [selectedAsignatura, setSelectedAsignatura] = useState('');
    const [selectedCurso, setSelectedCurso] = useState('');
    const [search, setSearch] = useState('');

    const key = useMemo(() => {
        if (!selectedAsignatura || !selectedCurso) return null;
        const level = CURSO_TO_LEVEL[selectedCurso];
        return `${selectedAsignatura}${level}`;
    }, [selectedAsignatura, selectedCurso]);

    const rawOAs = useMemo(() => (key ? OA_DATA[key] || [] : []), [key]);

    // Filter by search
    const oasFiltrados = useMemo(() => {
        if (!search.trim()) return rawOAs;
        const norm = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return rawOAs.filter(oa =>
            oa.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm) ||
            oa.eje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm) ||
            oa.code.toLowerCase().includes(norm.toLowerCase())
        );
    }, [rawOAs, search]);

    // Group by eje
    const ejes = useMemo(() => {
        const map = {};
        oasFiltrados.forEach(oa => {
            if (!map[oa.eje]) map[oa.eje] = [];
            map[oa.eje].push(oa);
        });
        return Object.entries(map).map(([eje, oas]) => ({ eje, oas }));
    }, [oasFiltrados]);

    const asignaturaNombre = ASIGNATURAS.find(a => a.code === selectedAsignatura)?.name;

    const selectStyle = {
        padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${DT.line}`,
        background: 'white', color: DT.ink, fontSize: 13.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a6a8a' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        paddingRight: 34,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header */}
            <div style={{
                background: 'white', borderRadius: 18, padding: '18px 22px',
                border: `1px solid ${DT.line}`,
                boxShadow: '0 1px 3px rgba(40,20,80,0.04)',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg, ${DT.primary}, ${DT.pink})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                    <Scroll className="w-5 h-5" />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: DT.ink, margin: 0, lineHeight: 1.2 }}>
                        Temario
                    </h1>
                    <p style={{ fontSize: 13, color: DT.muted, margin: 0, marginTop: 3 }}>
                        Objetivos de Aprendizaje por asignatura y nivel — Bases Curriculares MINEDUC
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div style={{
                background: 'white', borderRadius: 14, padding: '14px 18px',
                border: `1px solid ${DT.line}`,
                display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
            }}>
                <select
                    value={selectedAsignatura}
                    onChange={e => setSelectedAsignatura(e.target.value)}
                    style={{ ...selectStyle, minWidth: 210 }}
                >
                    <option value="">— Asignatura —</option>
                    {ASIGNATURAS.map(a => (
                        <option key={a.code} value={a.code}>{a.name}</option>
                    ))}
                </select>

                <select
                    value={selectedCurso}
                    onChange={e => setSelectedCurso(e.target.value)}
                    style={{ ...selectStyle, minWidth: 160 }}
                >
                    <option value="">— Curso —</option>
                    {CURSOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                {/* Search */}
                {key && rawOAs.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        flex: 1, minWidth: 200,
                        border: `1.5px solid ${DT.line}`, borderRadius: 10,
                        background: DT.bgSoft, padding: '8px 12px',
                    }}>
                        <Search style={{ width: 14, height: 14, color: DT.muted, flexShrink: 0 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar OA..."
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                fontSize: 13, color: DT.ink, fontFamily: 'inherit', width: '100%',
                            }}
                        />
                    </div>
                )}

                {/* Stat */}
                {key && rawOAs.length > 0 && (
                    <div style={{
                        marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                        color: DT.primary, background: `${DT.primary}10`,
                        borderRadius: 10, padding: '8px 14px',
                        flexShrink: 0,
                    }}>
                        {rawOAs.length} OAs · {ejes.length} ejes
                    </div>
                )}
            </div>

            {/* Sin selección */}
            {!key && (
                <div style={{
                    background: 'white', borderRadius: 18,
                    border: `1.5px dashed ${DT.primary}40`,
                    padding: '60px 40px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 12, textAlign: 'center',
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: `${DT.primary}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen style={{ width: 26, height: 26, color: DT.primary }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: DT.ink, margin: 0 }}>
                        Selecciona asignatura y curso
                    </p>
                    <p style={{ fontSize: 13, color: DT.muted, margin: 0, maxWidth: 360 }}>
                        Se mostrarán los Objetivos de Aprendizaje organizados por eje temático
                        según las Bases Curriculares del MINEDUC.
                    </p>
                </div>
            )}

            {/* Sin datos para la combinación */}
            {key && rawOAs.length === 0 && (
                <div style={{
                    background: 'white', borderRadius: 18,
                    border: `1.5px dashed ${DT.line}`,
                    padding: '48px 40px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, textAlign: 'center',
                }}>
                    <Scroll style={{ width: 32, height: 32, color: DT.muted }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: DT.muted, margin: 0 }}>
                        Sin datos curriculares para {asignaturaNombre} — {selectedCurso}
                    </p>
                    <p style={{ fontSize: 12.5, color: DT.muted, margin: 0 }}>
                        Esta combinación aún no tiene OAs cargados en el sistema.
                    </p>
                </div>
            )}

            {/* Resultados de búsqueda sin coincidencias */}
            {key && rawOAs.length > 0 && oasFiltrados.length === 0 && (
                <div style={{
                    background: 'white', borderRadius: 14, padding: '32px 24px',
                    border: `1px solid ${DT.line}`, textAlign: 'center',
                }}>
                    <p style={{ fontSize: 13.5, color: DT.muted, margin: 0 }}>
                        No se encontraron OAs que coincidan con &ldquo;{search}&rdquo;
                    </p>
                </div>
            )}

            {/* Ejes */}
            {ejes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Título del temario */}
                    <div style={{
                        fontSize: 12, fontWeight: 800, color: DT.muted,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        paddingLeft: 4,
                    }}>
                        {asignaturaNombre} · {selectedCurso}
                    </div>

                    {ejes.map(({ eje, oas }, idx) => (
                        <EjeCard
                            key={eje}
                            eje={eje}
                            oas={oas}
                            colorIndex={idx}
                            defaultOpen={idx === 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
