import { LightningElement, api, track } from 'lwc';
import { brandStyle } from 'c/bankingTheme';
import { callApi, liveLabel, liveClass } from 'c/bankingApi';

const STEPS = [
    { id: 1, name: 'Welcome', hint: "What you'll need" },
    { id: 2, name: 'About you', hint: 'Name and contact' },
    { id: 3, name: 'Address and ID', hint: 'Where you live' },
    { id: 4, name: 'Account', hint: 'Choose and fund' },
    { id: 5, name: 'Review', hint: 'Agree and submit' }
];

const ACCOUNTS = {
    premierPlus: { label: 'Premier Plus Checking' },
    premier: { label: 'Premier Checking' }
};

const MIN_DEPOSIT = 25;

export default class RetailOnboarding extends LightningElement {
    @api brand = {};
    @api recordId;

    @track currentStep = 1;
    @track selectedAccount = 'premierPlus';
    @track submitSuccess = false;
    @track accountNumber = '';
    @track accountLive;
    @track depositTouched = false;

    @track formData = {
        firstName: '', lastName: '', dob: '', ssn: '', email: '', phone: '',
        street: '', city: '', state: '', zip: '', idType: 'drivers_license', idNumber: '',
        initialDeposit: '100', agreed: false
    };

    get brandStyle() { return brandStyle(this.brand); }
    get brandName() { return (this.brand && this.brand.label) || 'your bank'; }

    // ── Progress rail ──
    get steps() {
        return STEPS.map(s => {
            const done = s.id < this.currentStep;
            const current = s.id === this.currentStep;
            return {
                ...s,
                summary: done ? this.summaryFor(s.id) : s.hint,
                cssClass: `vstep ${done ? 'vstep--done' : current ? 'vstep--current' : 'vstep--upcoming'}`,
                dot: done ? '' : String(s.id),
                ariaCurrent: current ? 'step' : null
            };
        });
    }

    summaryFor(id) {
        const f = this.formData;
        if (id === 1) return 'Ready to start';
        if (id === 2) return `${f.firstName} ${f.lastName}`.trim() || 'Details added';
        if (id === 3) return f.city ? `${f.city}${f.state ? ', ' + f.state : ''}` : 'Address added';
        if (id === 4) return ACCOUNTS[this.selectedAccount].label;
        return '';
    }

    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isStep5() { return this.currentStep === 5; }
    get showBack() { return this.currentStep > 1 && !this.submitSuccess; }
    get showContinue() { return this.currentStep > 1 && this.currentStep < STEPS.length; }
    get showSubmit() { return !this.submitSuccess; }
    get showAgreeHint() { return !this.formData.agreed && !this.submitSuccess; }

    // ── Account choice ──
    get premierPlusSelected() { return this.selectedAccount === 'premierPlus'; }
    get premierSelected() { return this.selectedAccount === 'premier'; }
    get premierPlusClass() { return `choice ${this.premierPlusSelected ? 'choice--on' : ''}`; }
    get premierClass() { return `choice ${this.premierSelected ? 'choice--on' : ''}`; }
    get selectedAccountLabel() { return ACCOUNTS[this.selectedAccount].label; }

    selectPremierPlus() { this.selectedAccount = 'premierPlus'; }
    selectPremier() { this.selectedAccount = 'premier'; }

    // ── Deposit validation ──
    get depositValid() { return Number(this.formData.initialDeposit) >= MIN_DEPOSIT; }
    get showDepositError() { return this.depositTouched && !this.depositValid; }
    get depositFieldClass() { return `field deposit ${this.showDepositError ? 'field--error' : ''}`; }
    get depositAmount() {
        const n = Number(this.formData.initialDeposit) || 0;
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    // ── Review ──
    get fullName() { return `${this.formData.firstName} ${this.formData.lastName}`.trim() || 'Not provided'; }
    get emailText() { return this.formData.email || 'Not provided'; }
    get phoneText() { return this.formData.phone || 'Not provided'; }
    get addressText() {
        const f = this.formData;
        const parts = [f.street, f.city, f.state].filter(Boolean);
        return parts.length ? parts.join(', ') : 'Not provided';
    }
    get submitDisabled() { return !this.formData.agreed || this.submitSuccess; }

    handleInput(event) {
        const field = event.target.dataset.field;
        this.formData = { ...this.formData, [field]: event.target.value };
        if (field === 'initialDeposit') this.depositTouched = true;
    }

    handleCheck(event) {
        this.formData = { ...this.formData, agreed: event.target.checked };
    }

    nextStep() {
        if (this.currentStep === 4 && !this.depositValid) {
            this.depositTouched = true;
            return;
        }
        if (this.currentStep < STEPS.length) this.currentStep++;
    }

    prevStep() {
        if (this.currentStep > 1) this.currentStep--;
    }

    // Core account-open call. Identity fields (SSN, DOB) never leave the page in the demo.
    async handleSubmit() {
        const f = this.formData;
        const live = await callApi('openAccount', {
            applicant: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
            product: this.selectedAccount,
            address: { line1: f.street, city: f.city, state: f.state, postalCode: f.zip },
            openingDeposit: { amount: Number(f.initialDeposit) || 0, currency: 'USD', source: 'external_transfer' },
            paperlessStatements: true,
            debitCard: true
        });
        this.accountLive = live;
        const masked = live && live.data.account && live.data.account.maskedNumber;
        this.accountNumber = masked || '****' + Math.floor(1000 + Math.random() * 9000);
        this.submitSuccess = true;
    }

    get accountLiveLabel() { return liveLabel(this.accountLive); }
    get accountLiveClass() { return liveClass(this.accountLive); }
}
