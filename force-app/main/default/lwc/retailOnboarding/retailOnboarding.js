import { LightningElement, api, track } from 'lwc';

const STEP_LABELS = ['Welcome', 'Personal Info', 'Address & ID', 'Account', 'Review'];

export default class RetailOnboarding extends LightningElement {
    @api brand = {};

    @track currentStep = 1;
    @track selectedAccount = 'premierPlus';
    @track submitSuccess = false;
    @track accountNumber = '';

    @track formData = {
        firstName: '', lastName: '', dob: '', ssn: '', email: '', phone: '',
        street: '', city: '', state: '', zip: '', idType: 'drivers_license', idNumber: '',
        initialDeposit: '100', agreed: false
    };

    get steps() {
        return STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isActive = num === this.currentStep;
            const isDone = num < this.currentStep;
            return {
                id: num,
                num: isDone ? '✓' : String(num),
                label,
                cssClass: `step-indicator ${isActive ? 'step-indicator--active' : ''} ${isDone ? 'step-indicator--done' : ''}`,
                activeStyle: isActive ? `color:${this.brand.primaryColor}` : isDone ? `color:${this.brand.primaryColor}; opacity:0.7` : '',
                circleStyle: (isActive || isDone) ? `background:${this.brand.primaryColor}; color:#fff;` : ''
            };
        });
    }

    get progressFillStyle() {
        const pct = ((this.currentStep - 1) / (STEP_LABELS.length - 1)) * 100;
        return `width:${pct}%; background:${this.brand.primaryColor};`;
    }

    get submitDisabled() { return !this.formData.agreed; }
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isStep5() { return this.currentStep === 5; }

    get brandName() { return this.brand.logoMark || 'Your Bank'; }
    get heroBgStyle() { return `background:${this.brand.primaryColor};`; }
    get primaryBtnStyle() { return `background:${this.brand.primaryColor}; border-radius:${this.brand.buttonRadius};`; }
    get primaryTextStyle() { return `color:${this.brand.primaryColor};`; }
    get badgeStyle() { return `background:${this.brand.primaryColor}; color:#fff;`; }
    get accountCardStyle() { return `border:2px solid ${this.brand.primaryLight};`; }
    get successBannerStyle() { return `background:${this.brand.primaryLight}; border-left:4px solid ${this.brand.primaryColor};`; }

    get premierPlusClass() { return `account-tile ${this.selectedAccount === 'premierPlus' ? 'account-tile--selected' : ''}`; }
    get premierClass() { return `account-tile ${this.selectedAccount === 'premier' ? 'account-tile--selected' : ''}`; }
    get selectedAccountLabel() { return this.selectedAccount === 'premierPlus' ? 'Premier Plus Checking' : 'Premier Checking'; }

    handleInput(event) {
        const field = event.target.dataset.field;
        this.formData = { ...this.formData, [field]: event.target.value };
    }

    handleCheck(event) {
        this.formData = { ...this.formData, agreed: event.target.checked };
    }

    selectPremierPlus() { this.selectedAccount = 'premierPlus'; }
    selectPremier() { this.selectedAccount = 'premier'; }

    nextStep() {
        if (this.currentStep < STEP_LABELS.length) this.currentStep++;
    }

    prevStep() {
        if (this.currentStep > 1) this.currentStep--;
    }

    handleSubmit() {
        this.accountNumber = '****' + Math.floor(1000 + Math.random() * 9000);
        this.submitSuccess = true;
    }
}
