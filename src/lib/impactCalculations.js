// ============================================
// Impact calculation functions for StatsView
// ============================================

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getAbsenceTypeLabel(req) {
    if (req.type === 'hour_permission') return 'Horas';
    if (req.type === 'discount') return 'Descuento';
    if (req.reason?.startsWith('[Excepcion]')) return 'Excepcion';
    if (req.isHalfDay) return req.isHalfDay === 'am' ? '½ AM' : req.isHalfDay === 'pm' ? '½ PM' : '½ Dia Admin';
    return 'Dia Admin';
}

/**
 * Compute impact of administrative day requests on student classes.
 * Extracted from DiasAdminTab useMemo.
 */
export function computeAdminDaysImpact(requests, schedules) {
    let totalClasses = 0;
    const byCourse = {};
    const bySubject = {};
    const byRequest = [];
    const coursesSet = new Set();
    const teachersSet = new Set();

    const absenceRequests = requests.filter(r =>
        r.status === 'approved' && r.type !== 'hour_return'
    );

    for (const req of absenceRequests) {
        if (!req.date || !req.userId) continue;

        const userBlocks = schedules[req.userId];
        if (!userBlocks || userBlocks.length === 0) {
            byRequest.push({ ...req, classesLost: 0, coursesAffected: [], blocksDetail: [], absenceType: getAbsenceTypeLabel(req) });
            continue;
        }

        const date = new Date(req.date + 'T00:00:00');
        const dow = date.getDay();
        if (dow === 0 || dow === 6) {
            byRequest.push({ ...req, classesLost: 0, coursesAffected: [], blocksDetail: [], absenceType: getAbsenceTypeLabel(req) });
            continue;
        }

        const dayName = DAY_NAMES[dow];
        const dayBlocks = userBlocks.filter(b => b.day === dayName && b.startTime !== '08:00');

        let affectedBlocks;
        if (req.type === 'hour_permission') {
            const match = req.reason?.match(/^\[Horas\] (\d{2}:\d{2}) - (\d{2}:\d{2})/);
            if (match) {
                affectedBlocks = dayBlocks.filter(b => b.startTime >= match[1] && b.startTime < match[2]);
            } else {
                const estBlocks = Math.ceil((req.minutesUsed || 0) / 45);
                affectedBlocks = dayBlocks.slice(0, estBlocks);
            }
        } else {
            affectedBlocks = dayBlocks;
        }

        const reqCourses = new Set();
        affectedBlocks.forEach(b => {
            if (b.course) { byCourse[b.course] = (byCourse[b.course] || 0) + 1; reqCourses.add(b.course); coursesSet.add(b.course); }
            if (b.subject) { bySubject[b.subject] = (bySubject[b.subject] || 0) + 1; }
        });

        if (affectedBlocks.length > 0 && req.userId) teachersSet.add(req.userId);
        totalClasses += affectedBlocks.length;
        byRequest.push({
            ...req, classesLost: affectedBlocks.length, coursesAffected: [...reqCourses], absenceType: getAbsenceTypeLabel(req),
            blocksDetail: affectedBlocks.map(b => ({ startTime: b.startTime, subject: b.subject || '', course: b.course || '' })),
        });
    }

    const courseData = Object.entries(byCourse).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const subjectData = Object.entries(bySubject).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    byRequest.sort((a, b) => b.classesLost - a.classesLost);

    return { totalAbsences: absenceRequests.length, totalClasses, coursesAffected: coursesSet.size, teachersWithImpact: teachersSet.size, courseData, subjectData, byRequest };
}

/**
 * Compute impact of medical leaves on student classes.
 * Extracted from standalone computeImpact function in StatsView.
 */
