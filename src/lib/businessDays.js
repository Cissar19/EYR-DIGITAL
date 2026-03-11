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
 * after the given date string.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {number} n - number of business days to add
 * @returns {string} ISO date string
 */
export function addBusinessDays(dateStr, n) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    let added = 0;
    while (added < n) {
        date.setDate(date.getDate() + 1);
        if (isBusinessDay(date)) {
            added++;
        }
    }
    return date.toISOString().split('T')[0];
}
