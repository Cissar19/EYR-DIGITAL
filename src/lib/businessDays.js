/**
 * Checks if a date falls on a business day (Mon-Fri).
 * @param {Date} date
 * @returns {boolean}
 */
export function isBusinessDay(date) {
    const day = date.getDay();
    return day !== 0 && day !== 6;
}

/**
 * Returns the ISO date string (YYYY-MM-DD) of the n-th business day
 * after the given date string, skipping weekends and Chilean holidays.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {number} n - number of business days to add
 * @param {Set<string>} [holidays] - optional set of holiday date strings to skip
 * @returns {string} ISO date string
 */
export function addBusinessDays(dateStr, n, holidays = new Set()) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    let added = 0;
    while (added < n) {
        date.setDate(date.getDate() + 1);
        const iso = date.toISOString().split('T')[0];
        if (isBusinessDay(date) && !holidays.has(iso)) {
            added++;
        }
    }
    return date.toISOString().split('T')[0];
}

/**
 * Counts business days (Mon-Fri, excluding holidays) between two ISO date strings.
 * Does not count the start date; counts the end date if it's a business day.
 * @param {string} fromStr
 * @param {string} toStr
 * @param {Set<string>} [holidays]
 * @returns {number}
 */
export function countBusinessDays(fromStr, toStr, holidays = new Set()) {
    const from = new Date(fromStr + 'T12:00:00');
    const to   = new Date(toStr   + 'T12:00:00');
    let count  = 0;
    const cursor = new Date(from);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= to) {
        const iso = cursor.toISOString().slice(0, 10);
        if (isBusinessDay(cursor) && !holidays.has(iso)) count++;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}
