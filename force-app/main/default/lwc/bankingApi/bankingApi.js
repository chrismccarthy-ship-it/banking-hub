import callBankApi from '@salesforce/apex/BankingIntegrationService.callBankApi';

/**
 * Calls one allow-listed bank API operation through BankingIntegrationService.
 * Resolves to { data, elapsedMs } on success, or null on any failure, so callers
 * can keep their built-in demo data with a single `if (live)` check.
 */
export async function callApi(operation, payload) {
    try {
        const r = await callBankApi({ operation, payload: payload ? JSON.stringify(payload) : null });
        if (!r || !r.ok || !r.body) return null;
        return { data: JSON.parse(r.body), elapsedMs: r.elapsedMs };
    } catch (e) {
        return null;
    }
}

/**
 * Label for the live-status chip.
 *   undefined -> '' (no call made yet)
 *   null      -> 'Demo data' (call failed, fell back)
 *   result    -> 'Live via API · 212 ms'
 */
export function liveLabel(result) {
    if (result === undefined) return '';
    if (result === null) return 'Demo data';
    return `Live via API · ${result.elapsedMs} ms`;
}

export function liveClass(result) {
    return result ? 'chip live' : 'chip chip--neutral live';
}
