import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { getBrand, BRANDS } from './brandConfig';

const CREDIT_SCORE_FIELD = 'Contact.Credit_Score__c';

// Full retail nav catalog — visibility controlled by @api properties
const ALL_RETAIL_NAV = [
    { id: 'onboarding',  label: 'Get Started',   emoji: '👋' },
    { id: 'creditCard',  label: 'Credit Cards',   emoji: '💳' },
    { id: 'loans',       label: 'Loans',          emoji: '💰' },
    { id: 'checking',    label: 'Checking',       emoji: '🏦' },
    { id: 'savings',     label: 'Savings',        emoji: '🐷' },
    { id: 'mortgage',    label: 'Mortgage',       emoji: '🏠' },
    { id: 'creditScore', label: 'Credit Score',   emoji: '📊' },
    { id: 'investments', label: 'Investments',    emoji: '📈' },
];

const COMMERCIAL_NAV = [
    { id: 'commercialOnboarding', label: 'Onboarding',            emoji: '🏢' },
    { id: 'paymentChannels',      label: 'Payments Setup',        emoji: '⚙️' },
    { id: 'multiCurrency',        label: 'Multi-Currency Wire',   emoji: '🌍' },
    { id: 'treasury',             label: 'Treasury',              emoji: '💎' },
    { id: 'lending',              label: 'Commercial Lending',    emoji: '🤝' },
];

export default class BankingHub extends NavigationMixin(LightningElement) {
    // ── Record context ──
    @api recordId;

    // ── Brand ──
    @api defaultBrand = 'truist';
    @api customBrandLabel;
    @api customBrandPrimary = '#000000';

    // ── Logo static resource ──
    @api logoStaticResource;   // e.g. "BofA_Logo" — name of the static resource in the org
    @api logoHeight = '32';    // height in px, configurable in App Builder

    // ── Credit score fallback ──
    @api fallbackCreditScore = 720;

    // ── Apply Now navigation targets ──
    @api premiumCardPageUrl;   // e.g. /s/premium-rewards or full URL
    @api cashCardPageUrl;      // e.g. /s/cash-rewards

    // ── Nav category visibility toggles ──
    @api showGetStarted   = false;
    @api showCreditCards  = false;
    @api showLoans        = false;
    @api showChecking     = false;
    @api showSavings      = false;
    @api showMortgage     = false;
    @api showCreditScore  = false;
    @api showInvestments  = false;

    // ── Internal state ──
    @track currentBrandId = 'truist';
    @track brand = getBrand('truist');
    @track mode = 'retail';
    @track activeRetailId = 'creditCard';
    @track activeCommercialId = 'commercialOnboarding';
    @track selectedLoanType = 'menu';
    @track contactCreditScore = null;

    @track _retailNavItems = ALL_RETAIL_NAV.map(i => ({
        ...i,
        isActive: i.id === 'creditCard',
        cssClass: i.id === 'creditCard' ? 'nav-item nav-item--active' : 'nav-item',
        activeInlineStyle: ''
    }));

    @track commercialNavItems = COMMERCIAL_NAV.map(i => ({
        ...i,
        isActive: i.id === 'commercialOnboarding',
        cssClass: i.id === 'commercialOnboarding' ? 'nav-item nav-item--active' : 'nav-item',
        activeInlineStyle: i.id === 'commercialOnboarding'
            ? `border-color:${getBrand('truist').primaryColor}; background:${getBrand('truist').primaryLight};`
            : ''
    }));

    // Wire credit score from Contact record if recordId is present
    @wire(getRecord, { recordId: '$recordId', fields: [CREDIT_SCORE_FIELD] })
    wiredContact({ data }) {
        if (data) {
            const val = getFieldValue(data, CREDIT_SCORE_FIELD);
            this.contactCreditScore = val ? Number(val) : null;
        }
    }

    connectedCallback() {
        this.currentBrandId = this.defaultBrand || 'truist';
        this.brand = getBrand(this.currentBrandId);
    }

    // ── Logo ──
    get hasLogoUrl() {
        return !!this.logoStaticResource;
    }

    get logoUrl() {
        if (!this.logoStaticResource) return null;
        // Supports both full URLs and static resource names
        if (this.logoStaticResource.startsWith('http')) {
            return this.logoStaticResource;
        }
        return `/resource/${this.logoStaticResource}`;
    }

    get logoImgStyle() {
        return `height:${this.logoHeight}px; width:auto; display:block;`;
    }

    // ── Credit score ──
    get creditScore() {
        return this.contactCreditScore || this.fallbackCreditScore || 720;
    }

    // ── Filtered nav items based on visibility toggles ──
    get visibleRetailNavItems() {
        const visibilityMap = {
            onboarding:  this.showGetStarted,
            creditCard:  this.showCreditCards,
            loans:       this.showLoans,
            checking:    this.showChecking,
            savings:     this.showSavings,
            mortgage:    this.showMortgage,
            creditScore: this.showCreditScore,
            investments: this.showInvestments,
        };
        return this._retailNavItems.filter(item => visibilityMap[item.id] === false);
    }

    // ── Brand options ──
    get brandOptions() {
        return Object.values(BRANDS).map(b => ({
            id: b.id,
            label: b.label,
            isSelected: b.id === this.currentBrandId
        }));
    }

