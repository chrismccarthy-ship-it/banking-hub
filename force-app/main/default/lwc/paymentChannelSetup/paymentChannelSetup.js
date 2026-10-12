import { LightningElement, api, track } from 'lwc';

export default class PaymentChannelSetup extends LightningElement {
    @api brand = {};
    @track activeChannel = 'sftp';
    @track sftpSaved = false;
    @track achSaved = false;
    @track wireSaved = false;
    @track sftpTicket = '';
    @track achTicket = '';
    @track wireTicket = '';
    @track sftpData = {};
    @track achData = {};
    @track wireData = {};

    @track wirePermissions = [
        { id: 'domestic_outgoing', name: 'Domestic Outgoing Wires', desc: 'Send USD wires via Fedwire/CHIPS', enabled: true },
        { id: 'domestic_incoming', name: 'Domestic Incoming Wires', desc: 'Receive USD wires', enabled: true },
        { id: 'international_outgoing', name: 'International Outgoing Wires', desc: 'Send foreign currency via SWIFT', enabled: false },
        { id: 'international_incoming', name: 'International Incoming Wires', desc: 'Receive foreign currency wires', enabled: false },
        { id: 'repetitive', name: 'Repetitive Wire Templates', desc: 'Save and reuse beneficiary details', enabled: true },
        { id: 'non_repetitive', name: 'Non-Repetitive Wires', desc: 'One-time ad-hoc wire entries', enabled: false }
    ];

    get showSftp() { return this.activeChannel === 'sftp'; }
    get showAch() { return this.activeChannel === 'ach'; }
    get showWire() { return this.activeChannel === 'wire'; }

    get primaryTextStyle() { return `color:${this.brand.primaryColor};`; }
    get primaryBtnStyle() { return `background:${this.brand.primaryColor}; border-radius:${this.brand.buttonRadius || '6px'};`; }
    get badgeStyle() { return `background:${this.brand.primaryLight || '#f3f0fa'}; color:${this.brand.primaryColor};`; }
    get confirmStyle() { return `background:${this.brand.primaryLight}; border-left:3px solid ${this.brand.primaryColor};`; }
    get toggleOnStyle() { return `background:${this.brand.primaryColor};`; }

    tabStyle(channel) {
        return this.activeChannel === channel
            ? `border-bottom:3px solid ${this.brand.primaryColor}; color:${this.brand.primaryColor}; font-weight:700;`
            : '';
    }

    get sftpTabClass() { return `channel-tab ${this.activeChannel === 'sftp' ? 'channel-tab--active' : ''}`; }
    get achTabClass() { return `channel-tab ${this.activeChannel === 'ach' ? 'channel-tab--active' : ''}`; }
    get wireTabClass() { return `channel-tab ${this.activeChannel === 'wire' ? 'channel-tab--active' : ''}`; }
    get sftpTabStyle() { return this.tabStyle('sftp'); }
    get achTabStyle() { return this.tabStyle('ach'); }
    get wireTabStyle() { return this.tabStyle('wire'); }

    selectChannel(event) { this.activeChannel = event.currentTarget.dataset.channel; }

    handleSftpInput(event) { this.sftpData = { ...this.sftpData, [event.target.dataset.field]: event.target.value }; }
    handleAchInput(event) { this.achData = { ...this.achData, [event.target.dataset.field]: event.target.value }; }
    handleWireInput(event) { this.wireData = { ...this.wireData, [event.target.dataset.field]: event.target.value }; }

    // Toggle colour is derived from the active brand on every render, so it follows brand switches.
    get permissionRows() {
        return this.wirePermissions.map(p => ({
            ...p,
            toggleStyle: p.enabled ? `background:${this.brand.primaryColor};` : ''
        }));
    }

    togglePerm(event) {
        const id = event.target.dataset.id;
        this.wirePermissions = this.wirePermissions.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    }

    testSftp() { alert('SFTP connection test: checking host reachability and credentials...'); }

    saveSftp() {
        this.sftpTicket = 'SFTP-' + Math.floor(10000 + Math.random() * 90000);
        this.sftpSaved = true;
    }

    saveAch() {
        this.achTicket = 'ACH-' + Math.floor(10000 + Math.random() * 90000);
        this.achSaved = true;
    }

    saveWire() {
        this.wireTicket = 'WIRE-' + Math.floor(10000 + Math.random() * 90000);
        this.wireSaved = true;
    }
}
