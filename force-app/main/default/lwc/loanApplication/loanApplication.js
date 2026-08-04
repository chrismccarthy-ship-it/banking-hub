import { LightningElement, api, track } from 'lwc';

const RATES = { auto: 5.49, home: 6.75, personal: 8.99 };
const ICONS = { auto: '🚗', home: '🏠', personal: '💵' };
const TITLES = { auto: 'Auto Loan', home: 'Home Mortgage', personal: 'Personal Loan' };

export default class LoanApplication extends LightningElement {
    @api brand = {};
    @api loanType = 'auto';

    @track currentStep = 1;
    @track loanApproved = false;
    @track loanRef = '';
    @track loanData = {
        vehicleYear: '2024', vehicleMake: '', vehicleModel: '',
        vehicleCondition: 'new', vehiclePrice: '', downPayment: '',
        propertyAddress: '', propertyType: 'single_family',
        purchasePurpose: 'purchase', propertyValue: '', loanTerm: '30',
        loanPurpose: 'debt_consolidation', loanAmount: '',
        employmentStatus: 'employed', employer: '', annualIncome: '', yearsEmployed: '', otherIncome: '0'
    };

    get isAutoLoan() { return this.loanType === 'auto'; }
    get isHomeLoan() { return this.loanType === 'home'; }
    get isPersonalLoan() { return this.loanType === 'personal'; }
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get totalSteps() { return 3; }
    get loanIcon() { return ICONS[this.loanType] || '💰'; }
    get loanTitle() { return TITLES[this.loanType] || 'Loan'; }
    get startingRate() { return `${RATES[this.loanType]}%`; }

    get headerStyle() { return `background:${this.brand.primaryColor};`; }
    get primaryBtnStyle() { return `background:${this.brand.primaryColor}; border-radius:${this.brand.buttonRadius || '6px'};`; }
    get primaryTextStyle() { return `color:${this.brand.primaryColor};`; }
    get calcBoxStyle() { return `background:${this.brand.primaryLight || '#f8f6ff'}; border-left:3px solid ${this.brand.primaryColor};`; }
    get successStyle() { return `background:${this.brand.primaryLight}; border-left:4px solid ${this.brand.primaryColor};`; }
    get progressStyle() {
        const pct = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        return `width:${pct}%; background:${this.brand.primaryColor};`;
    }

    // Calculated fields
    get estimatedLoanAmount() {
        const price = parseFloat(this.loanData.vehiclePrice) || 0;
        const down = parseFloat(this.loanData.downPayment) || 0;
        return `$${Math.max(0, price - down).toLocaleString()}`;
    }

    get estimatedMonthlyPayment() {
        const val = parseFloat(this.loanData.propertyValue) || 450000;
        const down = parseFloat(this.loanData.downPayment) || 90000;
        const principal = val - down;
        const r = RATES.home / 100 / 12;
        const n = 360;
        const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return isNaN(payment) ? '$--' : `$${Math.round(payment).toLocaleString()}/mo`;
    }

    get personalMonthlyPayment() {
        const amt = parseFloat(this.loanData.loanAmount) || 15000;
        const months = parseInt(this.loanData.loanTerm, 10) || 60;
        const r = RATES.personal / 100 / 12;
        const payment = amt * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        return isNaN(payment) ? '$--' : `$${Math.round(payment).toLocaleString()}/mo`;
    }

    handleInput(event) {
        const field = event.target.dataset.field;
        this.loanData = { ...this.loanData, [field]: event.target.value };
    }

    nextStep() { if (this.currentStep < this.totalSteps) this.currentStep++; }
    prevStep() { if (this.currentStep > 1) this.currentStep--; }

    submitLoan() {
        this.loanRef = 'LN-' + Math.floor(100000 + Math.random() * 900000);
        this.loanApproved = true;
    }
}