    // ── Mode ──
    get isRetailMode()     { return this.mode === 'retail'; }
    get isCommercialMode() { return this.mode === 'commercial'; }
    get retailModeClass()     { return this.mode === 'retail'     ? 'mode-tab mode-tab--active' : 'mode-tab'; }
    get commercialModeClass() { return this.mode === 'commercial' ? 'mode-tab mode-tab--active' : 'mode-tab'; }

    setRetailMode()     { this.mode = 'retail'; }
    setCommercialMode() { this.mode = 'commercial'; }

    // ── Retail panel visibility ──
    get showRetailOnboarding() { return this.activeRetailId === 'onboarding'; }
    get showLoanApplication()  { return this.activeRetailId === 'loans' && this.selectedLoanType !== 'menu'; }
    get showLoanMenu()         { return this.activeRetailId === 'loans' && this.selectedLoanType === 'menu'; }
    get showCreditCard()       { return this.activeRetailId === 'creditCard'; }
    get showPlaceholder()      { return !['onboarding','loans','creditCard'].includes(this.activeRetailId); }

    // ── Commercial panel visibility ──
    get showCommercialOnboarding() { return this.activeCommercialId === 'commercialOnboarding'; }
    get showPaymentChannels()      { return this.activeCommercialId === 'paymentChannels'; }
    get showMultiCurrency()        { return this.activeCommercialId === 'multiCurrency'; }
    get showCommercialPlaceholder() {
        return !['commercialOnboarding','paymentChannels','multiCurrency'].includes(this.activeCommercialId);
    }

    // ── Loan type selection ──
    selectAutoLoan()     { this.selectedLoanType = 'auto'; }
    selectHomeLoan()     { this.selectedLoanType = 'home'; }
    selectPersonalLoan() { this.selectedLoanType = 'personal'; }

    // ── Apply Now navigation ──
    navigatePremiumCard() {
        this._navigateToUrl(this.premiumCardPageUrl || '/s/premium-rewards-card');
    }

    navigateCashCard() {
        this._navigateToUrl(this.cashCardPageUrl || '/s/cash-rewards-card');
    }

    _navigateToUrl(url) {
        if (!url) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url }
        });
    }

    // ── Brand switch ──
    handleBrandChange(event) {
        this.currentBrandId = event.target.value;
        this.brand = getBrand(this.currentBrandId);
        // Refresh active styles with new brand colors
        this._retailNavItems = this._retailNavItems.map(item => ({
            ...item,
            activeInlineStyle: item.isActive
                ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight};`
                : ''
        }));
        this.commercialNavItems = this.commercialNavItems.map(item => ({
            ...item,
            activeInlineStyle: item.isActive
                ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight};`
                : ''
        }));
    }

    // ── Nav click ──
    handleNavClick(event) {
        const id = event.currentTarget.dataset.id;
        this.activeRetailId = id;
        if (id === 'loans') this.selectedLoanType = 'menu';
        this._retailNavItems = this._retailNavItems.map(item => ({
            ...item,
            isActive: item.id === id,
            cssClass: item.id === id ? 'nav-item nav-item--active' : 'nav-item',
            activeInlineStyle: item.id === id
                ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight};`
                : ''
        }));
    }

    handleCommercialNavClick(event) {
        const id = event.currentTarget.dataset.id;
        this.activeCommercialId = id;
        this.commercialNavItems = this.commercialNavItems.map(item => ({
            ...item,
            isActive: item.id === id,
            cssClass: item.id === id ? 'nav-item nav-item--active' : 'nav-item',
            activeInlineStyle: item.id === id
                ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight};`
                : ''
        }));
    }

    // ── Dynamic inline styles ──
    get hubStyle()          { return `font-family:${this.brand.font};`; }
    get headerStyle()       { return `background:${this.brand.headerBg}; color:${this.brand.headerText};`; }
    get logoMarkStyle()     { return `background:${this.brand.primaryColor}; color:#fff;`; }
    get logoNameStyle()     { return `color:${this.brand.headerText};`; }
    get primaryBtnStyle()   { return `background:${this.brand.primaryColor}; color:#fff; border-radius:${this.brand.buttonRadius}; border:none;`; }
    get primaryBgStyle()    { return `background:${this.brand.primaryColor};`; }
    get accentBgStyle()     { return `background:${this.brand.accentColor};`; }
    get primaryTextStyle()  { return `color:${this.brand.primaryColor};`; }
    get lightBgStyle()      { return `background:${this.brand.primaryLight};`; }
    get dividerStyle()      { return `border-top-color:${this.brand.primaryLight};`; }
    get productCardStyle()  { return `border:1.5px solid ${this.brand.primaryLight};`; }
    get loanTileStyle()     { return `border:2px solid ${this.brand.primaryLight};`; }
    get retailTabStyle()    { return this.mode === 'retail'     ? `border-bottom:3px solid ${this.brand.primaryColor}; color:${this.brand.primaryColor};` : ''; }
    get commercialTabStyle(){ return this.mode === 'commercial' ? `border-bottom:3px solid ${this.brand.primaryColor}; color:${this.brand.primaryColor};` : ''; }
}
