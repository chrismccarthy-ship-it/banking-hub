import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { getBrand, BRANDS, CUSTOM_BRAND_ID, buildCustomBrand } from './brandConfig';
import { brandStyle } from 'c/bankingTheme';

const CREDIT_SCORE_FIELD = 'Contact.Credit_Score__c';
const FIRST_NAME_FIELD = 'Contact.FirstName';
const LAST_NAME_FIELD = 'Contact.LastName';

// Retail tasks. Visibility is controlled by the show* @api properties.
// Descriptions are demo copy: keep them specific and realistic.
const RETAIL_TASKS = [
    { id: 'onboarding',  label: 'Open an account', description: 'Checking or savings in about 5 minutes', flag: 'showGetStarted' },
    { id: 'creditCard',  label: 'Credit cards',    description: '2 offers matched to your profile',     flag: 'showCreditCards' },
    { id: 'loans',       label: 'Loans',           description: 'Auto, home and personal',              flag: 'showLoans' },
    { id: 'checking',    label: 'Checking',        description: 'Everyday ****4821',                    flag: 'showChecking' },
    { id: 'savings',     label: 'Savings',         description: '4.10% APY on balances over $10k',      flag: 'showSavings' },
    { id: 'mortgage',    label: 'Mortgage',        description: 'Rates and pre-approval',               flag: 'showMortgage' },
    { id: 'creditScore', label: 'Credit score',    description: 'Factors and history',                  flag: 'showCreditScore' },
    { id: 'investments', label: 'Investments',     description: 'Brokerage and retirement',             flag: 'showInvestments' }
];

const COMMERCIAL_TASKS = [
    { id: 'commercialOnboarding', label: 'Open a business account', description: 'Business details, owners and services' },
    { id: 'paymentChannels',      label: 'Payment channels',        description: 'Lockbox, ACH and wire settings' },
    { id: 'multiCurrency',        label: 'International wires',     description: '20 currencies with locked quotes' },
    { id: 'treasury',             label: 'Treasury',                description: 'Sweeps, liquidity and positions' },
    { id: 'lending',              label: 'Commercial lending',      description: 'Lines of credit and term loans' }
];

const LOANS = [
    { id: 'auto',     label: 'Auto loan',     description: 'New, used or refinance',        rate: '5.49%' },
    { id: 'home',     label: 'Home loan',     description: '30-year and 15-year fixed',     rate: '6.75%' },
    { id: 'personal', label: 'Personal loan', description: 'Consolidate or cover big costs', rate: '8.99%' }
];

// FICO tiers. Segment weights are the width of each band on the 300 to 850 scale.
const TIERS = [
    { min: 800, label: 'Exceptional', css: 'tier-exceptional', weight: 50 },
    { min: 740, label: 'Very good',   css: 'tier-very-good',   weight: 60 },
    { min: 670, label: 'Good',        css: 'tier-good',        weight: 70 },
    { min: 580, label: 'Fair',        css: 'tier-fair',        weight: 90 },
    { min: 300, label: 'Poor',        css: 'tier-poor',        weight: 280 }
];

const SHORTCUT_KEY = 'b'; // Ctrl+Shift+B shows or hides the demo settings button

export default class BankingHub extends NavigationMixin(LightningElement) {
    // ── Record context ──
    @api recordId;

    // ── Brand ──
    @api defaultBrand = 'truist';
    @api customBrandLabel;
    @api customBrandPrimary = '#000000';

    // ── Demo controls (presenter only; off for customer-facing pages) ──
    @api showDemoControls = false;

    // ── Greeting ──
    @api greetingName; // used when the record has no Contact first name

    // ── Logo static resource ──
    @api logoStaticResource;
    @api logoHeight = '32';

    // ── Credit score fallback ──
    @api fallbackCreditScore = 720;

    // ── Offer navigation targets ──
    @api premiumCardPageUrl;
    @api cashCardPageUrl;

    // ── Task visibility ──
    // LWC requires public booleans to default to false, so these stay undefined.
    // App Builder passes true by default; only an explicit false hides a task.
    @api showGetStarted;
    @api showCreditCards;
    @api showLoans;
    @api showChecking;
    @api showSavings;
    @api showMortgage;
    @api showCreditScore;
    @api showInvestments;

