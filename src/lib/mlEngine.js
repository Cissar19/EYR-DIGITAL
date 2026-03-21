// ============================================
// ML Engine — Predictive analytics (client-side)
// Weighted moving averages, linear regression,
// multifactor scoring, z-score anomaly detection
// ============================================

import { getISOWeekKey, weekKeyToMonday } from './impactCalculations';

// ────────────────────────────────────────────
// 1. FORECAST: Weighted Moving Average
// ────────────────────────────────────────────

/**
 * Forecast weekly absences using weighted moving average.
 * @param {Array<{week, admin, medical, attendance}>} weeklyTrendData - from computeWeeklyTrend
 * @param {number} weeksAhead - how many weeks to project (default 4)
 * @returns {{ historical: Array, forecast: Array, nextWeekEstimate: number }}
 */
export function forecastWeeklyAbsences(weeklyTrendData, weeksAhead = 4) {
    if (!weeklyTrendData || weeklyTrendData.length === 0) {
        return { historical: [], forecast: [], nextWeekEstimate: 0 };
    }

    // Build total per week
    const historical = weeklyTrendData.map(w => ({
        week: w.week,
        weekLabel: w.weekLabel,
        total: (w.admin || 0) + (w.medical || 0) + (w.attendance || 0),
    }));

    // Use last 6 weeks (or fewer) for weighted average
    const windowSize = Math.min(6, historical.length);
    const window = historical.slice(-windowSize);

    // Exponentially decaying weights: most recent = highest
    const weights = [];
    for (let i = 0; i < windowSize; i++) {
        weights.push(Math.pow(0.7, windowSize - 1 - i));
    }
    const weightSum = weights.reduce((a, b) => a + b, 0);

    const weightedAvg = window.reduce((sum, w, i) => sum + w.total * weights[i], 0) / weightSum;

    // Standard deviation for confidence band
    const values = window.map(w => w.total);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Generate forecast weeks
    const lastWeek = historical[historical.length - 1];
    const forecast = [];

    for (let i = 1; i <= weeksAhead; i++) {
        const nextWeekKey = advanceWeekKey(lastWeek.week, i);
        const nextLabel = weekKeyToMonday(nextWeekKey);
        forecast.push({
            week: nextWeekKey,
            weekLabel: nextLabel,
            total: Math.round(weightedAvg),
            upper: Math.round(weightedAvg + stdDev),
            lower: Math.max(0, Math.round(weightedAvg - stdDev)),
        });
    }

    return {
        historical,
        forecast,
        nextWeekEstimate: Math.round(weightedAvg),
    };
}

/** Advance an ISO week key by N weeks: "2026-W12" + 2 → "2026-W14" */
function advanceWeekKey(weekKey, n) {
    const [yearStr, wStr] = weekKey.split('-W');
    let year = parseInt(yearStr);
    let week = parseInt(wStr) + n;
    // Simple overflow: ISO weeks are 1..52 (or 53)
    while (week > 52) { week -= 52; year++; }
    return `${year}-W${String(week).padStart(2, '0')}`;
}

// ────────────────────────────────────────────
// 2. BALANCE DEPLETION: Linear Regression
// ────────────────────────────────────────────

/**
 * Predict when each teacher will deplete their admin day balance.
 * @param {Array} requests - all admin day requests
 * @param {Function} getBalance - getBalance(userId) → number
 * @param {Array} users - users list
 * @returns {Array<{userId, userName, balance, monthlyRate, depletionDate, monthsRemaining, riskLevel}>}
 */
export function predictBalanceDepletion(requests, getBalance, users) {
    const teacherStaff = users.filter(u => ['teacher', 'staff'].includes(u.role));
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const results = teacherStaff.map(user => {
        const balance = getBalance(user.id);

        // Get approved requests that consume days (not hour_return)
        const userReqs = requests.filter(r =>
            r.userId === user.id &&
            r.status === 'approved' &&
            r.type !== 'hour_return' &&
            r.type !== 'hour_permission' &&
            r.date
        );

        // Group by month to compute monthly usage rate
        const monthlyUsage = {};
        userReqs.forEach(r => {
            const month = r.date.substring(0, 7); // "YYYY-MM"
            const cost = r.isHalfDay ? 0.5 : 1;
            monthlyUsage[month] = (monthlyUsage[month] || 0) + cost;
        });

        const months = Object.keys(monthlyUsage).sort();
        if (months.length === 0) {
            return {
                userId: user.id,
                userName: user.name,
                balance,
                monthlyRate: 0,
                depletionDate: null,
                monthsRemaining: null,
                riskLevel: 'green',
            };
        }

        // Simple linear regression on monthly usage
        const rates = months.map(m => monthlyUsage[m]);
        const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

        // Estimate months until depletion
        let monthsRemaining = null;
        let depletionDate = null;
        let riskLevel = 'green';

        if (balance <= 0) {
            monthsRemaining = 0;
            depletionDate = 'Agotado';
            riskLevel = 'red';
        } else if (avgRate > 0) {
            monthsRemaining = balance / avgRate;
            const deplDate = new Date(now);
            deplDate.setMonth(deplDate.getMonth() + Math.ceil(monthsRemaining));
            depletionDate = deplDate.toISOString().split('T')[0];

            if (monthsRemaining < 1) riskLevel = 'red';
            else if (monthsRemaining < 3) riskLevel = 'yellow';
            else riskLevel = 'green';

            // Also red if depletion is before end of year and < 3 months
            if (deplDate <= endOfYear && monthsRemaining < 3) {
                riskLevel = monthsRemaining < 1 ? 'red' : 'yellow';
            }
        }

        return {
            userId: user.id,
            userName: user.name,
            balance,
            monthlyRate: Math.round(avgRate * 10) / 10,
            depletionDate,
            monthsRemaining: monthsRemaining !== null ? Math.round(monthsRemaining * 10) / 10 : null,
            riskLevel,
        };
    });

    // Sort: red first, then yellow, then green; within same level by monthsRemaining ascending
    const riskOrder = { red: 0, yellow: 1, green: 2 };
    return results
        .filter(r => r.monthlyRate > 0 || r.balance <= 0)
        .sort((a, b) => {
            const orderDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            if (orderDiff !== 0) return orderDiff;
            if (a.monthsRemaining === null) return 1;
            if (b.monthsRemaining === null) return -1;
            return a.monthsRemaining - b.monthsRemaining;
        });
}

