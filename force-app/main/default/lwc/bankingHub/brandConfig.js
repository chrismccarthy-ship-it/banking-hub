export const BRANDS = {
    truist: {
        id: 'truist', label: 'Truist',
        primaryColor: '#5a3fc0', primaryDark: '#3d2a8a', primaryLight: '#f3f0fa',
        accentColor: '#5a3fc0', headerBg: '#fff', headerText: '#181818',
        logoText: 'T+', logoMark: 'TRUIST', font: "'SalesforceSans', sans-serif",
        buttonRadius: '6px', gaugeColor: '#5a3fc0'
    },
    ally: {
        id: 'ally', label: 'Ally Bank',
        primaryColor: '#6B3F96', primaryDark: '#4a2a6e', primaryLight: '#f5f0fc',
        accentColor: '#ff6200', headerBg: '#6B3F96', headerText: '#fff',
        logoText: 'A', logoMark: 'ALLY', font: "'SalesforceSans', sans-serif",
        buttonRadius: '24px', gaugeColor: '#ff6200'
    },
    citizens: {
        id: 'citizens', label: 'Citizens Bank',
        primaryColor: '#005C8E', primaryDark: '#003d60', primaryLight: '#e8f4fa',
        accentColor: '#00a651', headerBg: '#005C8E', headerText: '#fff',
        logoText: 'C', logoMark: 'CITIZENS', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#005C8E'
    },
    citi: {
        id: 'citi', label: 'Citi Bank',
        primaryColor: '#003B8E', primaryDark: '#00256a', primaryLight: '#e6edf8',
        accentColor: '#E31837', headerBg: '#003B8E', headerText: '#fff',
        logoText: 'C', logoMark: 'CITI', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#E31837'
    },
    bofa: {
        id: 'bofa', label: 'Bank of America',
        primaryColor: '#E31837', primaryDark: '#a8102a', primaryLight: '#fde8eb',
        accentColor: '#012169', headerBg: '#012169', headerText: '#fff',
        logoText: 'B', logoMark: 'BANK OF AMERICA', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#E31837'
    }
};

export const DEFAULT_BRAND = 'truist';
export const CUSTOM_BRAND_ID = 'custom';

export function getBrand(brandId) {
    return BRANDS[brandId] || BRANDS[DEFAULT_BRAND];
}

// ── Colour helpers ──────────────────────────────────────────────
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function hexToRgb(hex) {
    const m = HEX.exec(String(hex || '').trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function toHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

// amount 0..1 toward the target colour
function mix(rgb, target, amount) {
    return { r: rgb.r + (target.r - rgb.r) * amount, g: rgb.g + (target.g - rgb.g) * amount, b: rgb.b + (target.b - rgb.b) * amount };
}

export function rgba(hex, alpha) {
    const c = hexToRgb(hex);
    return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
}

/**
 * Builds a brand object from the App Builder "custom bank" properties so the
 * custom option in the demo switcher actually re-themes the hub.
 */
export function buildCustomBrand(label, primaryHex) {
    const base = hexToRgb(primaryHex) || hexToRgb('#000000');
    const primary = toHex(base);
    const name = (label || 'Custom Bank').trim();
    return {
        id: CUSTOM_BRAND_ID, label: name,
        primaryColor: primary,
        primaryDark: toHex(mix(base, { r: 0, g: 0, b: 0 }, 0.3)),
        primaryLight: toHex(mix(base, { r: 255, g: 255, b: 255 }, 0.92)),
        accentColor: primary, headerBg: primary, headerText: '#fff',
        logoText: name.charAt(0).toUpperCase(), logoMark: name.toUpperCase(),
        font: "'SalesforceSans', sans-serif", buttonRadius: '6px', gaugeColor: primary
    };
}
