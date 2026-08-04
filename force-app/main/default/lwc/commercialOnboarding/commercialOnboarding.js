import { LightningElement, api, track } from 'lwc';

const STEP_LABELS = ['Business Info', 'KYB / Owners', 'Services', 'Documents', 'Confirm'];
const SERVICES_LIST = [
    { id: 'checking', icon: '🏦', label: 'Business Checking' },
    { id: 'savings', icon: '💰', label: 'Business Savings' },
    { id: 'wire', icon: '🌍', label: 'Wire Transfers' },
    { id: 'ach', icon: '🔄', label: 'ACH / Nacha' },
    { id: 'lockbox', icon: '📬', label: 'Lockbox / SFTP' },
    { id: 'payroll', icon: '👥', label: 'Payroll Services' },
    { id: 'fx', icon: '💱', label: 'Foreign Exchange' },
    { id: 'credit_line', icon: '📈', label: 'Line of Credit' },
    { id: 'merchant', icon: '💳', label: 'Merchant Services' },
    { id: 'treasury', icon: '💎', label: 'Treasury Management' }
];
const DOCS_LIST = [
    { id: 'articles', icon: '📄', name: 'Articles of Incorporation / Organization', required: 'Required', status: '⏳ Pending', statusColor: '#e65100' },
    { id: 'ein', icon: '📋', name: 'EIN Confirmation Letter (IRS CP 575)', required: 'Required', status: '⏳ Pending', statusColor: '#e65100' },
    { id: 'operating', icon: '📑', name: 'Operating Agreement or Bylaws', required: 'Required', status: '⏳ Pending', statusColor: '#e65100' },
    { id: 'id', icon: '🪪', name: 'Government-Issued ID (all beneficial owners)', required: 'Required', status: '⏳ Pending', statusColor: '#e65100' },
    { id: 'financials', icon: '📊', name: 'Financial Statements (last 2 years)', required: 'Recommended', status: '⚪ Optional', statusColor: '#888' },
    { id: 'bank_statements', icon: '🏧', name: 'Bank Statements (last 3 months)', required: 'Recommended', status: '⚪ Optional', statusColor: '#888' }
];

export default class CommercialOnboarding extends LightningElement {
    @api brand = {};
    @track currentStep = 1;
    @track applicationRef = '';
    @track formData = { legalName:'', dba:'', businessType:'llc', industry:'', ein:'', yearEstablished:'', annualRevenue:'1m_10m', employees:'' };
    @track owners = [{ id: 1, num: 1, name:'', title:'', ownership:'', ssn:'' }];
    @track selectedServices = new Set();
    @track services = SERVICES_LIST.map(s => ({ ...s, selected: false, cssClass: 'svc-tile', selectedStyle: '', checkStyle: 'display:none' }));
    @track documents = DOCS_LIST.map(d => ({ ...d, statusStyle: `color:${d.statusColor}` }));

    get steps() {
        return STEP_LABELS.map((label, i) => {
            const id = i + 1;
            const isActive = id === this.currentStep;
            const isDone = id < this.currentStep;
            return {
                id, num: isDone ? '✓' : String(id), label,
                cssClass: `step-tab ${isActive ? 'step-tab--active' : ''} ${isDone ? 'step-tab--done' : ''}`,
                activeStyle: isActive ? `border-bottom:3px solid ${this.brand.primaryColor};color:${this.brand.primaryColor};` : '',
                numStyle: (isActive || isDone) ? `background:${this.brand.primaryColor};color:#fff;` : ''
            };
        });
    }

    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isStep5() { return this.currentStep === 5; }
    get progressStyle() { return `width:${((this.currentStep - 1) / 4) * 100}%; background:${this.brand.primaryColor};`; }
    get headerStyle() { return `background:${this.brand.primaryColor};`; }
    get primaryTextStyle() { return `color:${this.brand.primaryColor};`; }
    get primaryBtnStyle() { return `background:${this.brand.primaryColor}; border-radius:${this.brand.buttonRadius || '6px'};`; }
    get primaryBgStyle() { return `background:${this.brand.primaryColor};`; }
    get infoBannerStyle() { return `background:${this.brand.primaryLight || '#f8f6ff'}; border-left:3px solid ${this.brand.primaryColor};`; }

    handleInput(event) {
        const field = event.target.dataset.field;
        this.formData = { ...this.formData, [field]: event.target.value };
    }

    addOwner() {
        const id = this.owners.length + 1;
        this.owners = [...this.owners, { id, num: id, name:'', title:'', ownership:'', ssn:'' }];
    }

    removeOwner(event) {
        const id = parseInt(event.target.dataset.id, 10);
        this.owners = this.owners.filter(o => o.id !== id).map((o, i) => ({ ...o, num: i + 1 }));
    }

    handleOwnerInput(event) {
        const ownerId = parseInt(event.target.dataset.ownerId, 10);
        const field = event.target.dataset.field;
        this.owners = this.owners.map(o => o.id === ownerId ? { ...o, [field]: event.target.value } : o);
    }

    toggleService(event) {
        const id = event.currentTarget.dataset.id;
        this.services = this.services.map(s => {
            if (s.id === id) {
                const selected = !s.selected;
                return {
                    ...s, selected,
                    cssClass: `svc-tile ${selected ? 'svc-tile--selected' : ''}`,
                    selectedStyle: selected ? `border-color:${this.brand.primaryColor}; background:${this.brand.primaryLight};` : '',
                    checkStyle: selected ? `color:${this.brand.primaryColor}; display:block;` : 'display:none'
                };
            }
            return s;
        });
    }

    goToStep(event) {
        const step = parseInt(event.currentTarget.dataset.step, 10);
        if (step <= this.currentStep) this.currentStep = step;
    }

    nextStep() {
        if (this.currentStep === 5) {
            this.applicationRef = 'COM-' + Math.floor(100000 + Math.random() * 900000);
        }
        if (this.currentStep < 5) this.currentStep++;
        else {
            this.applicationRef = 'COM-' + Math.floor(100000 + Math.random() * 900000);
        }
    }

    prevStep() { if (this.currentStep > 1) this.currentStep--; }
}
