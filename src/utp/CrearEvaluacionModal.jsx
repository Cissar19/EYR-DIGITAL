import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, ChevronLeft, ChevronRight, Sparkles, Pencil, Check } from 'lucide-react';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import ObjetivosSelector from '../components/ObjetivosSelector';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { useSchedule, SCHEDULE_BLOCKS, SUBJECT_TO_ASIG } from '../context/ScheduleContext';
import { addBusinessDays } from '../lib/businessDays';
import { useHolidays } from '../context/HolidaysContext';
import { toast } from 'sonner';

// ── Design tokens (V3) ───────────────────────────────────────────────────────
const PRIMARY    = '#7B5BE0';
const PINK       = '#EC5BA1';
const TEXT_DARK  = '#2a1a3a';
const TEXT_MED   = '#3a2a44';
const TEXT_MUTED = '#7a6a8a';
const TEXT_SOFT  = '#9a8aaa';
const BG_FIELD   = '#FAFAFD';
const ACT_BG     = '#F1ECFF';
const ACT_TEXT   = '#5028B8';

// Colores por asignatura
const ASIG_COLORS = {
  matematica:           '#3B8FE5',
  lenguaje:             '#EC5BA1',
  lengua_y_literatura:  '#EC5BA1',
  historia:             '#F4B400',
  ciencias:             '#2BB673',
  ingles:               '#7B5BE0',
  artes:                '#FF7A4D',
  educacion_fisica:     '#26B7BB',
  musica:               '#F4B400',
  tecnologia:           '#3B8FE5',
  orientacion:          '#2BB673',
  religion_evangelica:  '#F4B400',
  religion_catolica:    '#F4B400',
};
const DAY_COLOR  = { 'Lunes':'#FF7A4D', 'Martes':'#FF7A4D', 'Miércoles':'#26B7BB', 'Jueves':'#7B5BE0', 'Viernes':'#26B7BB' };
const DAY_SHORT  = { 'Lunes':'LUN', 'Martes':'MAR', 'Miércoles':'MIÉ', 'Jueves':'JUE', 'Viernes':'VIE' };
const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie'];
const DIA_TO_DOW  = { 'Lunes':1, 'Martes':2, 'Miércoles':3, 'Jueves':4, 'Viernes':5 };

const getAsigName  = (code) => ASIGNATURAS.find(a => a.code === code)?.name || code;
const getAsigColor = (code) => ASIG_COLORS[code] || PRIMARY;

const TITULO_SUGERIDOS = ['Control mensual','Prueba unidad','Quiz rápido','Diagnóstico'];

// ── buildMonthGrid ────────────────────────────────────────────────────────────
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const start    = new Date(firstDay);
  const startDow = start.getDay();
  start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));
  const end    = new Date(lastDay);
  const endDow = end.getDay();
  if (endDow === 0) end.setDate(end.getDate() - 2);
  else if (endDow === 6) end.setDate(end.getDate() - 1);
  else if (endDow < 5)  end.setDate(end.getDate() + (5 - endDow));
  const weeks  = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const week = [];
    for (let d = 0; d < 5; d++) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + d);
      week.push({ dateStr: day.toISOString().slice(0, 10), inMonth: day.getMonth() === month && day.getFullYear() === year });
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

