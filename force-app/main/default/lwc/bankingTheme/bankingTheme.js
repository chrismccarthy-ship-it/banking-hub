// Shared brand theming for the Banking Hub components.
// Turns a brand object from brandConfig into CSS custom properties that
// c/bankingStyles reads (--bh-primary, --bh-primary-dark, glows, button radius).

const DEFAULT_BRAND = {
    primaryColor: '#5a3fc0', primaryDark: '#3d2a8a', primaryLight: '#f3f0fa',
    headerBg: '#ffffff', headerText: '#181818', buttonRadius: '6px',
    font: "'SalesforceSans', sans-serif"
};

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function rgba(hex, alpha) {
    const m = HEX.exec(String(hex || '').trim());
    if (!m) return `rgba(0, 0, 0, ${alpha})`;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function brandStyle(brand) {
    const b = { ...DEFAULT_BRAND, ...(brand || {}) };
    return [
        `--bh-primary:${b.primaryColor}`,
        `--bh-primary-dark:${b.primaryDark || b.primaryColor}`,
        `--bh-primary-light:${b.primaryLight}`,
        `--bh-header-bg:${b.headerBg}`,
        `--bh-header-text:${b.headerText}`,
        `--bh-btn-radius:${b.buttonRadius || '6px'}`,
        `--bh-font:${b.font}`,
        `--bh-glow-strong:${rgba(b.primaryColor, 0.55)}`,
        `--bh-glow-soft:${rgba(b.primaryColor, 0.4)}`,
        `--bh-glow-selected:${rgba(b.primaryColor, 0.5)}`
    ].join(';');
}
