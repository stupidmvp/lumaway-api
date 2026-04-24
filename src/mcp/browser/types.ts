export type BrowserToolName =
    | 'navigate'
    | 'click'
    | 'fill'
    | 'select'
    | 'waitFor'
    | 'extractText'
    | 'screenshot'
    | 'runFlow';

export interface BrowserSessionRef {
    id: string;
    page: any;
    context: any;
    browser: any;
    lastUsedAt: number;
}

export interface BrowserToolResult<T = unknown> {
    ok: boolean;
    tool: BrowserToolName;
    sessionId: string;
    data?: T;
    error?: string;
}

export interface BrowserFlowStep {
    tool: Exclude<BrowserToolName, 'runFlow'>;
    args?: Record<string, unknown>;
}