// ── DatePickerField ───────────────────────────────────────────────────────────
function DatePickerField({ value, onChange, allowedWeekdays, minDate }) {
  const todayStr  = new Date().toISOString().slice(0, 10);
  const effectiveMin = minDate || todayStr;
  const initDate  = value ? new Date(value + 'T12:00:00') : new Date();
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [pos, setPos]           = useState({ top:0, left:0, width:0 });
  const btnRef    = useRef(null);
  const pickerRef = useRef(null);

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const nextValidDates = useMemo(() => {
    if (!allowedWeekdays || allowedWeekdays.length === 0) return null;
    const dates  = [];
    const cursor = new Date(effectiveMin + 'T12:00:00');
    // Start from effectiveMin (not today) so blocked dates don't appear
    while (dates.length < 8) {
      const iso = cursor.toISOString().slice(0, 10);
      if (allowedWeekdays.includes(cursor.getDay()) && iso >= effectiveMin) dates.push(iso);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [allowedWeekdays, effectiveMin]);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          btnRef.current    && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPicker = () => {
    if (value && !nextValidDates) {
      const d = new Date(value + 'T12:00:00');
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    }
    if (btnRef.current) {
      const rect    = btnRef.current.getBoundingClientRect();
      const pickerH = nextValidDates ? 340 : 360;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const top = spaceBelow >= pickerH ? rect.bottom + 4 : rect.top - pickerH - 4;
      setPos({ top, left: rect.left, width: Math.max(rect.width, nextValidDates ? 280 : 320) });
    }
    setOpen(o => !o);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };
  const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);
  const weeks = buildMonthGrid(viewYear, viewMonth);

  const displayLabel = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' })
    : null;
  const diff = value
    ? Math.round((new Date(value + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / 86400000)
    : null;
  const restoLabel = diff === null ? null
    : diff === 0 ? 'es hoy'
    : diff === 1 ? 'queda 1 día'
    : diff > 1   ? `quedan ${diff} días`
    : `hace ${-diff} día${-diff !== 1 ? 's' : ''}`;

  // V3-style date display card (when date is selected)
  if (value) {
    const d = new Date(value + 'T12:00:00');
    return (
      <>
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'12px 14px', borderRadius:14,
          background: BG_FIELD, border:'1.5px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width:42, height:46, borderRadius:10, background:'white', overflow:'hidden',
            border:'1px solid rgba(0,0,0,0.06)', flexShrink:0,
          }}>
            <div style={{ background: PINK, color:'white', fontSize:8, fontWeight:800, textAlign:'center', padding:'2px 0', letterSpacing:0.6 }}>
              {MESES_CORTO[d.getMonth()]}
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:TEXT_DARK, textAlign:'center', lineHeight:1.4 }}>
              {d.getDate()}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT_DARK, textTransform:'capitalize' }}>{displayLabel}</div>
            <div style={{ fontSize:11, color:TEXT_MUTED, marginTop:2 }}>
              {diff === 0
                ? <span style={{ padding:'2px 7px', borderRadius:5, background:'#D9F5E4', color:'#0F7B3F', fontSize:10, fontWeight:800, letterSpacing:0.4 }}>HOY</span>
                : <span style={{ color: diff < 0 ? '#DC2626' : TEXT_MUTED }}>{restoLabel}</span>
              }
            </div>
          </div>
          <button ref={btnRef} onClick={openPicker} style={{
            padding:'7px 12px', borderRadius:9, border:'1px solid rgba(0,0,0,0.08)',
            background:'white', fontSize:11, fontWeight:700, color:ACT_TEXT, cursor:'pointer',
            fontFamily:'inherit',
          }}>Cambiar</button>
        </div>
        {open && createPortal(
          <div ref={pickerRef} style={{ position:'fixed', top:pos.top, left:pos.left, width:pos.width, zIndex:9999 }}
            className="bg-white rounded-3xl shadow-2xl border border-eyr-outline-variant/10 overflow-hidden">
            <PickerContent {...{nextValidDates, todayStr, effectiveMin, viewYear, viewMonth, weeks, canGoPrev, prevMonth, nextMonth, value, onChange, setOpen}} />
          </div>, document.body
        )}
      </>
    );
  }

  // No date selected: simple button
  return (
    <>
      <button ref={btnRef} type="button" onClick={openPicker} style={{
        width:'100%', padding:'12px 14px', borderRadius:14,
        border:'1.5px solid rgba(0,0,0,0.08)', background:BG_FIELD,
        display:'flex', alignItems:'center', gap:10,
        fontSize:14, fontWeight:600, color:TEXT_MUTED, cursor:'pointer',
        fontFamily:'inherit',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_SOFT} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>
        </svg>
        Seleccionar fecha…
      </button>
      {open && createPortal(
        <div ref={pickerRef} style={{ position:'fixed', top:pos.top, left:pos.left, width:pos.width, zIndex:9999 }}
          className="bg-white rounded-3xl shadow-2xl border border-eyr-outline-variant/10 overflow-hidden">
          <PickerContent {...{nextValidDates, todayStr, effectiveMin, viewYear, viewMonth, weeks, canGoPrev, prevMonth, nextMonth, value, onChange, setOpen}} />
        </div>, document.body
      )}
    </>
  );
}