    // ── Internal state ──
    @track brand = getBrand('truist');
    currentBrandId = 'truist';
    mode = 'retail';
    activeRetailId = 'creditCard';
    activeCommercialId = 'commercialOnboarding';
    selectedLoanType = 'menu';
    contactCreditScore = null;
    contactFirstName;
    contactLastName;
    demoButtonHidden = false;
    demoPanelOpen = false;

    _onKeydown = this.handleShortcut.bind(this);

    @wire(getRecord, { recordId: '$recordId', optionalFields: [CREDIT_SCORE_FIELD, FIRST_NAME_FIELD, LAST_NAME_FIELD] })
    wiredContact({ data }) {
        if (data) {
            const score = getFieldValue(data, CREDIT_SCORE_FIELD);
            this.contactCreditScore = score ? Number(score) : null;
            this.contactFirstName = getFieldValue(data, FIRST_NAME_FIELD);
            this.contactLastName = getFieldValue(data, LAST_NAME_FIELD);
        }
    }

    connectedCallback() {
        this.applyBrand(this.defaultBrand || 'truist');
        window.addEventListener('keydown', this._onKeydown);
    }

    disconnectedCallback() {
        window.removeEventListener('keydown', this._onKeydown);
    }

    // ── Brand ──
    applyBrand(brandId) {
        this.currentBrandId = brandId;
        this.brand = brandId === CUSTOM_BRAND_ID
            ? buildCustomBrand(this.customBrandLabel, this.customBrandPrimary)
            : getBrand(brandId);
    }

    get brandVars() {
        return brandStyle(this.brand);
    }

    get brandOptions() {
        const options = Object.values(BRANDS).map(b => ({ id: b.id, label: b.label, isSelected: b.id === this.currentBrandId }));
        if (this.customBrandLabel) {
            options.push({ id: CUSTOM_BRAND_ID, label: this.customBrandLabel, isSelected: this.currentBrandId === CUSTOM_BRAND_ID });
        }
        return options;
    }

    handleBrandChange(event) {
        this.applyBrand(event.target.value);
    }

    // ── Demo controls ──
    get showDemoButton() {
        return this.showDemoControls && !this.demoButtonHidden;
    }

    handleShortcut(event) {
        if (!this.showDemoControls) return;
        if (event.ctrlKey && event.shiftKey && String(event.key).toLowerCase() === SHORTCUT_KEY) {
            event.preventDefault();
            this.demoButtonHidden = !this.demoButtonHidden;
            if (this.demoButtonHidden) this.demoPanelOpen = false;
        }
    }

    toggleDemoPanel() {
        this.demoPanelOpen = !this.demoPanelOpen;
    }

    closeDemoPanel() {
        this.demoPanelOpen = false;
    }

    handleDemoPanelKeydown(event) {
        if (event.key === 'Escape') this.closeDemoPanel();
    }

    // ── Header ──
    get hasLogoUrl() { return !!this.logoStaticResource; }

    get logoUrl() {
        if (!this.logoStaticResource) return null;
        return this.logoStaticResource.startsWith('http') ? this.logoStaticResource : `/resource/${this.logoStaticResource}`;
    }

    get logoImgStyle() { return `height:${this.logoHeight}px;`; }

    get firstName() { return this.contactFirstName || this.greetingName || ''; }

    get initials() {
        const first = this.contactFirstName || this.greetingName || '';
        const last = this.contactLastName || '';
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }

    get hasInitials() { return !!this.initials; }

    get greeting() {
        const hour = new Date().getHours();
        const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        return this.firstName ? `${part}, ${this.firstName}` : part;
    }

    // ── Mode ──
    get isRetailMode() { return this.mode === 'retail'; }
    get isCommercialMode() { return this.mode === 'commercial'; }
    get retailPressed() { return String(this.isRetailMode); }
    get commercialPressed() { return String(this.isCommercialMode); }
    get retailNavCurrent() { return this.isRetailMode ? 'page' : null; }
    get commercialNavCurrent() { return this.isCommercialMode ? 'page' : null; }
    setRetailMode() { this.mode = 'retail'; }
    setCommercialMode() { this.mode = 'commercial'; }

    // ── Tasks ──
    decorate(task, activeId) {
        const active = task.id === activeId;
        return { ...task, cssClass: active ? 'task task--active' : 'task', ariaCurrent: active ? 'true' : null };
    }

    get visibleRetailTasks() {
        return RETAIL_TASKS.filter(t => this[t.flag] !== false);
    }

