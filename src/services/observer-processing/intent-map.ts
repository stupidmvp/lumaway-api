type IngestEvent = {
    type: 'click' | 'input' | 'change' | 'navigation' | 'scroll' | 'custom';
    timestampMs: number;
    url?: string | null;
    targetSelector?: string | null;
    label?: string | null;
    payload?: Record<string, any>;
};

type IntentMapEntry = {
    key: string;
    type: IngestEvent['type'];
    selector: string | null;
    label: string | null;
    urlPath: string | null;
    count: number;
    firstTimestampMs: number;
    lastTimestampMs: number;
    exampleValue: string | null;
};

type IntentMap = {
    version: 1;
    updatedAt: string;
    eventCount: number;
    firstTimestampMs: number | null;
    lastTimestampMs: number | null;
    entries: IntentMapEntry[];
};

function normalizeText(value: string | null | undefined): string {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeSelector(selector: string | null | undefined): string {
    const raw = String(selector || '').trim();
    if (!raw) return '';
    return raw
        .replace(/:nth-child\(\d+\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeUrlPath(url: string | null | undefined): string {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return String(url).trim();
    }
}

function safeExampleValue(event: IngestEvent): string | null {
    const payload = event.payload || {};
    const value = typeof payload.value === 'string'
        ? payload.value
        : typeof payload.text === 'string'
            ? payload.text
            : '';
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;
    return cleaned.length > 90 ? `${cleaned.slice(0, 89)}…` : cleaned;
}

function buildKey(event: IngestEvent): string {
    return [
        event.type,
        normalizeSelector(event.targetSelector),
        normalizeText(event.label),
        normalizeUrlPath(event.url),
    ].join('|');
}

export function patchProcessingSummaryWithIntentMap(
    currentSummary: Record<string, any> | null | undefined,
    events: IngestEvent[]
): Record<string, any> {
    const baseSummary = (currentSummary && typeof currentSummary === 'object') ? currentSummary : {};
    const previousMap = (baseSummary.intentMap && typeof baseSummary.intentMap === 'object')
        ? baseSummary.intentMap as Partial<IntentMap>
        : undefined;

    const entriesByKey = new Map<string, IntentMapEntry>();
    for (const previous of previousMap?.entries || []) {
        if (!previous?.key) continue;
        entriesByKey.set(previous.key, {
            key: previous.key,
            type: previous.type || 'custom',
            selector: previous.selector || null,
            label: previous.label || null,
            urlPath: previous.urlPath || null,
            count: Number(previous.count || 0),
            firstTimestampMs: Number(previous.firstTimestampMs || 0),
            lastTimestampMs: Number(previous.lastTimestampMs || 0),
            exampleValue: previous.exampleValue || null,
        });
    }

    for (const event of events) {
        const key = buildKey(event);
        const selector = normalizeSelector(event.targetSelector) || null;
        const label = normalizeText(event.label) || null;
        const urlPath = normalizeUrlPath(event.url) || null;
        const timestamp = Number(event.timestampMs || 0);
        const exampleValue = safeExampleValue(event);
        const current = entriesByKey.get(key);

        if (!current) {
            entriesByKey.set(key, {
                key,
                type: event.type,
                selector,
                label,
                urlPath,
                count: 1,
                firstTimestampMs: timestamp,
                lastTimestampMs: timestamp,
                exampleValue,
            });
            continue;
        }

        current.count += 1;
        current.lastTimestampMs = Math.max(current.lastTimestampMs, timestamp);
        current.firstTimestampMs = Math.min(current.firstTimestampMs, timestamp);
        if (!current.exampleValue && exampleValue) current.exampleValue = exampleValue;
    }

    // Keep map bounded to avoid unbounded growth for long sessions.
    const entries = Array.from(entriesByKey.values())
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return b.lastTimestampMs - a.lastTimestampMs;
        })
        .slice(0, 300);

    const previousEventCount = Number(previousMap?.eventCount || 0);
    const incomingFirst = events.length ? Math.min(...events.map((item) => item.timestampMs)) : null;
    const incomingLast = events.length ? Math.max(...events.map((item) => item.timestampMs)) : null;
    const previousFirst = typeof previousMap?.firstTimestampMs === 'number' ? previousMap.firstTimestampMs : null;
    const previousLast = typeof previousMap?.lastTimestampMs === 'number' ? previousMap.lastTimestampMs : null;

    const intentMap: IntentMap = {
        version: 1,
        updatedAt: new Date().toISOString(),
        eventCount: previousEventCount + events.length,
        firstTimestampMs: incomingFirst == null
            ? previousFirst
            : previousFirst == null ? incomingFirst : Math.min(previousFirst, incomingFirst),
        lastTimestampMs: incomingLast == null
            ? previousLast
            : previousLast == null ? incomingLast : Math.max(previousLast, incomingLast),
        entries,
    };

    return {
        ...baseSummary,
        intentMap,
    };
}

