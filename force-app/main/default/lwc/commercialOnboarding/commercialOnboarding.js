import { LightningElement, api, track } from 'lwc';
import { brandStyle } from 'c/bankingTheme';
import { callApi, liveLabel, liveClass } from 'c/bankingApi';

const STEPS = ['Business details', 'Beneficial owners', 'Services', 'Documents', 'Submitted'];

const SERVICE_GROUPS = [
    { id: 'accounts', label: 'Accounts', services: [
        { id: 'checking', label: 'Business checking', description: 'Operating account with unlimited transactions', docs: 'No extra documents' },
        { id: 'savings', label: 'Business savings', description: 'Reserve funds with tiered interest', docs: 'No extra documents' }
    ] },
    { id: 'payments', label: 'Payments', services: [
        { id: 'wire', label: 'Wire transfers', description: 'Domestic Fedwire and international SWIFT', docs: '1 form' },
        { id: 'ach', label: 'ACH origination', description: 'Payroll, vendor payments and collections', docs: '1 agreement' },
        { id: 'lockbox', label: 'Lockbox and SFTP', description: 'Receivables delivered as BAI2 or X12 820 files', docs: '1 form' },
        { id: 'payroll', label: 'Payroll services', description: 'Direct deposit and tax filing', docs: '1 agreement' }
    ] },
    { id: 'credit', label: 'Credit and treasury', services: [
        { id: 'credit_line', label: 'Line of credit', description: 'Revolving working capital', docs: '2 years of financials' },
        { id: 'fx', label: 'Foreign exchange', description: 'Spot and forward contracts', docs: '1 agreement' },
        { id: 'merchant', label: 'Merchant services', description: 'Card acceptance in store and online', docs: '1 application' },
        { id: 'treasury', label: 'Treasury management', description: 'Sweeps, positions and liquidity reporting', docs: '1 agreement' }
    ] }
];

const DOCS_LIST = [
    { id: 'articles', name: 'Articles of incorporation or organization', required: true },
    { id: 'ein', name: 'EIN confirmation letter (IRS CP 575)', required: true },
    { id: 'operating', name: 'Operating agreement or bylaws', required: true },
    { id: 'id', name: 'Government-issued ID for each beneficial owner', required: true },
    { id: 'financials', name: 'Financial statements, last 2 years', required: false },
    { id: 'bank_statements', name: 'Bank statements, last 3 months', required: false }
];

export default class CommercialOnboarding extends LightningElement {
    @api brand = {};
    @track currentStep = 1;
    @track applicationRef = '';
    @track applicationLive;
    @track formData = { legalName: '', dba: '', businessType: 'llc', industry: '', ein: '', yearEstablished: '', annualRevenue: '1m_10m', employees: '' };
    @track owners = [{ id: 1, num: 1, name: '', title: '', ownership: '', ssn: '' }];
    @track selected = ['checking'];

    get brandStyle() { return brandStyle(this.brand); }
    get businessName() { return this.formData.legalName || 'Your business'; }

    get steps() {
        return STEPS.map((name, i) => {
            const id = i + 1;
            const done = id < this.currentStep;
            const current = id === this.currentStep;
            return {
                id, name,
                status: done ? this.summaryFor(id) : current ? 'In progress' : 'Next',
                cssClass: `step ${done ? 'step--done' : ''} ${current ? 'step--current' : ''}`,
                ariaCurrent: current ? 'step' : null,
                disabled: !done || this.isSubmitted
            };
        });
    }

    summaryFor(id) {
        if (id === 1) return this.formData.legalName || 'Complete';
        if (id === 2) return `${this.owners.length} owner${this.owners.length === 1 ? '' : 's'} added`;
        if (id === 3) return `${this.selected.length} selected`;
        return 'Complete';
    }

    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isSubmitted() { return this.currentStep === 5; }
    get showActions() { return !this.isSubmitted; }
    get showBack() { return this.currentStep > 1; }
    get showContinue() { return this.currentStep < 4; }
    get canRemoveOwner() { return this.owners.length > 1; }

    // ── Services ──
    get serviceGroups() {
        return SERVICE_GROUPS.map(g => ({
            ...g,
            headingId: `svc-${g.id}`,
            services: g.services.map(s => {
                const on = this.selected.includes(s.id);
                return { ...s, checked: on, cssClass: `row ${on ? 'row--on' : ''}` };
            })
        }));
    }

    get selectedServices() {
        return SERVICE_GROUPS.flatMap(g => g.services).filter(s => this.selected.includes(s.id));
    }
    get selectedCount() { return this.selectedServices.length; }
    get selectedCountText() { return `${this.selectedCount} service${this.selectedCount === 1 ? '' : 's'}`; }
    get hasSelected() { return this.selectedCount > 0; }

    toggleService(event) {
        const id = event.target.dataset.id;
        this.selected = event.target.checked
            ? [...new Set([...this.selected, id])]
            : this.selected.filter(s => s !== id);
    }

    // ── Documents ──
    get documents() {
        return DOCS_LIST.map(d => ({
            ...d,
            requirement: d.required ? 'Required' : 'Recommended',
            status: d.required ? 'Pending' : 'Optional',
            statusClass: `status ${d.required ? 'status--pending' : 'status--optional'}`
        }));
    }
    get requiredDocCount() { return DOCS_LIST.filter(d => d.required).length; }

    // ── Inputs ──
    handleInput(event) {
        const field = event.target.dataset.field;
        this.formData = { ...this.formData, [field]: event.target.value };
    }

    addOwner() {
        const id = Math.max(...this.owners.map(o => o.id)) + 1;
        this.owners = [...this.owners, { id, num: this.owners.length + 1, name: '', title: '', ownership: '', ssn: '' }];
    }

    removeOwner(event) {
        const id = parseInt(event.currentTarget.dataset.id, 10);
        this.owners = this.owners.filter(o => o.id !== id).map((o, i) => ({ ...o, num: i + 1 }));
    }

    handleOwnerInput(event) {
        const ownerId = parseInt(event.target.dataset.ownerId, 10);
        const field = event.target.dataset.field;
        this.owners = this.owners.map(o => (o.id === ownerId ? { ...o, [field]: event.target.value } : o));
    }

    // ── Navigation ──
    goToStep(event) {
        const step = parseInt(event.currentTarget.dataset.step, 10);
        if (step < this.currentStep && !this.isSubmitted) this.currentStep = step;
    }

    nextStep() { if (this.currentStep < 4) this.currentStep++; }
    prevStep() { if (this.currentStep > 1) this.currentStep--; }

    // Commercial onboarding case. Owner SSNs never leave the page in the demo.
    async submitApplication() {
        const f = this.formData;
        const live = await callApi('submitBusiness', {
            business: { legalName: f.legalName, dba: f.dba, entityType: f.businessType, industry: f.industry, ein: f.ein, yearEstablished: f.yearEstablished, annualRevenue: f.annualRevenue, employees: f.employees },
            beneficialOwners: this.owners.map(o => ({ name: o.name, title: o.title, ownershipPct: Number(o.ownership) || null })),
            services: [...this.selected]
        });
        this.applicationLive = live;
        this.applicationRef = (live && live.data.reference) || 'COM-' + Math.floor(100000 + Math.random() * 900000);
        this.currentStep = 5;
    }

    get applicationLiveLabel() { return liveLabel(this.applicationLive); }
    get applicationLiveClass() { return liveClass(this.applicationLive); }
}
