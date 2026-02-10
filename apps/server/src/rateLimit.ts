const ACTION_LIMIT = 5;
const ACTION_WINDOW = 10000; // 10s

const CHAT_LIMIT = 3;
const CHAT_WINDOW = 1000; // 1s

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const actionLimits = new Map<string, RateLimitEntry>();
const chatLimits = new Map<string, RateLimitEntry>();

function checkLimit(
    map: Map<string, RateLimitEntry>,
    key: string,
    limit: number,
    windowMs: number
): boolean {
    const now = Date.now();
    let entry = map.get(key);

    if (!entry || now > entry.resetTime) {
        entry = { count: 1, resetTime: now + windowMs };
        map.set(key, entry);
        return true;
    }

    if (entry.count >= limit) {
        return false;
    }

    entry.count++;
    return true;
}

export function canPerformAction(userId: string): boolean {
    return checkLimit(actionLimits, userId, ACTION_LIMIT, ACTION_WINDOW);
}

export function canSendChat(userId: string): boolean {
    return checkLimit(chatLimits, userId, CHAT_LIMIT, CHAT_WINDOW);
}