// ────────────────────────────────────────────
// 3. STUDENT RISK: Multifactor Scoring
// ────────────────────────────────────────────

const SEVERITY_WEIGHTS = { leve: 1, grave: 3, muy_grave: 5 };
const RISK_FACTORS = {
    justificatives: 0.25,
    medicalRepeat: 0.15,
    incidents: 0.30,
    entrevistas: 0.20,
    unresolvedIncidents: 0.10,
};

/**
 * Compute risk scores for students based on multiple factors.
 * @param {Array} justificatives - from JustificativesContext
 * @param {Array} incidents - from IncidentsContext
 * @param {Array} entrevistas - from EntrevistasContext
 * @returns {Array<{studentId, studentName, studentCurso, score, factors, riskLevel}>}
 */
export function computeStudentRiskScores(justificatives, incidents, entrevistas) {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoff = ninetyDaysAgo.toISOString().split('T')[0];

    // Build per-student accumulators
    const studentMap = {};

    const ensure = (id, name, curso) => {
        if (!studentMap[id]) {
            studentMap[id] = {
                studentId: id,
                studentName: name || id,
                studentCurso: curso || '',
                justCount: 0,
                medicalCount: 0,
                incidentScore: 0,
                entrevistaCount: 0,
                unresolvedCount: 0,
            };
        }
    };

    // Justificatives last 90 days
    justificatives.forEach(j => {
        if (!j.studentId || !j.date || j.date < cutoff) return;
        ensure(j.studentId, j.studentName, j.studentCurso);
        studentMap[j.studentId].justCount++;
        if (j.type === 'medico') studentMap[j.studentId].medicalCount++;
    });

    // Incidents (all time for severity, but weight recent more)
    incidents.forEach(inc => {
        if (!inc.studentId) return;
        ensure(inc.studentId, inc.studentName, inc.studentCurso);
        const weight = SEVERITY_WEIGHTS[inc.severity] || 1;
        // Recent incidents (last 90 days) count double
        const isRecent = inc.date && inc.date >= cutoff;
        studentMap[inc.studentId].incidentScore += weight * (isRecent ? 2 : 1);
        if (inc.status !== 'resuelta') {
            studentMap[inc.studentId].unresolvedCount++;
        }
    });

    // Entrevistas (last 90 days)
    entrevistas.forEach(e => {
        if (!e.studentId) return;
        const entDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : null);
        if (!entDate || entDate < cutoff) return;
        ensure(e.studentId, e.studentName, e.studentCurso);
        studentMap[e.studentId].entrevistaCount++;
    });

    // Compute normalized scores
    const students = Object.values(studentMap);
    if (students.length === 0) return [];

    // Find maxima for normalization
    const maxJust = Math.max(1, ...students.map(s => s.justCount));
    const maxMedical = Math.max(1, ...students.map(s => s.medicalCount));
    const maxIncident = Math.max(1, ...students.map(s => s.incidentScore));
    const maxEntrevista = Math.max(1, ...students.map(s => s.entrevistaCount));
    const maxUnresolved = Math.max(1, ...students.map(s => s.unresolvedCount));

    return students.map(s => {
        const normJust = s.justCount / maxJust;
        const normMedical = s.medicalCount / maxMedical;
        const normIncident = s.incidentScore / maxIncident;
        const normEntrevista = s.entrevistaCount / maxEntrevista;
        const normUnresolved = s.unresolvedCount / maxUnresolved;

        const score =
            normJust * RISK_FACTORS.justificatives +
            normMedical * RISK_FACTORS.medicalRepeat +
            normIncident * RISK_FACTORS.incidents +
            normEntrevista * RISK_FACTORS.entrevistas +
            normUnresolved * RISK_FACTORS.unresolvedIncidents;

        const factors = [
            { name: 'Justificativos', value: s.justCount, weight: RISK_FACTORS.justificatives, normalized: normJust },
            { name: 'Medicos reiterados', value: s.medicalCount, weight: RISK_FACTORS.medicalRepeat, normalized: normMedical },
            { name: 'Incidencias', value: s.incidentScore, weight: RISK_FACTORS.incidents, normalized: normIncident },
            { name: 'Entrevistas', value: s.entrevistaCount, weight: RISK_FACTORS.entrevistas, normalized: normEntrevista },
            { name: 'Inc. no resueltas', value: s.unresolvedCount, weight: RISK_FACTORS.unresolvedIncidents, normalized: normUnresolved },
        ];

        let riskLevel = 'low';
        if (score >= 0.6) riskLevel = 'high';
        else if (score >= 0.3) riskLevel = 'medium';

        return {
            studentId: s.studentId,
            studentName: s.studentName,
            studentCurso: s.studentCurso,
            score: Math.round(score * 100),
            factors,
            riskLevel,
        };
    })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