export function computeMedicalLeavesImpact(leaves, schedules) {
    let totalClasses = 0;
    const byCourse = {};
    const bySubject = {};
    const byLeave = [];
    const coursesSet = new Set();
    const teachersSet = new Set();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activeCount = 0;

    for (const leave of leaves) {
        if (!leave.startDate || !leave.endDate) continue;

        const end = new Date(leave.endDate + 'T00:00:00');
        if (end >= today) activeCount++;

        const userBlocks = schedules[leave.userId];
        if (!userBlocks || userBlocks.length === 0) {
            byLeave.push({ ...leave, classesLost: 0, coursesAffected: [], blocksDetail: [] });
            continue;
        }

        let leaveClasses = 0;
        const leaveCourses = new Set();
        const blocksDetail = [];

        const start = new Date(leave.startDate + 'T00:00:00');
        const endDate = new Date(leave.endDate + 'T00:00:00');

        for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay();
            if (dow === 0 || dow === 6) continue;

            const dayName = DAY_NAMES[dow];
            const dateStr = d.toISOString().split('T')[0];
            const dayBlocks = userBlocks.filter(b =>
                b.day === dayName && b.startTime !== '08:00'
            );

            leaveClasses += dayBlocks.length;
            dayBlocks.forEach(b => {
                blocksDetail.push({ date: dateStr, dayName, startTime: b.startTime, subject: b.subject || '', course: b.course || '' });
                if (b.course) {
                    byCourse[b.course] = (byCourse[b.course] || 0) + 1;
                    leaveCourses.add(b.course);
                    coursesSet.add(b.course);
                }
                if (b.subject) {
                    bySubject[b.subject] = (bySubject[b.subject] || 0) + 1;
                }
            });
        }

        if (leaveClasses > 0 && leave.userId) teachersSet.add(leave.userId);
        totalClasses += leaveClasses;
        byLeave.push({ ...leave, classesLost: leaveClasses, coursesAffected: [...leaveCourses], blocksDetail });
    }

    const courseData = Object.entries(byCourse).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const subjectData = Object.entries(bySubject).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    byLeave.sort((a, b) => b.classesLost - a.classesLost);

    return { activeCount, totalClasses, totalHours: totalClasses, coursesAffected: coursesSet.size, teachersWithImpact: teachersSet.size, courseData, subjectData, byLeave };
}

