import type { BrowserSessionRef } from './types';

type PlaywrightModule = {
    chromium: {
        launch: (args?: Record<string, unknown>) => Promise<any>;
    };
};

export class BrowserSessionManager {
    private sessions = new Map<string, BrowserSessionRef>();
    private readonly ttlMs: number;
    private gcTimer: NodeJS.Timeout | null = null;

    constructor(ttlMs = 15 * 60 * 1000) {
        this.ttlMs = ttlMs;
        this.startGc();
    }

    async getOrCreate(sessionId?: string): Promise<BrowserSessionRef> {
        const id = sessionId?.trim() || crypto.randomUUID();
        const existing = this.sessions.get(id);
        if (existing) {
            existing.lastUsedAt = Date.now();
            return existing;
        }

        const playwright = await this.loadPlaywright();
        const browser = await playwright.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const context = await browser.newContext({
            viewport: { width: 1366, height: 768 },
        });
        const page = await context.newPage();

        const ref: BrowserSessionRef = {
            id,
            page,
            context,
            browser,
            lastUsedAt: Date.now(),
        };
        this.sessions.set(id, ref);
        return ref;
    }

    async close(sessionId: string): Promise<boolean> {
        const ref = this.sessions.get(sessionId);
        if (!ref) return false;
        this.sessions.delete(sessionId);
        await this.safeClose(ref);
        return true;
    }

    async closeAll(): Promise<void> {
        const refs = Array.from(this.sessions.values());
        this.sessions.clear();
        await Promise.all(refs.map((ref) => this.safeClose(ref)));
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
            this.gcTimer = null;
        }
    }

    private async loadPlaywright(): Promise<PlaywrightModule> {
        try {
            const mod = await import('playwright');
            return mod as unknown as PlaywrightModule;
        } catch {
            throw new Error('Playwright dependency is missing. Install with: pnpm add playwright');
        }
    }

    private async safeClose(ref: BrowserSessionRef): Promise<void> {
        try {
            await ref.page?.close?.();
        } catch { }
        try {
            await ref.context?.close?.();
        } catch { }
        try {
            await ref.browser?.close?.();
        } catch { }
    }

    private startGc() {
        if (this.gcTimer) return;
        this.gcTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, ref] of this.sessions.entries()) {
                if (now - ref.lastUsedAt > this.ttlMs) {
                    this.sessions.delete(id);
                    this.safeClose(ref).catch(() => undefined);
                }
            }
        }, Math.min(this.ttlMs, 60_000));
        this.gcTimer.unref?.();
    }
}