    // The task actually shown: the chosen one if it's visible, otherwise the first visible task.
    // Keeps a hidden default (e.g. Credit cards for a bank that doesn't offer them) from opening.
    get currentRetailId() {
        const visible = this.visibleRetailTasks;
        if (visible.some(t => t.id === this.activeRetailId)) return this.activeRetailId;
        return visible.length ? visible[0].id : null;
    }

    get retailTasks() {
        return this.visibleRetailTasks.map(t => this.decorate(t, this.currentRetailId));
    }

    get commercialTasks() {
        return COMMERCIAL_TASKS.map(t => this.decorate(t, this.activeCommercialId));
    }

    handleRetailTask(event) {
        const id = event.currentTarget.dataset.id;
        this.activeRetailId = id;
        if (id === 'loans') this.selectedLoanType = 'menu';
    }

    handleCommercialTask(event) {
        this.activeCommercialId = event.currentTarget.dataset.id;
    }

    // ── Retail panels ──
    get showRetailOnboarding() { return this.currentRetailId === 'onboarding'; }
    get showLoanApplication()  { return this.currentRetailId === 'loans' && this.selectedLoanType !== 'menu'; }
    get showLoanMenu()         { return this.currentRetailId === 'loans' && this.selectedLoanType === 'menu'; }
    get showCreditCard()       { return this.currentRetailId === 'creditCard'; }
    get showPlaceholder()      { return !!this.currentRetailId && !['onboarding', 'loans', 'creditCard'].includes(this.currentRetailId); }

    get activeRetailLabel() {
        const task = RETAIL_TASKS.find(t => t.id === this.currentRetailId);
        return task ? task.label : '';
    }

    get loans() { return LOANS; }

    selectLoan(event) { this.selectedLoanType = event.currentTarget.dataset.id; }
    backToLoans() { this.selectedLoanType = 'menu'; }
    // First fully built task that is visible, for the empty state's button.
    get builtRetailTask() {
        return ['creditCard', 'onboarding', 'loans']
            .map(id => this.visibleRetailTasks.find(t => t.id === id))
            .find(Boolean);
    }

    get hasBuiltRetailTask() { return !!this.builtRetailTask; }
    get builtRetailLabel() { return this.builtRetailTask ? `Go to ${this.builtRetailTask.label.toLowerCase()}` : ''; }

    showBuiltTask() {
        if (this.builtRetailTask) {
            this.activeRetailId = this.builtRetailTask.id;
            this.selectedLoanType = 'menu';
        }
    }

    // ── Commercial panels ──
    get showCommercialOnboarding() { return this.activeCommercialId === 'commercialOnboarding'; }
    get showPaymentChannels()      { return this.activeCommercialId === 'paymentChannels'; }
    get showMultiCurrency()        { return this.activeCommercialId === 'multiCurrency'; }
    get showCommercialPlaceholder() {
        return !['commercialOnboarding', 'paymentChannels', 'multiCurrency'].includes(this.activeCommercialId);
    }

    get activeCommercialLabel() {
        const task = COMMERCIAL_TASKS.find(t => t.id === this.activeCommercialId);
        return task ? task.label : '';
    }

    showBusinessOnboarding() { this.activeCommercialId = 'commercialOnboarding'; }

    // ── Credit score ──
    get creditScore() {
        return this.contactCreditScore || Number(this.fallbackCreditScore) || 720;
    }

    get tier() {
        const s = this.creditScore;
        return TIERS.find(t => s >= t.min) || TIERS[TIERS.length - 1];
    }

    get tierLabel() { return this.tier.label; }
    get tierClass() { return `score-tier ${this.tier.css}`; }

    get scaleSegments() {
        return [...TIERS].reverse().map(t => ({ key: t.css, cssClass: `band ${t.css}`, style: `flex:${t.weight}` }));
    }

    get markerStyle() {
        const pct = Math.min(Math.max((this.creditScore - 300) / 550, 0), 1) * 100;
        return `left:${pct.toFixed(1)}%`;
    }

    get scoreAriaLabel() {
        return `Credit score ${this.creditScore} out of 850, ${this.tierLabel}`;
    }

    // ── Offer navigation ──
    navigatePremiumCard() { this.navigateTo(this.premiumCardPageUrl || '/s/premium-rewards-card'); }
    navigateCashCard() { this.navigateTo(this.cashCardPageUrl || '/s/cash-rewards-card'); }

    navigateTo(url) {
        if (!url) return;
        this[NavigationMixin.Navigate]({ type: 'standard__webPage', attributes: { url } });
    }
}