/** Normalize a name for matching: lowercase, strip accents */
function normalizeName(name) {
    return (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Parse "HH:MM" to total minutes */
function timeToMinutes(t) {
    if (!t || t === '-') return null;
    const parts = t.toString().trim().split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

/**
 * Compute impact of attendance issues (tardiness, early exits, absences) on student classes.
 * Maps dailyRecords from attendance_reports to schedule blocks.
 *
 * @param {Array} reports - attendance_reports documents from Firestore
 * @param {Array} users - users list with id, name
 * @param {Object} schedules - { userId: [ { day, startTime, subject, course } ] }
 * @returns {{ totalClasses, coursesAffected, teachersWithImpact, courseData, subjectData, byTeacher }}
 */
export function computeAttendanceImpact(reports, users, schedules) {
    let totalClasses = 0;
    const byCourse = {};
    const bySubject = {};
    const coursesSet = new Set();
    const teachersSet = new Set();
    const teacherClasses = {}; // userId -> count

    // Build name→userId map
    const nameToUser = {};
    for (const u of users) {
        if (u.name) nameToUser[normalizeName(u.name)] = u.id;
    }

    // Collect all daily records across reports, deduplicating by teacherName+date
    const seen = new Set();
    const allRecords = [];

    for (const report of reports) {
        if (!report.dailyRecords) continue;
        for (const rec of report.dailyRecords) {
            if (!rec.teacherName || !rec.dateFormatted) continue;
            const dedupeKey = `${normalizeName(rec.teacherName)}|${rec.dateFormatted}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);
            allRecords.push(rec);
        }
    }

    for (const rec of allRecords) {
        // Skip justified records
        if (rec.justified) continue;

        // Must have some issue
        const isLate = rec.tardinessMinutes > 0;
        const isEarlyExit = rec.earlyDepartureMinutes > 0;
        const isAbsent = rec.absent;
        if (!isLate && !isEarlyExit && !isAbsent) continue;

        // Resolve userId from teacherName
        const userId = nameToUser[normalizeName(rec.teacherName)];
        if (!userId) continue;

        const userBlocks = schedules[userId];
        if (!userBlocks || userBlocks.length === 0) continue;

        // Get day of week from the record
        const dayOfWeek = rec.dayOfWeek; // e.g. "Lunes", "Martes"
        if (!dayOfWeek) continue;

        const dayBlocks = userBlocks.filter(b => b.day === dayOfWeek && b.startTime !== '08:00');
        if (dayBlocks.length === 0) continue;

        let affectedBlocks = [];

        if (isAbsent) {
            // All blocks lost
            affectedBlocks = dayBlocks;
        } else {
            if (isLate && rec.tardinessMinutes > 0) {
                // Blocks whose start time < (expected entry + tardiness)
                const expectedEntryMin = timeToMinutes(rec.expectedEntry);
                if (expectedEntryMin != null) {
                    const lateUntil = expectedEntryMin + rec.tardinessMinutes;
                    const lateBlocks = dayBlocks.filter(b => {
                        const blockStart = timeToMinutes(b.startTime);
                        return blockStart != null && blockStart < lateUntil;
                    });
                    affectedBlocks.push(...lateBlocks);
                }
            }
            if (isEarlyExit && rec.earlyDepartureMinutes > 0) {
                // Blocks whose start time >= (expected exit - early departure)
                const expectedExitMin = timeToMinutes(rec.expectedExit);
                if (expectedExitMin != null) {
                    const earlyFrom = expectedExitMin - rec.earlyDepartureMinutes;
                    const earlyBlocks = dayBlocks.filter(b => {
                        const blockStart = timeToMinutes(b.startTime);
                        return blockStart != null && blockStart >= earlyFrom;
                    });
                    // Avoid duplicates if both late and early exit
                    const existingTimes = new Set(affectedBlocks.map(b => b.startTime));
                    earlyBlocks.forEach(b => {
                        if (!existingTimes.has(b.startTime)) affectedBlocks.push(b);
                    });
                }
            }
        }

        if (affectedBlocks.length === 0) continue;

        teachersSet.add(userId);
        teacherClasses[userId] = (teacherClasses[userId] || 0) + affectedBlocks.length;
        totalClasses += affectedBlocks.length;

        affectedBlocks.forEach(b => {
            if (b.course) { byCourse[b.course] = (byCourse[b.course] || 0) + 1; coursesSet.add(b.course); }
            if (b.subject) { bySubject[b.subject] = (bySubject[b.subject] || 0) + 1; }
        });
    }

    const courseData = Object.entries(byCourse).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const subjectData = Object.entries(bySubject).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Build teacher ranking
    const byTeacher = Object.entries(teacherClasses).map(([userId, count]) => {
        const u = users.find(u => u.id === userId);
        return { userId, userName: u?.name || userId, classesLost: count };
    }).sort((a, b) => b.classesLost - a.classesLost);

    // Build byDailyEvent for temporal trends
    const dailyMap = {}; // dateStr -> { classesLost, dayOfWeek, blocks }
    for (const rec of allRecords) {
        if (rec.justified) continue;
        const isLate = rec.tardinessMinutes > 0;
        const isEarlyExit = rec.earlyDepartureMinutes > 0;
        const isAbsent = rec.absent;
        if (!isLate && !isEarlyExit && !isAbsent) continue;

        const userId = nameToUser[normalizeName(rec.teacherName)];
        if (!userId) continue;
        const userBlocks = schedules[userId];
        if (!userBlocks || userBlocks.length === 0) continue;
        const dayOfWeek = rec.dayOfWeek;
        if (!dayOfWeek) continue;

        const dayBlocks = userBlocks.filter(b => b.day === dayOfWeek && b.startTime !== '08:00');
        if (dayBlocks.length === 0) continue;

        let affected = [];
        if (isAbsent) {
            affected = dayBlocks;
        } else {
            if (isLate && rec.tardinessMinutes > 0) {
                const entry = timeToMinutes(rec.expectedEntry);
                if (entry != null) {
                    const lateUntil = entry + rec.tardinessMinutes;
                    affected.push(...dayBlocks.filter(b => { const s = timeToMinutes(b.startTime); return s != null && s < lateUntil; }));
                }
            }
            if (isEarlyExit && rec.earlyDepartureMinutes > 0) {
                const exit = timeToMinutes(rec.expectedExit);
                if (exit != null) {
                    const earlyFrom = exit - rec.earlyDepartureMinutes;
                    const existSet = new Set(affected.map(b => b.startTime));
                    dayBlocks.forEach(b => { const s = timeToMinutes(b.startTime); if (s != null && s >= earlyFrom && !existSet.has(b.startTime)) affected.push(b); });
                }
            }
        }

        if (affected.length === 0) continue;

        // Parse dateFormatted (DD/MM/YYYY) to YYYY-MM-DD
        let dateStr = rec.dateFormatted;
        if (dateStr && dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        if (!dailyMap[dateStr]) dailyMap[dateStr] = { dateStr, classesLost: 0, dayOfWeek, blocks: [] };
        dailyMap[dateStr].classesLost += affected.length;
        dailyMap[dateStr].blocks.push(...affected.map(b => ({ startTime: b.startTime, course: b.course || '', subject: b.subject || '' })));
    }

    const byDailyEvent = Object.values(dailyMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    return { totalClasses, coursesAffected: coursesSet.size, teachersWithImpact: teachersSet.size, courseData, subjectData, byTeacher, byDailyEvent };
}

/**
 * Merge impact from 3 sources into unified global data for stacked charts.
 *
 * @param {{ courseData, subjectData, totalClasses, coursesAffected, teachersWithImpact, byRequest?, byLeave?, byTeacher? }} adminImpact
 * @param {{ courseData, subjectData, totalClasses, coursesAffected, teachersWithImpact, byRequest?, byLeave?, byTeacher? }} medicalImpact
 * @param {{ courseData, subjectData, totalClasses, coursesAffected, teachersWithImpact, byTeacher? }} attendanceImpact
 * @param {Array} users - users array for name resolution
 * @returns {{ totalClasses, coursesAffected, subjectsAffected, teachersWithImpact, courseStacked, subjectStacked, sourceBreakdown, teacherRanking }}
 */
export function computeGlobalImpact(adminImpact, medicalImpact, attendanceImpact, users) {
    // Aggregate courses (stacked)
    const allCourses = new Set();
    const adminByCourse = {};
    const medicalByCourse = {};
    const attendanceByCourse = {};

    (adminImpact.courseData || []).forEach(d => { adminByCourse[d.name] = d.value; allCourses.add(d.name); });
    (medicalImpact.courseData || []).forEach(d => { medicalByCourse[d.name] = d.value; allCourses.add(d.name); });
    (attendanceImpact.courseData || []).forEach(d => { attendanceByCourse[d.name] = d.value; allCourses.add(d.name); });

    const courseStacked = [...allCourses].map(name => ({
        name,
        admin: adminByCourse[name] || 0,
        medical: medicalByCourse[name] || 0,
        attendance: attendanceByCourse[name] || 0,
        total: (adminByCourse[name] || 0) + (medicalByCourse[name] || 0) + (attendanceByCourse[name] || 0),
    })).sort((a, b) => b.total - a.total);

    // Aggregate subjects (stacked)
    const allSubjects = new Set();
    const adminBySubject = {};
    const medicalBySubject = {};
    const attendanceBySubject = {};

    (adminImpact.subjectData || []).forEach(d => { adminBySubject[d.name] = d.value; allSubjects.add(d.name); });
    (medicalImpact.subjectData || []).forEach(d => { medicalBySubject[d.name] = d.value; allSubjects.add(d.name); });
    (attendanceImpact.subjectData || []).forEach(d => { attendanceBySubject[d.name] = d.value; allSubjects.add(d.name); });

    const subjectStacked = [...allSubjects].map(name => ({
        name,
        admin: adminBySubject[name] || 0,
        medical: medicalBySubject[name] || 0,
        attendance: attendanceBySubject[name] || 0,
        total: (adminBySubject[name] || 0) + (medicalBySubject[name] || 0) + (attendanceBySubject[name] || 0),
    })).sort((a, b) => b.total - a.total);

    // Source breakdown for donut
    const totalAdmin = adminImpact.totalClasses || 0;
    const totalMedical = medicalImpact.totalClasses || 0;
    const totalAttendance = attendanceImpact.totalClasses || 0;
    const totalClasses = totalAdmin + totalMedical + totalAttendance;

    const sourceBreakdown = [
        { name: 'Dias Administrativos', value: totalAdmin },
        { name: 'Licencias Medicas', value: totalMedical },
        { name: 'Atrasos/Ausencias', value: totalAttendance },
    ].filter(d => d.value > 0);

    // Merged teacher ranking
    const teacherMap = {}; // userId -> { admin, medical, attendance }

    // From admin: byRequest has userId
    (adminImpact.byRequest || []).forEach(r => {
        if (!r.userId || r.classesLost <= 0) return;
        if (!teacherMap[r.userId]) teacherMap[r.userId] = { admin: 0, medical: 0, attendance: 0 };
        teacherMap[r.userId].admin += r.classesLost;
    });

    // From medical: byLeave has userId
    (medicalImpact.byLeave || []).forEach(l => {
        if (!l.userId || l.classesLost <= 0) return;
        if (!teacherMap[l.userId]) teacherMap[l.userId] = { admin: 0, medical: 0, attendance: 0 };
        teacherMap[l.userId].medical += l.classesLost;
    });

    // From attendance: byTeacher has userId
    (attendanceImpact.byTeacher || []).forEach(t => {
        if (!t.userId || t.classesLost <= 0) return;
        if (!teacherMap[t.userId]) teacherMap[t.userId] = { admin: 0, medical: 0, attendance: 0 };
        teacherMap[t.userId].attendance += t.classesLost;
    });

    const teacherRanking = Object.entries(teacherMap).map(([userId, counts]) => {
        const u = users.find(u => u.id === userId);
        return {
            userId,
            userName: u?.name || userId,
            admin: counts.admin,
            medical: counts.medical,
            attendance: counts.attendance,
            total: counts.admin + counts.medical + counts.attendance,
        };
    }).sort((a, b) => b.total - a.total);

    // Unique teachers and courses/subjects
    const allTeachers = new Set(teacherRanking.map(t => t.userId));
    const coursesAffected = allCourses.size;
    const subjectsAffected = allSubjects.size;

    return {
        totalClasses,
        coursesAffected,
        subjectsAffected,
        teachersWithImpact: allTeachers.size,
        horasPedagogicas: totalClasses,
        courseStacked,
        subjectStacked,
        sourceBreakdown,
        teacherRanking,
    };
}

// ============================================
// ISO WEEK HELPERS
// ============================================

/** Get ISO week key from "YYYY-MM-DD" → "2026-W12" */
export function getISOWeekKey(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNum = d.getDay() || 7; // Make Sunday = 7
    d.setDate(d.getDate() + 4 - dayNum); // Set to Thursday of the week
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Convert "2026-W12" → "16/03" (Monday label for display) */
export function weekKeyToMonday(weekKey) {
    const [yearStr, wStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(wStr);
    // Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
    return `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================
// WEEKLY TREND
// ============================================

/**
 * Group classes lost by ISO week, separated by source.
 * @returns {Array<{ week, weekLabel, admin, medical, attendance }>}
 */
export function computeWeeklyTrend(adminImpact, medicalImpact, attendanceImpact) {
    const weekMap = {}; // weekKey -> { admin, medical, attendance }

    const ensure = (wk) => {
        if (!weekMap[wk]) weekMap[wk] = { admin: 0, medical: 0, attendance: 0 };
    };

    // Admin: byRequest has date + classesLost
    (adminImpact.byRequest || []).forEach(r => {
        if (!r.date || r.classesLost <= 0) return;
        const wk = getISOWeekKey(r.date);
        ensure(wk);
        weekMap[wk].admin += r.classesLost;
    });

    // Medical: byLeave has blocksDetail[].date (1 class per block)
    (medicalImpact.byLeave || []).forEach(l => {
        (l.blocksDetail || []).forEach(b => {
            if (!b.date) return;
            const wk = getISOWeekKey(b.date);
            ensure(wk);
            weekMap[wk].medical += 1;
        });
    });

    // Attendance: byDailyEvent has dateStr + classesLost
    (attendanceImpact.byDailyEvent || []).forEach(evt => {
        if (!evt.dateStr || evt.classesLost <= 0) return;
        const wk = getISOWeekKey(evt.dateStr);
        ensure(wk);
        weekMap[wk].attendance += evt.classesLost;
    });

    return Object.keys(weekMap)
        .sort()
        .map(week => ({
            week,
            weekLabel: weekKeyToMonday(week),
            admin: weekMap[week].admin,
            medical: weekMap[week].medical,
            attendance: weekMap[week].attendance,
        }));
}

// ============================================
// CUMULATIVE TREND (integral)
// ============================================

/**
 * Compute cumulative sums from weekly data.
 * @returns {Array<{ week, weekLabel, adminCum, medicalCum, attendanceCum, totalCum }>}
 */
export function computeCumulativeTrend(weeklyData) {
    let adminCum = 0, medicalCum = 0, attendanceCum = 0;
    return weeklyData.map(w => {
        adminCum += w.admin;
        medicalCum += w.medical;
        attendanceCum += w.attendance;
        return {
            week: w.week,
            weekLabel: w.weekLabel,
            adminCum,
            medicalCum,
            attendanceCum,
            totalCum: adminCum + medicalCum + attendanceCum,
        };
    });
}

// ============================================
// NORMALIZED COURSE IMPACT (% rate)
// ============================================

/**
 * Compute loss rate as percentage of scheduled classes per course.
 * @param {Array} courseStacked - from computeGlobalImpact
 * @param {Object} schedules - { userId: [{ day, startTime, course, subject }] }
 * @param {number} weeksInRange - number of school weeks in the period
 * @returns {Array<{ name, lostTotal, scheduledTotal, rate }>}
 */
export function computeNormalizedCourseImpact(courseStacked, schedules, weeksInRange) {
    // Count weekly blocks per course (across all teachers)
    const weeklyBlocksByCourse = {};
    for (const userId in schedules) {
        const blocks = schedules[userId];
        if (!blocks) continue;
        for (const b of blocks) {
            if (!b.course || b.startTime === '08:00') continue;
            weeklyBlocksByCourse[b.course] = (weeklyBlocksByCourse[b.course] || 0) + 1;
        }
    }

    const weeks = Math.max(weeksInRange, 1);

    return courseStacked.map(c => {
        const weeklyBlocks = weeklyBlocksByCourse[c.name] || 0;
        const scheduledTotal = weeklyBlocks * weeks;
        const lostTotal = c.total;
        const rate = scheduledTotal > 0 ? (lostTotal / scheduledTotal) * 100 : 0;
        return { name: c.name, lostTotal, scheduledTotal, rate: Math.round(rate * 10) / 10 };
    }).sort((a, b) => b.rate - a.rate);
}

// ============================================
// HEATMAP (day × block)
// ============================================

const BLOCK_TIMES = ['08:10', '08:55', '09:50', '10:35', '11:30', '12:15', '13:50', '14:40'];
const BLOCK_LABELS = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a'];
const HEATMAP_DAY_LABELS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

/** Map a startTime string to the closest block index (0-7), or -1 if not matched */
function timeToBlockIndex(startTime) {
    if (!startTime) return -1;
    const idx = BLOCK_TIMES.indexOf(startTime);
    if (idx >= 0) return idx;
    // Fuzzy match: find closest
    const mins = timeToMinutes(startTime);
    if (mins == null) return -1;
    let best = -1, bestDiff = Infinity;
    for (let i = 0; i < BLOCK_TIMES.length; i++) {
        const diff = Math.abs(timeToMinutes(BLOCK_TIMES[i]) - mins);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    return bestDiff <= 30 ? best : -1;
}

/** Map day name to index (0=Lunes ... 4=Viernes), -1 if weekend */
function dayNameToIndex(dayName) {
    const map = { 'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Miercoles': 2, 'Jueves': 3, 'Viernes': 4 };
    return map[dayName] ?? -1;
}

/**
 * Build 5×8 heatmap grid (days × blocks) of classes lost.
 * @returns {{ grid: number[][], dayLabels: string[], blockLabels: string[], maxValue: number }}
 */
export function computeHeatmap(adminImpact, medicalImpact, attendanceImpact) {
    // 5 days × 8 blocks
    const grid = Array.from({ length: 5 }, () => Array(8).fill(0));

    const addBlock = (dayName, startTime) => {
        const di = dayNameToIndex(dayName);
        const bi = timeToBlockIndex(startTime);
        if (di >= 0 && bi >= 0) grid[di][bi]++;
    };

    // Admin: byRequest has blocksDetail with startTime, and date for day resolution
    (adminImpact.byRequest || []).forEach(r => {
        if (!r.date) return;
        const d = new Date(r.date + 'T00:00:00');
        const dayName = DAY_NAMES[d.getDay()];
        (r.blocksDetail || []).forEach(b => addBlock(dayName, b.startTime));
    });

    // Medical: byLeave has blocksDetail with dayName + startTime
    (medicalImpact.byLeave || []).forEach(l => {
        (l.blocksDetail || []).forEach(b => addBlock(b.dayName, b.startTime));
    });

    // Attendance: byDailyEvent has dayOfWeek + blocks[].startTime
    (attendanceImpact.byDailyEvent || []).forEach(evt => {
        (evt.blocks || []).forEach(b => addBlock(evt.dayOfWeek, b.startTime));
    });

    let maxValue = 0;
    for (const row of grid) for (const v of row) if (v > maxValue) maxValue = v;

    return { grid, dayLabels: HEATMAP_DAY_LABELS, blockLabels: BLOCK_LABELS, maxValue };
}