function PickerContent({ nextValidDates, todayStr, effectiveMin, viewYear, viewMonth, weeks, canGoPrev, prevMonth, nextMonth, value, onChange, setOpen }) {
  const minStr = effectiveMin || todayStr;
  if (nextValidDates) {
    return (
      <div>
        <div style={{ padding:'10px 16px 8px', background:PRIMARY }}>
          <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:1 }}>Próximas fechas disponibles</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:12 }}>
          {nextValidDates.map(dateStr => {
            const isSelected = dateStr === value;
            const d   = Math.round((new Date(dateStr + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / 86400000);
            const lbl = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'short' });
            const resto = d === 0 ? 'hoy' : d === 1 ? '1 día' : `${d} días`;
            return (
              <button key={dateStr} type="button" onClick={() => { onChange(dateStr); setOpen(false); }}
                style={{
                  padding:'8px 10px', borderRadius:12, border:`2px solid ${isSelected ? PRIMARY : 'rgba(0,0,0,0.06)'}`,
                  background: isSelected ? ACT_BG : BG_FIELD,
                  textAlign:'left', cursor:'pointer', fontFamily:'inherit',
                }}>
                <div style={{ fontSize:11, fontWeight:800, color: isSelected ? ACT_TEXT : TEXT_DARK, textTransform:'capitalize' }}>{lbl}</div>
                <div style={{ fontSize:11, fontWeight:600, color: isSelected ? PRIMARY : TEXT_MUTED, marginTop:1 }}>{resto}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:PRIMARY }}>
        <button type="button" onClick={prevMonth} disabled={!canGoPrev}
          style={{ padding:6, borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,0.8)', cursor:'pointer', display:'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize:13, fontWeight:800, color:'white', letterSpacing:0.4 }}>{MESES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth}
          style={{ padding:6, borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,0.8)', cursor:'pointer', display:'flex' }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
        {DIAS_CORTOS.map(d => (
          <div key={d} style={{ padding:'8px 0', textAlign:'center', fontSize:11, fontWeight:800, color:TEXT_MUTED, textTransform:'uppercase', letterSpacing:0.6, background:'rgba(0,0,0,0.01)' }}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderBottom: wi < weeks.length-1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
          {week.map(({ dateStr, inMonth }) => {
            if (!inMonth) return <div key={dateStr}/>;
            const isBlocked  = dateStr < minStr;
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === value;
            const dayNum     = parseInt(dateStr.split('-')[2]);
            return (
              <button key={dateStr} type="button" disabled={isBlocked}
                onClick={() => { onChange(dateStr); setOpen(false); }}
                style={{ padding:'10px 0', display:'flex', alignItems:'center', justifyContent:'center',
                  background: isSelected ? ACT_BG : 'transparent',
                  cursor: isBlocked ? 'not-allowed' : 'pointer',
                  border:'none',
                }}>
                <span style={{
                  width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'50%', fontSize:13, fontWeight: isSelected || isToday ? 800 : 500,
                  background: isSelected ? PRIMARY : 'transparent',
                  color: isSelected ? 'white' : isToday ? PRIMARY : isBlocked ? '#ccc' : TEXT_DARK,
                  outline: isToday && !isSelected ? `2px solid ${PRIMARY}` : 'none',
                }}>{dayNum}</span>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ── SumLine ───────────────────────────────────────────────────────────────────
const SumLine = ({ k, v }) => (
  <div style={{ marginBottom:8 }}>
    <div style={{ fontSize:10, fontWeight:800, opacity:0.7, letterSpacing:0.8, textTransform:'uppercase', marginBottom:2 }}>{k}</div>
    <div style={{ fontSize:14, fontWeight:700, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
  </div>
);

// ── Label helper ──────────────────────────────────────────────────────────────
const Lbl = ({ children, required, note }) => (
  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
    <label style={{ fontSize:13, fontWeight:700, color:TEXT_MED }}>
      {children}{required && <span style={{ color:PINK, marginLeft:3 }}>*</span>}
    </label>
    {note && <span style={{ fontSize:11, color:TEXT_SOFT }}>{note}</span>}
  </div>
);

// ── PopoverSelect ──────────────────────────────────────────────────────────────
function PopoverSelect({ label, required, value, displayValue, accent, children, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top:0, left:0, width:0 });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref}>
      <Lbl required={required}>{label}</Lbl>
      <button ref={btnRef} type="button" onClick={openDropdown} style={{
        width:'100%', padding:'10px 12px', borderRadius:12,
        border: open ? `1.5px solid ${accent || PRIMARY}` : '1.5px solid rgba(0,0,0,0.08)',
        background: BG_FIELD,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        fontSize:14, fontWeight:700, color: value ? TEXT_DARK : TEXT_SOFT,
        cursor:'pointer',
        boxShadow: open ? `0 0 0 4px ${(accent||PRIMARY)}20` : 'none',
        fontFamily:'inherit',
        transition:'all .15s',
      }}>
        <span style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
          {value && (
            <span style={{ width:20, height:20, borderRadius:6, background:accent||PRIMARY, color:'white', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {(displayValue||value).slice(0,1)}
            </span>
          )}
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayValue || value || placeholder}</span>
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent||PRIMARY} strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .15s', flexShrink:0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && createPortal(
        <div style={{
          position:'fixed', top:pos.top, left:pos.left, width:pos.width, zIndex:9999,
          background:'white', borderRadius:14,
          boxShadow:'0 12px 28px -8px rgba(40,20,80,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          padding:6, maxHeight:240, overflowY:'auto',
        }}
          onMouseDown={e => e.stopPropagation()}
        >
          {React.Children.map(children, child =>
            React.cloneElement(child, { onSelect: () => setOpen(false) })
          )}
        </div>, document.body
      )}
    </div>
  );
}

function PopoverItem({ children, active, onClick, onSelect }) {
  return (
    <button type="button" onClick={() => { onClick(); onSelect?.(); }} style={{
      width:'100%', textAlign:'left',
      padding:'9px 10px', borderRadius:8, border:'none',
      background: active ? ACT_BG : 'transparent',
      color: active ? ACT_TEXT : TEXT_DARK,
      fontSize:13, fontWeight: active ? 800 : 600,
      cursor:'pointer', display:'flex', alignItems:'center', gap:8,
      fontFamily:'inherit',
    }}>
      {active && <Check size={12} style={{ color:ACT_TEXT, flexShrink:0 }} />}
      {children}
    </button>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CrearEvaluacionModal({ onClose, onCreated, user, defaultDate, evalId, initialData }) {
  const { addEvaluacion, updateEvaluacion, submitTeacherEdit, evaluaciones } = useEvaluaciones();
  const { allHolidaysSet } = useHolidays();
  const isEditing     = !!evalId;
  const isTeacherEdit = isEditing && user?.role === 'teacher';
  const { getSchedule } = useSchedule();
  const [saving, setSaving] = useState(false);
  const [tab, setTab]       = useState('detalles');
  const isTeacher = user?.role === 'teacher';

  const teacherBlocks = useMemo(() => {
    if (!isTeacher) return null;
    return getSchedule(user.uid).filter(b => CURSOS.includes(b.course) && SUBJECT_TO_ASIG[b.subject]);
  }, [isTeacher, getSchedule, user?.uid]);

  const availableCursos = useMemo(() => {
    if (teacherBlocks === null) return CURSOS;
    if (teacherBlocks.length === 0) return [];
    return [...new Set(teacherBlocks.map(b => b.course))].sort((a, b) => CURSOS.indexOf(a) - CURSOS.indexOf(b));
  }, [teacherBlocks]);

  const [curso, setCurso]               = useState(initialData?.curso || '');
  const [asignatura, setAsignatura]     = useState(initialData?.asignatura || '');
  const [selectedSlots, setSelectedSlots] = useState(initialData?.slots || []);
  const [name, setName]                 = useState(initialData?.name || '');
  const [selectedOas, setSelectedOas]   = useState(initialData?.oaCodes || []);
  const [editDate, setEditDate]         = useState(initialData?.date || defaultDate || '');

  const date = defaultDate || editDate;

  const asignaturasForCurso = useMemo(() => {
    if (teacherBlocks === null) return ASIGNATURAS;
    if (teacherBlocks.length === 0 || !curso) return [];
    const codes = [...new Set(teacherBlocks.filter(b => b.course === curso).map(b => SUBJECT_TO_ASIG[b.subject]).filter(Boolean))];
    return ASIGNATURAS.filter(a => codes.includes(a.code));
  }, [teacherBlocks, curso]);

  const handleCursoChange = (newCurso) => {
    setCurso(newCurso);
    setSelectedOas([]);
    setSelectedSlots([]);
    const options = (() => {
      if (teacherBlocks === null) return ASIGNATURAS;
      if (teacherBlocks.length === 0 || !newCurso) return [];
      const codes = [...new Set(teacherBlocks.filter(b => b.course === newCurso).map(b => SUBJECT_TO_ASIG[b.subject]).filter(Boolean))];
      return ASIGNATURAS.filter(a => codes.includes(a.code));
    })();
    setAsignatura(options.length === 1 ? options[0].code : '');
  };

  const handleAsignaturaChange = (code) => {
    setAsignatura(code);
    setSelectedSlots([]);
    setSelectedOas([]);
  };

  const availableSlots = useMemo(() => {
    if (!isTeacher || !teacherBlocks || !curso || !asignatura) return null;
    const DIAS_ORDER = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const relevant = teacherBlocks
      .filter(b => b.course === curso && SUBJECT_TO_ASIG[b.subject] === asignatura)
      .sort((a, b) => {
        const dayDiff = DIAS_ORDER.indexOf(a.day) - DIAS_ORDER.indexOf(b.day);
        return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
      });
    if (relevant.length === 0) return null;
    return relevant.map(b => {
      const block = SCHEDULE_BLOCKS.find(sb => sb.start === b.startTime);
      return { day:b.day, label:block?.label||b.startTime, startTime:b.startTime, endTime:block?.end||'' };
    });
  }, [isTeacher, teacherBlocks, curso, asignatura]);

  // Auto-selecciona los bloques del día de la semana del defaultDate al cargar availableSlots
  useEffect(() => {
    if (!defaultDate || !availableSlots || availableSlots.length === 0) return;
    const dow = new Date(defaultDate + 'T12:00:00').getDay();
    const matching = availableSlots.filter(s => DIA_TO_DOW[s.day] === dow);
    if (matching.length > 0) setSelectedSlots(matching);
  }, [availableSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  const allowedWeekdays = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    return [...new Set(selectedSlots.map(s => DIA_TO_DOW[s.day]).filter(Boolean))];
  }, [selectedSlots]);

  const canSelectSlot = (day, startTime, endTime) => {
    if (selectedSlots.length === 0) return true;
    if (day !== selectedSlots[0].day) return false;
    const minStart = selectedSlots.reduce((m, s) => s.startTime < m ? s.startTime : m, selectedSlots[0].startTime);
    const maxEnd   = selectedSlots.reduce((m, s) => s.endTime   > m ? s.endTime   : m, selectedSlots[0].endTime);
    return startTime === maxEnd || endTime === minStart;
  };

  const toggleSlot = (day, label, startTime, endTime) => {
    const isSelected = selectedSlots.some(s => s.day === day && s.startTime === startTime);
    if (!isSelected && !canSelectSlot(day, startTime, endTime)) return;
    const newSlots = isSelected
      ? selectedSlots.filter(s => !(s.day === day && s.startTime === startTime))
      : [...selectedSlots, { day, label, startTime, endTime }];
    setSelectedSlots(newSlots);
    if (editDate && newSlots.length > 0) {
      const dow        = new Date(editDate + 'T12:00:00').getDay();
      const newAllowed = new Set(newSlots.map(s => DIA_TO_DOW[s.day]).filter(Boolean));
      if (!newAllowed.has(dow)) setEditDate('');
    }
  };

  // Asignaturas que pueden coexistir con otras evaluaciones el mismo día
  const EXEMPT = ['AV', 'MU', 'TE'];

  const hasConflict = useMemo(() => {
    if (!curso || !date || isEditing) return false;
    // Las asignaturas exentas nunca generan conflicto
    if (EXEMPT.includes(asignatura)) return false;
    // Para el resto: hay conflicto si ya existe al menos una evaluación no-exenta ese día
    return evaluaciones.some(e =>
      e.date === date && e.curso === curso && !EXEMPT.includes(e.asignatura)
    );
  }, [evaluaciones, curso, date, asignatura, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const minAllowedDate = null;
  const tooSoon = false;

  const formValid = curso && asignatura && name.trim() && date && !hasConflict && !tooSoon;

  const handleSubmit = async () => {
    if (!formValid) {
      if (!curso)           { toast.error('Selecciona un curso antes de continuar'); return; }
      if (!asignatura)      { toast.error('Selecciona una asignatura'); return; }
      if (!name.trim())     { toast.error('Escribe un título para la evaluación'); return; }
      if (!date)            { toast.error('Selecciona una fecha'); return; }
      if (tooSoon)          { toast.error(`La fecha debe ser al menos 5 días hábiles desde hoy (${minAllowedDate})`); return; }
      if (hasConflict)      { toast.error(`${curso} ya tiene una evaluación ese día. Solo Arte, Música y Tecnología pueden coincidir.`); return; }
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        const changes = {
          name:     name.trim(),
          date:     editDate,
          oa:       selectedOas.join(', '),
          oaCodes:  selectedOas,
          slots:    selectedSlots.length > 0 ? selectedSlots : null,
        };
        const ok = isTeacherEdit
          ? await submitTeacherEdit(evalId, changes, { id:user.uid, name:user.name })
          : await updateEvaluacion(evalId, changes);
        if (!ok) return;
        onCreated?.(evalId, false);
        onClose();
      } else {
        const newId = await addEvaluacion({
          name:      name.trim(),
          curso, asignatura, date,
          slots:     selectedSlots.length > 0 ? selectedSlots : null,
          oa:        selectedOas.join(', '),
          oaCodes:   selectedOas,
          driveLink: '',
          createdBy: { id:user.uid, name:user.name },
          questions: [],
        });
        if (!newId) return;
        onCreated?.(newId, true);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && formValid && !saving) {
        if (!isEditing && tab === 'detalles') setTab('oa');
        else handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValid, saving, tab, isEditing]);

  // sidebar summary
  const asigColor  = getAsigColor(asignatura);
  const firstSlot  = selectedSlots[0];
  const dateObj    = date ? new Date(date + 'T12:00:00') : null;

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(28,18,50,0.45)',
      backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
      animation:'calFadeIn .25s ease-out',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:880, maxWidth:'calc(100vw - 48px)',
        maxHeight:'calc(100vh - 48px)',
        background:'#FFFFFF',
        borderRadius:24,
        boxShadow:'0 30px 80px -20px rgba(40,20,80,0.5), 0 12px 30px -12px rgba(40,20,80,0.3)',
        overflow:'hidden',
        border:'1px solid rgba(20,10,40,0.05)',
        display:'grid',
        gridTemplateColumns:'240px 1fr',
        animation:'calPopIn .3s cubic-bezier(.2,.9,.3,1.2)',
      }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div style={{
          position:'relative',
          background:'linear-gradient(160deg, #7B5BE0 0%, #EC5BA1 100%)',
          color:'white', padding:'28px 22px',
          overflow:'hidden', display:'flex', flexDirection:'column',
        }}>
          {/* orbe de fondo */}
          <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.10)', animation:'calFloatA 9s ease-in-out infinite', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-80, left:-60, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,0.07)', animation:'calFloatB 11s ease-in-out infinite', animationDelay:'-4s', pointerEvents:'none' }}/>
          {/* símbolos flotantes */}
          {[
            { sym:'π',  top:  6, left: 12, size:52, op:0.60, anim:'calSymA', dur:'8s',  del:'-1s'   },
            { sym:'∑',  top: 18, right:12, size:44, op:0.55, anim:'calSymB', dur:'10s', del:'-3s'   },
            { sym:'√',  top: 68, left: 24, size:36, op:0.50, anim:'calSymC', dur:'7s',  del:'-5s'   },
            { sym:'×',  top: 95, right: 6, size:42, op:0.55, anim:'calSymD', dur:'9s',  del:'-2s'   },
            { sym:'∞',  top:145, left:  6, size:34, op:0.48, anim:'calSymA', dur:'12s', del:'-7s'   },
            { sym:'÷',  top:175, right:22, size:30, op:0.50, anim:'calSymB', dur:'6s',  del:'-1.5s' },
            { sym:'²',  top:200, left: 48, size:28, op:0.45, anim:'calSymC', dur:'11s', del:'-8s'   },
            { sym:'A',  top:225, right:10, size:46, op:0.45, anim:'calSymD', dur:'8s',  del:'-4s'   },
            { sym:'¿',  top:265, left: 12, size:38, op:0.48, anim:'calSymA', dur:'9s',  del:'-6s'   },
            { sym:'⚛',  top:295, right:16, size:36, op:0.52, anim:'calSymB', dur:'13s', del:'-3s'   },
            { sym:'∆',  top:330, left: 32, size:30, op:0.45, anim:'calSymC', dur:'7s',  del:'-9s'   },
            { sym:'«»', top:360, right: 4, size:28, op:0.48, anim:'calSymD', dur:'10s', del:'-5s'   },
            { sym:'ñ',  top:390, left:  8, size:34, op:0.42, anim:'calSymA', dur:'8s',  del:'-2s'   },
            { sym:'=',  top:420, right:28, size:30, op:0.48, anim:'calSymB', dur:'6s',  del:'-7s'   },
          ].map(({ sym, top, left, right, size, op, anim, dur, del }) => (
            <div key={sym+top} style={{
              position:'absolute', top, left, right,
              fontSize:size, fontWeight:900, color:'white', opacity:op,
              animation:`${anim} ${dur} ease-in-out infinite`,
              animationDelay:del,
              pointerEvents:'none', userSelect:'none', lineHeight:1,
              fontFamily:'ui-monospace, "Plus Jakarta Sans", system-ui',
              textShadow:'0 2px 12px rgba(0,0,0,0.25)',
            }}>
              {sym}
            </div>
          ))}

          <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column' }}>
            {/* icon */}
            <div style={{
              width:50, height:50, borderRadius:15,
              background:'rgba(255,255,255,0.22)',
              border:'1px solid rgba(255,255,255,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              marginBottom:20,
            }}>
              {isEditing ? <Pencil size={22} color="white"/> : <Sparkles size={22} color="white"/>}
            </div>

            <div style={{ fontSize:13, fontWeight:800, opacity:0.85, letterSpacing:1.4, textTransform:'uppercase', marginBottom:8 }}>
              Calendario UTP
            </div>
            <div style={{ fontSize:28, fontWeight:800, lineHeight:1.15, letterSpacing:-0.5, marginBottom:10, whiteSpace:'pre-line' }}>
              {isEditing ? 'Editar\nEvaluación' : 'Nueva\nEvaluación'}
            </div>
            <div style={{ fontSize:14, opacity:0.85, lineHeight:1.6, marginBottom:26 }}>
              {isEditing
                ? 'Modifica los datos de la evaluación.'
                : 'Programa una prueba o control para tu curso en pocos pasos.'}
            </div>

            {/* summary card */}
            <div style={{
              background:'rgba(255,255,255,0.16)',
              border:'1px solid rgba(255,255,255,0.25)',
              borderRadius:14, padding:'14px 16px',
              lineHeight:1.7,
            }}>
              <div style={{ fontSize:11, fontWeight:800, opacity:0.85, letterSpacing:0.8, textTransform:'uppercase', marginBottom:10 }}>
                Resumen
              </div>
              <SumLine k="Curso"   v={curso || '—'}/>
              <SumLine k="Materia" v={asignatura ? getAsigName(asignatura) : '—'}/>
              <SumLine k="Fecha"   v={dateObj
                ? dateObj.toLocaleDateString('es-CL', { weekday:'short', day:'numeric', month:'short' })
                : '—'}/>
              {firstSlot && <SumLine k="Horario" v={`${DAY_SHORT[firstSlot.day]||firstSlot.day} · ${firstSlot.label}`}/>}
              {selectedOas.length > 0 && <SumLine k="OAs" v={`${selectedOas.length} seleccionado${selectedOas.length!==1?'s':''}`}/>}
            </div>

          </div>
        </div>

        {/* ── Form area ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>

          {/* Tabs + close */}
          <div style={{
            padding:'16px 22px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            borderBottom:'1px solid rgba(20,10,40,0.06)',
            flexShrink:0,
          }}>
            <div style={{ display:'flex', gap:4 }}>
              {[
                { id:'detalles', label:'Detalles' },
                { id:'oa', label:'Objetivos de Aprendizaje' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding:'7px 14px', borderRadius:10, border:'none',
                  background: tab===t.id ? ACT_BG : 'transparent',
                  color: tab===t.id ? ACT_TEXT : TEXT_MUTED,
                  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>{t.label}</button>
              ))}
            </div>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:10,
              border:'1px solid rgba(0,0,0,0.06)',
              background:BG_FIELD, color:TEXT_MUTED,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <X size={14} strokeWidth={2.4}/>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding:'20px 24px', overflowY:'auto', flex:1,
            scrollbarWidth:'thin', scrollbarColor:`rgba(123,91,224,0.25) transparent` }}>

            {tab === 'detalles' && (
              <div>
                {/* Aviso sin horario */}
                {isTeacher && teacherBlocks !== null && teacherBlocks.length === 0 && (
                  <div style={{ padding:'10px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, fontSize:13, color:'#92400E', marginBottom:16 }}>
                    No tienes horario configurado. Contacta a la jefa UTP para que asigne tus cursos.
                  </div>
                )}

                {/* Curso + Asignatura */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                  <PopoverSelect
                    label="Curso" required
                    value={curso} displayValue={curso}
                    accent={PRIMARY} placeholder="Seleccionar curso…"
                  >
                    {availableCursos.map(c => (
                      <PopoverItem key={c} active={c===curso} onClick={() => handleCursoChange(c)}>
                        {c}
                      </PopoverItem>
                    ))}
                  </PopoverSelect>

                  <div style={{ opacity: !curso ? 0.5 : 1, pointerEvents: !curso ? 'none' : 'auto' }}>
                    {asignaturasForCurso.length === 1 ? (
                      <div>
                        <Lbl>Asignatura</Lbl>
                        <div style={{
                          padding:'10px 12px', borderRadius:12,
                          background:`${getAsigColor(asignaturasForCurso[0].code)}12`,
                          border:`1.5px solid ${getAsigColor(asignaturasForCurso[0].code)}30`,
                          fontSize:14, fontWeight:700,
                          color: getAsigColor(asignaturasForCurso[0].code),
                          display:'flex', alignItems:'center', gap:8,
                        }}>
                          <span style={{ width:20, height:20, borderRadius:6, background:getAsigColor(asignaturasForCurso[0].code), color:'white', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {asignaturasForCurso[0].name.slice(0,1)}
                          </span>
                          {asignaturasForCurso[0].name}
                        </div>
                      </div>
                    ) : (
                      <PopoverSelect
                        label="Asignatura"
                        value={asignatura}
                        displayValue={asignatura ? getAsigName(asignatura) : ''}
                        accent={asigColor}
                        placeholder="Seleccionar asignatura…"
                      >
                        {asignaturasForCurso.map(a => (
                          <PopoverItem key={a.code} active={a.code===asignatura} onClick={() => handleAsignaturaChange(a.code)}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:getAsigColor(a.code), flexShrink:0 }}/>
                            {a.name}
                          </PopoverItem>
                        ))}
                      </PopoverSelect>
                    )}
                  </div>
                </div>

                {/* Slots */}
                {availableSlots && (
                  <div style={{ marginBottom:18 }}>
                    <Lbl
                      note={`${availableSlots.length} bloque${availableSlots.length!==1?'s':''} disponibles`}
                    >
                      Horario de la evaluación
                      {selectedSlots.length > 0 && (
                        <span style={{ marginLeft:8, fontSize:11, fontWeight:700, color:PRIMARY }}>
                          ({selectedSlots.length} seleccionado{selectedSlots.length!==1?'s':''})
                        </span>
                      )}
                    </Lbl>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {availableSlots.map(({ day, label, startTime, endTime }) => {
                        const key      = `${day}-${startTime}`;
                        const isActive = selectedSlots.some(s => s.day===day && s.startTime===startTime);
                        const isBlocked = !isActive && !canSelectSlot(day, startTime, endTime);
                        const c        = DAY_COLOR[day] || PRIMARY;
                        return (
                          <button key={key} type="button"
                            disabled={isBlocked}
                            onClick={() => toggleSlot(day, label, startTime, endTime)}
                            style={{
                              position:'relative', padding:'10px 10px 10px 14px',
                              borderRadius:13, textAlign:'left', cursor: isBlocked ? 'not-allowed' : 'pointer',
                              border: isActive ? `2px solid ${c}` : '1.5px solid rgba(0,0,0,0.06)',
                              background: isActive ? `${c}12` : BG_FIELD,
                              boxShadow: isActive ? `0 6px 14px -6px ${c}80` : 'none',
                              opacity: isBlocked ? 0.35 : 1,
                              transition:'all .15s',
                              fontFamily:'inherit',
                            }}>
                            <div style={{ position:'absolute', left:0, top:8, bottom:8, width:3, borderRadius:2, background:c }}/>
                            <div style={{ fontSize:11, fontWeight:800, color:c, marginBottom:2 }}>
                              {DAY_SHORT[day]||day} <span style={{ opacity:0.6 }}>·</span> {label}
                            </div>
                            <div style={{ fontSize:11, fontWeight:700, color:TEXT_DARK, fontVariantNumeric:'tabular-nums' }}>
                              {startTime}{endTime?`–${endTime}`:''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fecha */}
                {(isEditing || !defaultDate) && (
                  <div style={{ marginBottom:18 }}>
                    <Lbl note={minAllowedDate ? `Mínimo: ${minAllowedDate}` : undefined}>Fecha</Lbl>
                    <DatePickerField
                      value={editDate}
                      onChange={setEditDate}
                      allowedWeekdays={allowedWeekdays}
                      minDate={minAllowedDate}
                    />
                    {tooSoon && (
                      <div style={{ marginTop:8, padding:'8px 12px', background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:10, fontSize:12, color:'#92400E', display:'flex', alignItems:'flex-start', gap:8 }}>
                        <span style={{ fontSize:14, lineHeight:1 }}>⚠️</span>
                        <span>Las evaluaciones deben agendarse con al menos <strong>5 días hábiles de anticipación</strong>. La fecha más próxima disponible es el <strong>{minAllowedDate}</strong>.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Título */}
                <div>
                  <Lbl required>Título de la evaluación</Lbl>
                  <div style={{ position:'relative' }}>
                    <input
                      value={name}
                      maxLength={80}
                      onChange={e => setName(e.target.value.toUpperCase())}
                      placeholder="Ej: CONTROL DE LECTURA MENSUAL"
                      style={{
                        width:'100%', boxSizing:'border-box',
                        padding:'12px 52px 12px 14px',
                        borderRadius:14,
                        border: name ? `1.5px solid ${PRIMARY}` : '1.5px solid rgba(0,0,0,0.08)',
                        background:'white',
                        fontSize:14, fontWeight:600, color:TEXT_DARK,
                        outline:'none', fontFamily:'inherit',
                        boxShadow: name ? `0 0 0 4px ${PRIMARY}15` : 'none',
                        transition:'all .15s',
                      }}
                    />
                    <div style={{
                      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      fontSize:10, color:TEXT_SOFT, fontWeight:600,
                    }}>{name.length}/80</div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                    {TITULO_SUGERIDOS.map(s => (
                      <button key={s} type="button" onClick={() => setName(s.toUpperCase())} style={{
                        padding:'5px 10px', borderRadius:8,
                        border:`1px solid ${PRIMARY}30`,
                        background:`${PRIMARY}08`,
                        fontSize:11, fontWeight:600, color:ACT_TEXT,
                        cursor:'pointer', fontFamily:'inherit',
                      }}>+ {s}</button>
                    ))}
                  </div>
                </div>

                {/* Conflicto */}
                {hasConflict && (
                  <div style={{ marginTop:14, padding:'8px 12px', background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:10, fontSize:12, color:'#92400E' }}>
                    <strong>{curso}</strong> ya tiene una evaluación programada para esta fecha. Solo Artes Visuales, Música y Tecnología pueden agendarse junto a otra prueba.
                  </div>
                )}
              </div>
            )}

            {tab === 'oa' && (
              <ObjetivosSelector
                onSeleccion={(oas) => setSelectedOas(oas.map(oa => oa.codigo))}
                seleccionados={selectedOas}
                cursoNombreExterno={curso || undefined}
                asignaturaNombreExterno={asignatura ? getAsigName(asignatura) : undefined}
                embedded
              />
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'14px 22px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            borderTop:'1px solid rgba(20,10,40,0.06)',
            background:'#FBFAFE', flexShrink:0,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:TEXT_MUTED }}>
              {selectedOas.length > 0 ? (
                <>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:PRIMARY }}/>
                  {selectedOas.length} OA{selectedOas.length!==1?'s':''} seleccionado{selectedOas.length!==1?'s':''}
                </>
              ) : isTeacherEdit ? (
                <span>Los cambios quedarán en revisión hasta ser aprobados.</span>
              ) : null}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} disabled={saving} style={{
                padding:'10px 16px', borderRadius:12, border:'none',
                background:'transparent', color:TEXT_MUTED,
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>Cancelar</button>
              {!isEditing && tab === 'detalles' ? (
                <button onClick={() => {
                  if (!formValid) {
                    if (!curso)       { toast.error('Selecciona un curso antes de continuar'); return; }
                    if (!asignatura)  { toast.error('Selecciona una asignatura'); return; }
                    if (!name.trim()) { toast.error('Escribe un título para la evaluación'); return; }
                    if (!date)        { toast.error('Selecciona una fecha'); return; }
                    if (tooSoon)      { toast.error(`La fecha debe ser al menos 5 días hábiles desde hoy (${minAllowedDate})`); return; }
                    if (hasConflict)  { toast.error(`${curso} ya tiene una evaluación ese día. Solo Arte, Música y Tecnología pueden coincidir.`); return; }
                    return;
                  }
                  setTab('oa');
                }} style={{
                  padding:'10px 22px', borderRadius:12, border:'none',
                  background: !formValid ? 'rgba(123,91,224,0.25)' : 'linear-gradient(90deg, #7B5BE0, #EC5BA1)',
                  color:'white', fontSize:13, fontWeight:800,
                  cursor:'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  boxShadow: formValid ? '0 8px 18px -6px rgba(123,91,224,0.55)' : 'none',
                  fontFamily:'inherit', transition:'all .15s',
                }}>
                  Siguiente paso
                  <ChevronRight size={14} strokeWidth={2.5}/>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving} style={{
                  padding:'10px 22px', borderRadius:12, border:'none',
                  background: !formValid ? 'rgba(123,91,224,0.25)' : saving ? 'rgba(123,91,224,0.25)' : 'linear-gradient(90deg, #7B5BE0, #EC5BA1)',
                  color:'white', fontSize:13, fontWeight:800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  boxShadow: formValid && !saving ? '0 8px 18px -6px rgba(123,91,224,0.55)' : 'none',
                  fontFamily:'inherit', transition:'all .15s',
                }}>
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin"/> {isEditing ? 'Guardando…' : 'Creando…'}</>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      {isEditing ? 'Guardar cambios' : 'Crear evaluación'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
