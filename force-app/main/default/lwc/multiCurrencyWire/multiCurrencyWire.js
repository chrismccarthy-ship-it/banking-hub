import { LightningElement, api, track } from 'lwc';

// Simulated base FX rates vs USD (as of typical mid-market)
const BASE_RATES = {
    EUR: { name: 'Euro', flag: '🇪🇺', base: 0.9215 },
    GBP: { name: 'British Pound', flag: '🇬🇧', base: 0.7848 },
    JPY: { name: 'Japanese Yen', flag: '🇯🇵', base: 149.82 },
    CAD: { name: 'Canadian Dollar', flag: '🇨🇦', base: 1.3654 },
    AUD: { name: 'Australian Dollar', flag: '🇦🇺', base: 1.5321 },
    CHF: { name: 'Swiss Franc', flag: '🇨🇭', base: 0.8923 },
    CNY: { name: 'Chinese Yuan', flag: '🇨🇳', base: 7.2341 },
    MXN: { name: 'Mexican Peso', flag: '🇲🇽', base: 17.1823 },
    INR: { name: 'Indian Rupee', flag: '🇮🇳', base: 83.42 },
    BRL: { name: 'Brazilian Real', flag: '🇧🇷', base: 4.9721 },
    SGD: { name: 'Singapore Dollar', flag: '🇸🇬', base: 1.3421 },
    HKD: { name: 'Hong Kong Dollar', flag: '🇭🇰', base: 7.8201 },
    SEK: { name: 'Swedish Krona', flag: '🇸🇪', base: 10.4231 },
    NOK: { name: 'Norwegian Krone', flag: '🇳🇴', base: 10.6821 },
    DKK: { name: 'Danish Krone', flag: '🇩🇰', base: 6.8821 },
    NZD: { name: 'New Zealand Dollar', flag: '🇳🇿', base: 1.6321 },
    AED: { name: 'UAE Dirham', flag: '🇦🇪', base: 3.6725 },
    SAR: { name: 'Saudi Riyal', flag: '🇸🇦', base: 3.7500 },
    ZAR: { name: 'South African Rand', flag: '🇿🇦', base: 18.7421 },
    PLN: { name: 'Polish Zloty', flag: '🇵🇱', base: 4.0221 }
};

function simRate(base) {
    // Simulate small tick movement ±0.3%
    const change = 1 + (Math.random() - 0.5) * 0.006;
    return parseFloat((base * change).toFixed(4));
}

export default class MultiCurrencyWire extends LightningElement {
    @api brand = {};
    @track selectedCurrency = 'EUR';
    @track sendAmount = 10000;
    @track wireSubmitted = false;
    @track wireConfirmRef = '';
    @track lastUpdated = '';
    @track wireData = {};

    @track currentRates = {};

    connectedCallback() {
        this.refreshRates();
    }

    refreshRates() {
        const now = new Date();
        this.lastUpdated = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const newRates = {};
        Object.entries(BASE_RATES).forEach(([code, info]) => {
            const prev = this.currentRates[code]?.rate;
            const newRate = simRate(info.base);
            const diff = prev ? newRate - prev : 0;
            newRates[code] = {
                code,
                name: info.name,
                flag: info.flag,
                rate: newRate,
                change: diff >= 0 ? `▲ ${Math.abs(diff).toFixed(4)}` : `▼ ${Math.abs(diff).toFixed(4)}`,
                changeStyle: diff >= 0 ? 'color:#2e7d32' : 'color:#c62828',
                selected: code === this.selectedCurrency,
                cssClass: `rate-card ${code === this.selectedCurrency ? 'rate-card--selected' : ''}`,
                selectedStyle: code === this.selectedCurrency ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight || '#f8f6ff'};` : ''
            };
        });
        this.currentRates = newRates;
    }

    get fxRates() {
        return Object.values(this.currentRates);
    }

    get currencyOptions() {
        return Object.entries(BASE_RATES).map(([code, info]) => ({
            code, name: info.name, flag: info.flag,
            isSelected: code === this.selectedCurrency
        }));
    }

    get selectedRateObj() {
        return this.currentRates[this.selectedCurrency];
    }

    get selectedRate() {
        return this.selectedRateObj?.rate?.toFixed(4) || '--';
    }

    get selectedFlag() {
        return BASE_RATES[this.selectedCurrency]?.flag || '🌍';
    }

    get convertedAmount() {
        const rate = this.selectedRateObj?.rate;
        if (!rate || !this.sendAmount) return '--';
        return (parseFloat(this.sendAmount) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    get totalDebitUsd() {
        return (parseFloat(this.sendAmount) + 25).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }

    get settlementTime() {
        const intl = ['JPY','CNY','INR','AED','SAR','ZAR'];
        return intl.includes(this.selectedCurrency)
            ? '1–2 business days (SWIFT)'
            : 'Same business day if submitted before 4:00 PM ET';
    }

    get headerStyle() { return `background:${this.brand.primaryColor};`; }
    get primaryTextStyle() { return `color:${this.brand.primaryColor};`; }
    get primaryBtnStyle() { return `background:${this.brand.primaryColor}; border-radius:${this.brand.buttonRadius || '6px'};`; }
    get confirmBannerStyle() { return `background:${this.brand.primaryLight}; border-left:4px solid ${this.brand.primaryColor};`; }

    selectCurrency(event) {
        this.selectedCurrency = event.currentTarget.dataset.code;
        this.currentRates = Object.fromEntries(
            Object.entries(this.currentRates).map(([code, r]) => [
                code,
                {
                    ...r,
                    selected: code === this.selectedCurrency,
                    cssClass: `rate-card ${code === this.selectedCurrency ? 'rate-card--selected' : ''}`,
                    selectedStyle: code === this.selectedCurrency ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight || '#f8f6ff'};` : ''
                }
            ])
        );
    }

    handleCurrencySelect(event) {
        this.selectedCurrency = event.target.value;
        this.selectCurrency({ currentTarget: { dataset: { code: event.target.value } } });
    }

    handleSendAmount(event) {
        this.sendAmount = event.target.value;
    }

    handleWireInput(event) {
        this.wireData = { ...this.wireData, [event.target.dataset.field]: event.target.value };
    }

    saveDraft() { alert('Wire template saved.'); }

    submitWire() {
        this.wireConfirmRef = 'WR-' + Math.floor(1000000 + Math.random() * 9000000);
        this.wireSubmitted = true;
    }
}
