import { LightningElement, api, track } from 'lwc';
import { brandStyle } from 'c/bankingTheme';

// Simulated mid-market rates vs USD for the demo; production quotes come from the bank's FX engine.
const BASE_RATES = {
    EUR: { name: 'Euro', base: 0.9215 },
    GBP: { name: 'British Pound', base: 0.7848 },
    JPY: { name: 'Japanese Yen', base: 149.82 },
    CAD: { name: 'Canadian Dollar', base: 1.3654 },
    AUD: { name: 'Australian Dollar', base: 1.5321 },
    CHF: { name: 'Swiss Franc', base: 0.8923 },
    CNY: { name: 'Chinese Yuan', base: 7.2341 },
    MXN: { name: 'Mexican Peso', base: 17.1823 },
    INR: { name: 'Indian Rupee', base: 83.42 },
    BRL: { name: 'Brazilian Real', base: 4.9721 },
    SGD: { name: 'Singapore Dollar', base: 1.3421 },
    HKD: { name: 'Hong Kong Dollar', base: 7.8201 },
    SEK: { name: 'Swedish Krona', base: 10.4231 },
    NOK: { name: 'Norwegian Krone', base: 10.6821 },
    DKK: { name: 'Danish Krone', base: 6.8821 },
    NZD: { name: 'New Zealand Dollar', base: 1.6321 },
    AED: { name: 'UAE Dirham', base: 3.6725 },
    SAR: { name: 'Saudi Riyal', base: 3.7500 },
    ZAR: { name: 'South African Rand', base: 18.7421 },
    PLN: { name: 'Polish Zloty', base: 4.0221 }
};


const WIRE_FEE = 25;
const SWIFT_CURRENCIES = ['JPY', 'CNY', 'INR', 'AED', 'SAR', 'ZAR'];

function simRate(base) {
    // Simulated tick within plus or minus 0.3% of the base rate
    const change = 1 + (Math.random() - 0.5) * 0.006;
    return parseFloat((base * change).toFixed(4));
}

const money = (n, currency) => n.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default class MultiCurrencyWire extends LightningElement {
    @api brand = {};
    @track selectedCurrency = 'EUR';
    @track sendAmount = 10000;
    @track wireSubmitted = false;
    @track wireConfirmRef = '';
    @track templateSaved = false;
    @track lastUpdated = '';
    @track wireData = {};
    @track currentRates = {};

    connectedCallback() {
        this.refreshRates();
    }

    get brandStyle() { return brandStyle(this.brand); }

    refreshRates() {
        this.lastUpdated = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const next = {};
        Object.entries(BASE_RATES).forEach(([code, info]) => {
            next[code] = { code, name: info.name, rate: simRate(info.base), base: info.base };
        });
        this.currentRates = next;
    }

    // ── Rates table ──
    get fxRates() {
        return Object.values(this.currentRates).map(r => {
            const pct = ((r.rate - r.base) / r.base) * 100;
            const up = pct >= 0;
            const selected = r.code === this.selectedCurrency;
            return {
                ...r,
                rateText: r.rate.toFixed(4),
                change: `${up ? '\u25B2' : '\u25BC'} ${Math.abs(pct).toFixed(2)}%`,
                changeLabel: `${up ? 'up' : 'down'} ${Math.abs(pct).toFixed(2)} percent`,
                changeClass: up ? 'chg chg--up' : 'chg chg--down',
                rowClass: selected ? 'rate rate--on' : 'rate',
                ariaSelected: selected ? 'true' : 'false'
            };
        });
    }

    get currencyOptions() {
        return Object.entries(BASE_RATES).map(([code, info]) => ({
            code, label: `${code} (${info.name})`, isSelected: code === this.selectedCurrency
        }));
    }

    // ── Composer ──
    get selectedRateObj() { return this.currentRates[this.selectedCurrency]; }
    get selectedRate() { return this.selectedRateObj ? this.selectedRateObj.rate.toFixed(4) : '--'; }
    get amount() { return parseFloat(this.sendAmount) || 0; }

    get convertedAmount() {
        const r = this.selectedRateObj;
        if (!r || !this.amount) return '--';
        return money(this.amount * r.rate, this.selectedCurrency);
    }

    get feeText() { return money(WIRE_FEE, 'USD'); }
    get totalDebitUsd() { return money(this.amount + WIRE_FEE, 'USD'); }
    get sendAmountText() { return money(this.amount, 'USD'); }

    get settlementTime() {
        return SWIFT_CURRENCIES.includes(this.selectedCurrency)
            ? '1 to 2 business days through SWIFT'
            : 'Today, if sent before 4:00 PM ET';
    }

    get beneficiaryName() { return this.wireData.beneName || 'the beneficiary'; }

    selectCurrency(event) {
        this.selectedCurrency = event.currentTarget.dataset.code;
    }

    handleCurrencySelect(event) {
        this.selectedCurrency = event.target.value;
    }

    handleSendAmount(event) {
        this.sendAmount = event.target.value;
    }

    handleWireInput(event) {
        this.wireData = { ...this.wireData, [event.target.dataset.field]: event.target.value };
    }

    saveDraft() { this.templateSaved = true; }

    submitWire() {
        this.wireConfirmRef = 'WR-' + Math.floor(1000000 + Math.random() * 9000000);
        this.wireSubmitted = true;
    }
}