// ────────────────────────────────────────────
// 4. ANOMALY DETECTION: Z-Score
// ────────────────────────────────────────────

/**
 * Detect anomalies in the current week using z-scores.
 * Alerts when current week > mean + 1.5 * stdDev
 * @param {Array} weeklyTrendData - from computeWeeklyTrend
 * @param {Array} justificatives
 * @param {Array} incidents
 * @param {Array} tickets
 * @returns {Array<{metric, currentValue, mean, stdDev, zScore, severity}>}
 */
export function detectAnomalies(weeklyTrendData, justificatives, incidents, tickets) {
    const alerts = [];
    const now = new Date();
    const currentWeek = getISOWeekKey(now.toISOString().split('T')[0]);

    // 1. Classes lost this week vs historical
    if (weeklyTrendData && weeklyTrendData.length >= 3) {
        const totals = weeklyTrendData.map(w => (w.admin || 0) + (w.medical || 0) + (w.attendance || 0));
        const currentWeekData = weeklyTrendData.find(w => w.week === currentWeek);
        const currentTotal = currentWeekData
            ? (currentWeekData.admin || 0) + (currentWeekData.medical || 0) + (currentWeekData.attendance || 0)
            : 0;

        const alert = computeZScoreAlert('Clases perdidas', totals, currentTotal);
        if (alert) alerts.push(alert);
    }

    // 2. Justificatives this week vs weekly averages
    if (justificatives && justificatives.length > 0) {
        const weekBuckets = {};
        justificatives.forEach(j => {
            if (!j.date) return;
            const wk = getISOWeekKey(j.date);
            weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
        });
        const weeklyCounts = Object.values(weekBuckets);
        const currentCount = weekBuckets[currentWeek] || 0;

        if (weeklyCounts.length >= 3) {
            const alert = computeZScoreAlert('Justificativos nuevos', weeklyCounts, currentCount);
            if (alert) alerts.push(alert);
        }
    }

    // 3. Incidents this week
    if (incidents && incidents.length > 0) {
        const weekBuckets = {};
        incidents.forEach(inc => {
            if (!inc.date) return;
            const wk = getISOWeekKey(inc.date);
            weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
        });
        const weeklyCounts = Object.values(weekBuckets);
        const currentCount = weekBuckets[currentWeek] || 0;

        if (weeklyCounts.length >= 3) {
            const alert = computeZScoreAlert('Incidencias nuevas', weeklyCounts, currentCount);
            if (alert) alerts.push(alert);
        }
    }

    // 4. Open tickets this week
    if (tickets && tickets.length > 0) {
        const weekBuckets = {};
        tickets.forEach(t => {
            if (!t.createdAt) return;
            const dateStr = typeof t.createdAt === 'string'
                ? t.createdAt.split('T')[0]
                : new Date(t.createdAt.seconds * 1000).toISOString().split('T')[0];
            const wk = getISOWeekKey(dateStr);
            weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
        });
        const weeklyCounts = Object.values(weekBuckets);
        const currentCount = weekBuckets[currentWeek] || 0;

        if (weeklyCounts.length >= 3) {
            const alert = computeZScoreAlert('Tickets abiertos', weeklyCounts, currentCount);
            if (alert) alerts.push(alert);
        }
    }

    return alerts;
}

/**
 * Compute z-score and return an alert object if anomalous.
 * @returns {object|null} Alert if z > 1.5, null otherwise
 */
function computeZScoreAlert(metric, historicalValues, currentValue) {
    const n = historicalValues.length;
    const mean = historicalValues.reduce((a, b) => a + b, 0) / n;
    const variance = historicalValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Avoid division by zero
    if (stdDev === 0) return null;

    const zScore = (currentValue - mean) / stdDev;

    if (zScore > 1.5) {
        return {
            metric,
            currentValue,
            mean: Math.round(mean * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            zScore: Math.round(zScore * 10) / 10,
            severity: zScore > 2.5 ? 'red' : 'orange',
        };
    }

    return null;
}
