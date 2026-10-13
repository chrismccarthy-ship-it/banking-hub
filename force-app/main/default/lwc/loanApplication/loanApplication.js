import { LightningElement, api, track } from 'lwc';
import { brandStyle } from 'c/bankingTheme';
import { callApi, liveLabel, liveClass } from 'c/bankingApi';

// Illustrative demo rates; production pulls pricing from the loan origination system.
const RATES = { auto: 5.49, home: 6.75, personal: 8.99 };
const TITLES = { auto: 'Auto loan', home: 'Home loan', personal: 'Personal loan' };
const FIRST_STEP = { auto: 'Vehicle', home: 'Property', personal: 'Loan details' };
const AUTO_TERM_MONTHS = 60;

const usd = n => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function monthlyPayment(principal, annualRate, months) {
    const r = annualRate / 100 / 12;
    if (!(principal > 0) || !(months > 0)) return null;
    return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export default class LoanApplication extends LightningElement {
    @api brand = {};
    @api loanType = 'auto';

    @track currentStep = 1;
    @track loanApproved = false;
    @track loanRef = '';
    @track loanLive;
    @track loanData = {
        vehicleYear: '2025', vehicleMake: '', vehicleModel: '',
        vehicleCondition: 'new', vehiclePrice: '35000', downPayment: '',
        propertyAddress: '', propertyType: 'single_family',
        purchasePurpose: 'purchase', propertyValue: '450000', loanTerm: '',  // '' = the first option: 30-year (home) or 60 months (personal)
        loanPurpose: 'debt_consolidation', loanAmount: '15000',
        employmentStatus: 'employed', employer: '', annualIncome: '', yearsEmployed: '', otherIncome: '0'
    };

    get brandStyle() { return brandStyle(this.brand); }

    get isAutoLoan() { return this.loanType === 'auto'; }
    get isHomeLoan() { return this.loanType === 'home'; }
    get isPersonalLoan() { return this.loanType === 'personal'; }
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get loanTitle() { return TITLES[this.loanType] || 'Loan'; }
    get rate() { return RATES[this.loanType] || RATES.auto; }
    get startingRate() { return `${this.rate}%`; }
    get firstStepName() { return FIRST_STEP[this.loanType] || 'Loan details'; }

    get steps() {
        const names = [this.firstStepName, 'Employment and income', 'Review'];
        return names.map((name, i) => {
            const id = i + 1;
            const done = id < this.currentStep;
            const current = id === this.currentStep;
            return {
                id, name,
                status: done ? 'Complete' : current ? 'In progress' : id === 3 ? 'About 1 minute' : 'Next',
                cssClass: `step ${done ? 'step--done' : ''} ${current ? 'step--current' : ''}`,
                ariaCurrent: current ? 'step' : null
            };
        });
    }

    // ── Estimate panel ──
    get price() { return parseFloat(this.loanData.vehiclePrice) || 0; }
    get down() { return parseFloat(this.loanData.downPayment) || 0; }

    get financed() {
        if (this.isHomeLoan) return Math.max(0, (parseFloat(this.loanData.propertyValue) || 0) - (this.down || 0));
        if (this.isPersonalLoan) return parseFloat(this.loanData.loanAmount) || 0;
        return Math.max(0, this.price - this.down);
    }

    get termMonths() {
        if (this.isHomeLoan) return this.loanData.loanTerm === '15' ? 180 : 360;
        if (this.isPersonalLoan) return parseInt(this.loanData.loanTerm, 10) || 60;
        return AUTO_TERM_MONTHS;
    }

    get termLabel() {
        if (this.isHomeLoan) return this.loanData.loanTerm === '15' ? '15-year fixed' : '30-year fixed';
        return `${this.termMonths} months`;
    }

    get monthlyEstimate() {
        const p = monthlyPayment(this.financed, this.rate, this.termMonths);
        return p ? usd(Math.round(p)) : '$0';
    }

    get financedText() { return usd(this.financed); }
    get downText() { return this.down ? `-${usd(this.down)}` : '$0'; }
    get downShare() {
        const base = this.isHomeLoan ? parseFloat(this.loanData.propertyValue) || 0 : this.price;
        if (!base || !this.down) return '';
        return `${Math.round((this.down / base) * 100)}% of the price. 10% or more can lower your rate.`;
    }
    get hasDownShare() { return !!this.downShare; }
    get showDownPaymentRow() { return !this.isPersonalLoan; }

    // ── Review ──
    get employmentLabel() {
        const map = { employed: 'Employed full-time', self_employed: 'Self-employed', part_time: 'Employed part-time', retired: 'Retired' };
        return map[this.loanData.employmentStatus] || this.loanData.employmentStatus;
    }
    get incomeText() {
        const n = parseFloat(this.loanData.annualIncome);
        return n ? usd(n) : 'Not provided';
    }

    handleInput(event) {
        const field = event.target.dataset.field;
        this.loanData = { ...this.loanData, [field]: event.target.value };
    }

    nextStep() { if (this.currentStep < 3) this.currentStep++; }
    prevStep() { if (this.currentStep > 1) this.currentStep--; }

    get showBack() { return this.currentStep > 1 && !this.loanApproved; }
    get showContinue() { return this.currentStep < 3; }
    get showSubmit() { return this.currentStep === 3 && !this.loanApproved; }

    // Decision engine call. Identity fields (SSN, DOB) never leave the page in the demo.
    async submitLoan() {
        const d = this.loanData;
        const live = await callApi('prequalify', {
            loanType: this.loanType,
            vehicle: this.loanType === 'auto' ? { year: d.vehicleYear, make: d.vehicleMake, model: d.vehicleModel, condition: d.vehicleCondition, price: Number(d.vehiclePrice) } : undefined,
            property: this.loanType === 'home' ? { address: d.propertyAddress, type: d.propertyType, value: Number(d.propertyValue) } : undefined,
            amount: this.financed,
            termMonths: this.termMonths,
            employment: { status: d.employmentStatus, annualIncome: Number(d.annualIncome) || null }
        });
        this.loanLive = live;
        this.loanRef = (live && live.data.reference) || 'LN-' + Math.floor(100000 + Math.random() * 900000);
        this.loanApproved = true;
    }

    get loanLiveLabel() { return liveLabel(this.loanLive); }
    get loanLiveClass() { return liveClass(this.loanLive); }
}
