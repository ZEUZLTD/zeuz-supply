export type TimeframeMode = 'today' | 'week' | 'month' | 'year' | 'financial_year' | 'all' | 'custom';

export function getStartEndDates(mode: TimeframeMode, referenceDate: Date = new Date()): { from: string | undefined, to: string | undefined, label: string } {
    const from = new Date(referenceDate);
    const to = new Date(referenceDate);

    // Reset Reference Date to start of day to avoid time drift
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    let label = '';

    switch (mode) {
        case 'today':
            // Today is just 00:00 to 23:59 of ref date
            label = from.toLocaleDateString();
            break;
        case 'week': {
            // Monday start
            const day = from.getDay();
            const diff = from.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            from.setDate(diff);
            to.setDate(diff + 6);
            label = `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
            break;
        }
        case 'month': {
            from.setDate(1);
            to.setMonth(to.getMonth() + 1);
            to.setDate(0); // last day of month
            label = from.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            break;
        }
        case 'year': {
            from.setMonth(0, 1);
            to.setFullYear(to.getFullYear(), 11, 31);
            label = from.getFullYear().toString();
            break;
        }
        case 'financial_year': {
            // UK Financial Year: April 6 to April 5
            // Determine which FY 'referenceDate' is in.
            // If Jan-April (before 6th), it belongs to previous year's FY start.
            if (referenceDate.getMonth() < 3 || (referenceDate.getMonth() === 3 && referenceDate.getDate() < 6)) {
                from.setFullYear(referenceDate.getFullYear() - 1, 3, 6); // April 6 Prev Year
                to.setFullYear(referenceDate.getFullYear(), 3, 5); // April 5 This Year
            } else {
                from.setFullYear(referenceDate.getFullYear(), 3, 6); // April 6 This Year
                to.setFullYear(referenceDate.getFullYear() + 1, 3, 5); // April 5 Next Year
            }
            label = `FY ${from.getFullYear()}/${to.getFullYear().toString().slice(2)}`;
            break;
        }
        case 'all':
            return { from: undefined, to: undefined, label: 'All Time' };
        case 'custom':
            return { from: undefined, to: undefined, label: 'Custom' };
    }

    return {
        from: from.toISOString(),
        to: to.toISOString(),
        label
    };
}

export function adjustDate(date: Date, mode: TimeframeMode, direction: 'prev' | 'next'): Date {
    const newDate = new Date(date);
    const factor = direction === 'next' ? 1 : -1;

    switch (mode) {
        case 'today':
            newDate.setDate(newDate.getDate() + factor);
            break;
        case 'week':
            newDate.setDate(newDate.getDate() + (7 * factor));
            break;
        case 'month':
            newDate.setMonth(newDate.getMonth() + factor);
            break;
        case 'year':
        case 'financial_year':
            newDate.setFullYear(newDate.getFullYear() + factor);
            break;
    }
    return newDate;
}
