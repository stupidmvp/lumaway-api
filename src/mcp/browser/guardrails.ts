const allowedHosts = (process.env.BROWSER_MCP_ALLOWED_HOSTS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const blockedSelectorPatterns = (process.env.BROWSER_MCP_BLOCKED_SELECTORS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((pattern) => new RegExp(pattern, 'i'));

export function assertNavigateAllowed(rawUrl: string) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        throw new Error('navigate: url is required');
    }
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('navigate: invalid URL');
    }

    if (allowedHosts.length === 0) return;
    const host = parsed.host.toLowerCase();
    const accepted = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
    if (!accepted) {
        throw new Error(`navigate: host "${host}" is not allowed`);
    }
}

export function assertSelectorAllowed(selector: string, op: string) {
    if (!selector || typeof selector !== 'string') {
        throw new Error(`${op}: selector is required`);
    }
    for (const re of blockedSelectorPatterns) {
        if (re.test(selector)) {
            throw new Error(`${op}: selector blocked by policy`);
        }
    }
}

