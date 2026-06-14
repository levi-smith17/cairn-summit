"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseICSEvents = parseICSEvents;
exports.fetchSubscriptionEvents = fetchSubscriptionEvents;
function parseICSDate(value) {
    if (/^\d{8}$/.test(value)) {
        const y = parseInt(value.slice(0, 4), 10);
        const m = parseInt(value.slice(4, 6), 10) - 1;
        const d = parseInt(value.slice(6, 8), 10);
        return { date: new Date(y, m, d), allDay: true };
    }
    if (value.endsWith('Z')) {
        return {
            date: new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')),
            allDay: false,
        };
    }
    const m = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (m) {
        return {
            date: new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]),
            allDay: false,
        };
    }
    return { date: new Date(value), allDay: false };
}
function extractICSValue(ics, key) {
    const re = new RegExp(`^${key}(?:;[^:]*)?:(.+)$`, 'm');
    const match = ics.match(re);
    return match ? match[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() : null;
}
function extractVEvents(icsString) {
    const events = [];
    const re = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    let match;
    while ((match = re.exec(icsString)) !== null) {
        events.push(match[0]);
    }
    return events;
}
function parseRRule(rrule) {
    const parts = {};
    rrule.split(';').forEach(p => {
        const idx = p.indexOf('=');
        if (idx !== -1)
            parts[p.slice(0, idx)] = p.slice(idx + 1);
    });
    return parts;
}
function expandRRule(base, rrule, exDates, from, to) {
    const rule = parseRRule(rrule);
    const freq = rule.FREQ;
    const interval = parseInt(rule.INTERVAL ?? '1', 10);
    const count = rule.COUNT ? parseInt(rule.COUNT, 10) : Infinity;
    const until = rule.UNTIL ? parseICSDate(rule.UNTIL).date : null;
    const byDay = rule.BYDAY ? rule.BYDAY.split(',') : null;
    const DOW = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    const duration = base.endDate ? base.endDate.getTime() - base.startDate.getTime() : 0;
    const endLimit = until && until < to ? until : to;
    const results = [];
    let current = new Date(base.startDate);
    let n = 0;
    while (current <= endLimit && n < count && n < 2000) {
        const dateKey = current.toISOString().slice(0, 10);
        const inWindow = current >= from && current <= to;
        const notExcluded = !exDates.has(dateKey);
        if (inWindow && notExcluded) {
            results.push({
                ...base,
                uid: `${base.uid}:${current.toISOString()}`,
                startDate: new Date(current),
                endDate: duration > 0 ? new Date(current.getTime() + duration) : null,
            });
        }
        const next = new Date(current);
        switch (freq) {
            case 'DAILY':
                next.setDate(next.getDate() + interval);
                break;
            case 'WEEKLY':
                if (byDay && byDay.length > 1) {
                    next.setDate(next.getDate() + 1);
                    let found = false;
                    for (let i = 0; i < 7 * interval; i++) {
                        const dayAbbr = Object.keys(DOW).find(k => DOW[k] === next.getDay());
                        if (dayAbbr && byDay.some(d => d.endsWith(dayAbbr))) {
                            found = true;
                            break;
                        }
                        next.setDate(next.getDate() + 1);
                    }
                    if (!found)
                        break;
                }
                else {
                    next.setDate(next.getDate() + 7 * interval);
                }
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + interval);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + interval);
                break;
            default:
                return results;
        }
        current = next;
        n++;
    }
    return results;
}
function parseICSEvents(icsString, url, from, to) {
    const windowFrom = from ?? new Date(0);
    const windowTo = to ?? new Date(8640000000000000);
    const overrides = new Set();
    const vevents = extractVEvents(icsString);
    for (const vevent of vevents) {
        const uid = extractICSValue(vevent, 'UID');
        const recId = extractICSValue(vevent, 'RECURRENCE-ID');
        if (uid && recId) {
            const parsed = parseICSDate(recId);
            overrides.add(`${uid}:${parsed.date.toISOString().slice(0, 10)}`);
        }
    }
    return vevents.flatMap(vevent => {
        const uid = extractICSValue(vevent, 'UID');
        const summary = extractICSValue(vevent, 'SUMMARY');
        const dtstart = extractICSValue(vevent, 'DTSTART');
        const dtend = extractICSValue(vevent, 'DTEND');
        const description = extractICSValue(vevent, 'DESCRIPTION');
        const location = extractICSValue(vevent, 'LOCATION');
        const rrule = extractICSValue(vevent, 'RRULE');
        const recId = extractICSValue(vevent, 'RECURRENCE-ID');
        if (!uid || !dtstart)
            return [];
        const start = parseICSDate(dtstart);
        const end = dtend ? parseICSDate(dtend) : null;
        let endDate = end?.date ?? null;
        if (start.allDay && endDate) {
            const adj = new Date(endDate);
            adj.setDate(adj.getDate() - 1);
            endDate = adj;
        }
        const base = {
            uid,
            url,
            title: summary ?? '(No title)',
            startDate: start.date,
            endDate,
            allDay: start.allDay,
            notes: description,
            location,
            recurrenceRule: rrule ?? null,
        };
        if (recId) {
            return start.date >= windowFrom && start.date <= windowTo ? [base] : [];
        }
        if (rrule) {
            const exDates = new Set();
            const exDateRaw = extractICSValue(vevent, 'EXDATE');
            if (exDateRaw) {
                exDateRaw.split(',').forEach(v => {
                    const d = parseICSDate(v.trim());
                    exDates.add(d.date.toISOString().slice(0, 10));
                });
            }
            return expandRRule(base, rrule, exDates, windowFrom, windowTo)
                .filter(e => !overrides.has(`${uid}:${e.startDate.toISOString().slice(0, 10)}`));
        }
        return start.date >= windowFrom && start.date <= windowTo ? [base] : [];
    });
}
async function fetchSubscriptionEvents(feedUrl, from, to) {
    const url = feedUrl.replace(/^webcal:\/\//i, 'https://');
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Failed to fetch feed (${res.status})`);
    const icsString = await res.text();
    return parseICSEvents(icsString, url, from, to);
}
//# sourceMappingURL=ical.js.map