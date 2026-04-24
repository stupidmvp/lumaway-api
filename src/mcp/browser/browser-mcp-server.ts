import { assertNavigateAllowed, assertSelectorAllowed } from './guardrails';
import { BrowserSessionManager } from './session-manager';
import type { BrowserFlowStep, BrowserToolName, BrowserToolResult } from './types';

function toTimeout(value: unknown, fallback = 10_000): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(Math.max(n, 100), 120_000);
}

function toStringArg(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export class BrowserMcpServer {
    constructor(private sessions: BrowserSessionManager) { }

    async execute(
        tool: BrowserToolName,
        args: Record<string, unknown> = {},
        sessionId?: string,
    ): Promise<BrowserToolResult> {
        try {
            const session = await this.sessions.getOrCreate(sessionId);
            let data: unknown;
            switch (tool) {
                case 'navigate':
                    data = await this.navigate(session.page, args);
                    break;
                case 'click':
                    data = await this.click(session.page, args);
                    break;
                case 'fill':
                    data = await this.fill(session.page, args);
                    break;
                case 'select':
                    data = await this.select(session.page, args);
                    break;
                case 'waitFor':
                    data = await this.waitFor(session.page, args);
                    break;
                case 'extractText':
                    data = await this.extractText(session.page, args);
                    break;
                case 'screenshot':
                    data = await this.screenshot(session.page, args);
                    break;
                case 'runFlow':
                    data = await this.runFlow(session.id, args);
                    break;
                default:
                    throw new Error(`Unknown tool: ${tool}`);
            }
            session.lastUsedAt = Date.now();
            return {
                ok: true,
                tool,
                sessionId: session.id,
                data,
            };
        } catch (error: any) {
            return {
                ok: false,
                tool,
                sessionId: sessionId || 'uninitialized',
                error: error?.message || `Tool ${tool} failed`,
            };
        }
    }

    private async navigate(page: any, args: Record<string, unknown>) {
        const url = toStringArg(args.url);
        assertNavigateAllowed(url);
        const timeout = toTimeout(args.timeout, 20_000);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        return {
            url: page.url(),
            title: await page.title(),
        };
    }

    private async click(page: any, args: Record<string, unknown>) {
        const selector = toStringArg(args.selector);
        assertSelectorAllowed(selector, 'click');
        const timeout = toTimeout(args.timeout);
        await page.locator(selector).first().click({ timeout });
        return { selector };
    }

    private async fill(page: any, args: Record<string, unknown>) {
        const selector = toStringArg(args.selector);
        assertSelectorAllowed(selector, 'fill');
        const value = toStringArg(args.value);
        const timeout = toTimeout(args.timeout);
        await page.locator(selector).first().fill(value, { timeout });
        return { selector, value };
    }

    private async select(page: any, args: Record<string, unknown>) {
        const selector = toStringArg(args.selector);
        assertSelectorAllowed(selector, 'select');
        const timeout = toTimeout(args.timeout);
        const value = args.value;
        const label = args.label;
        const index = typeof args.index === 'number' ? args.index : undefined;

        if (typeof value === 'string' && value) {
            await page.locator(selector).first().selectOption({ value }, { timeout });
            return { selector, value };
        }
        if (typeof label === 'string' && label) {
            await page.locator(selector).first().selectOption({ label }, { timeout });
            return { selector, label };
        }
        if (typeof index === 'number') {
            await page.locator(selector).first().selectOption({ index }, { timeout });
            return { selector, index };
        }
        throw new Error('select: provide one of value, label or index');
    }

    private async waitFor(page: any, args: Record<string, unknown>) {
        const timeout = toTimeout(args.timeout, 5_000);
        const selector = toStringArg(args.selector);
        if (selector) {
            assertSelectorAllowed(selector, 'waitFor');
            const state = toStringArg(args.state) || 'visible';
            await page.waitForSelector(selector, {
                state: state as 'attached' | 'detached' | 'visible' | 'hidden',
                timeout,
            });
            return { selector, state, timeout };
        }
        await page.waitForTimeout(timeout);
        return { timeout };
    }

    private async extractText(page: any, args: Record<string, unknown>) {
        const selector = toStringArg(args.selector);
        assertSelectorAllowed(selector, 'extractText');
        const timeout = toTimeout(args.timeout);
        await page.waitForSelector(selector, { timeout });
        const text = await page.locator(selector).first().innerText({ timeout });
        return { selector, text: (text || '').trim() };
    }

    private async screenshot(page: any, args: Record<string, unknown>) {
        const selector = toStringArg(args.selector);
        if (selector) {
            assertSelectorAllowed(selector, 'screenshot');
            const locator = page.locator(selector).first();
            const bytes = await locator.screenshot({
                type: 'png',
            });
            return { selector, pngBase64: Buffer.from(bytes).toString('base64') };
        }
        const bytes = await page.screenshot({
            type: 'png',
            fullPage: Boolean(args.fullPage ?? true),
        });
        return { pngBase64: Buffer.from(bytes).toString('base64') };
    }

    private async runFlow(sessionId: string, args: Record<string, unknown>) {
        const stepsRaw = Array.isArray(args.steps) ? args.steps : [];
        const overallTimeoutMs = toTimeout(args.timeoutMs, 90_000);
        const perStepTimeoutMs = toTimeout(args.stepTimeoutMs, 12_000);
        const retryPerStep = Math.max(0, Math.min(4, Number(args.retryPerStep ?? 1)));
        const continueOnError = Boolean(args.continueOnError ?? false);
        const startedAt = Date.now();
        const steps: BrowserFlowStep[] = stepsRaw
            .map((s) => (s && typeof s === 'object' ? s : null))
            .filter(Boolean) as BrowserFlowStep[];

        const results: BrowserToolResult[] = [];
        for (const step of steps) {
            if (Date.now() - startedAt > overallTimeoutMs) {
                results.push({
                    ok: false,
                    tool: step.tool as any,
                    sessionId,
                    error: `runFlow exceeded timeout (${overallTimeoutMs}ms)`,
                });
                break;
            }
            const stepArgs: Record<string, unknown> = { ...(step.args || {}) };
            if (stepArgs.timeout === undefined) {
                stepArgs.timeout = perStepTimeoutMs;
            }
            let result: BrowserToolResult | null = null;
            for (let attempt = 1; attempt <= retryPerStep + 1; attempt += 1) {
                result = await this.execute(step.tool, stepArgs, sessionId);
                if (result.ok) break;
                if (attempt <= retryPerStep) {
                    await new Promise((r) => setTimeout(r, 250 * attempt));
                }
            }
            if (result) {
                results.push(result);
                if (!result.ok && !continueOnError) break;
            }
        }
        return { steps: results, overallTimeoutMs, perStepTimeoutMs, retryPerStep, continueOnError };
    }
}
