import { LightningElement, api, track } from 'lwc';
import { brandStyle } from 'c/bankingTheme';
import { callApi, liveLabel, liveClass } from 'c/bankingApi';

const CHANNELS = [
    { id: 'sftp', label: 'Lockbox and SFTP' },
    { id: 'ach', label: 'ACH origination' },
    { id: 'wire', label: 'Wire transfers' }
];

export default class PaymentChannelSetup extends LightningElement {
    @api brand = {};
    @track activeChannel = 'wire';
    @track sftpSaved = false;
    @track achSaved = false;
    @track wireSaved = false;
    @track sftpTicket = '';
    @track achTicket = '';
    @track wireTicket = '';
    @track sftpTested = false;
    @track sftpData = {};
    @track achData = {};
    @track wireData = {};
    @track sftpLive;
    @track wireLive;

    @track wirePermissions = [
        { id: 'domestic_outgoing', name: 'Send domestic wires', desc: 'USD to US banks through Fedwire or CHIPS', enabled: true },
        { id: 'domestic_incoming', name: 'Receive domestic wires', desc: 'USD from US banks', enabled: true },
        { id: 'international_outgoing', name: 'Send international wires', desc: 'Foreign currency through SWIFT', enabled: false },
        { id: 'international_incoming', name: 'Receive international wires', desc: 'Foreign currency from banks abroad', enabled: false },
        { id: 'repetitive', name: 'Saved recipient templates', desc: 'Reuse beneficiary details', enabled: true },
        { id: 'non_repetitive', name: 'One-time wires', desc: 'Ad hoc entries without a template', enabled: false }
    ];

    get brandStyle() { return brandStyle(this.brand); }

    // ── Channel list with live status ──
    get channels() {
        const status = {
            sftp: this.sftpSaved ? `Saved, ticket ${this.sftpTicket}` : 'Not set up',
            ach: this.achSaved ? `Saved, ticket ${this.achTicket}` : 'Not set up',
            wire: this.wireSaved ? `Saved, ticket ${this.wireTicket}` : 'Draft'
        };
        const saved = { sftp: this.sftpSaved, ach: this.achSaved, wire: this.wireSaved };
        return CHANNELS.map(c => {
            const active = c.id === this.activeChannel;
            return {
                ...c,
                status: status[c.id],
                statusClass: saved[c.id] ? 'ch-status ch-status--saved' : 'ch-status',
                cssClass: `ch ${active ? 'ch--active' : ''}`,
                ariaCurrent: active ? 'true' : null
            };
        });
    }

    get showSftp() { return this.activeChannel === 'sftp'; }
    get showAch() { return this.activeChannel === 'ach'; }
    get showWire() { return this.activeChannel === 'wire'; }

    selectChannel(event) { this.activeChannel = event.currentTarget.dataset.channel; }

    // Switch state is derived on every render, so it always follows the active brand.
    get permissionRows() {
        return this.wirePermissions.map(p => ({
            ...p,
            inputId: `perm-${p.id}`,
            stateLabel: p.enabled ? 'On' : 'Off',
            switchClass: `switch ${p.enabled ? 'switch--on' : ''}`
        }));
    }

    togglePerm(event) {
        const id = event.target.dataset.id;
        this.wirePermissions = this.wirePermissions.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    }

    handleSftpInput(event) { this.sftpData = { ...this.sftpData, [event.target.dataset.field]: event.target.value }; }
    handleAchInput(event) { this.achData = { ...this.achData, [event.target.dataset.field]: event.target.value }; }
    handleWireInput(event) { this.wireData = { ...this.wireData, [event.target.dataset.field]: event.target.value }; }

    async testSftp() {
        const d = this.sftpData;
        this.sftpLive = await callApi('testSftp', { host: d.sftpHost, port: Number(d.sftpPort) || 22, username: d.sftpUser, auth: d.sftpAuth || 'ssh_key', remotePath: d.sftpPath });
        this.sftpTested = true;
    }

    get sftpTestText() {
        const r = this.sftpLive && this.sftpLive.data;
        return r && r.result === 'connected'
            ? `Connected in ${r.handshakeMs} ms. Write test ${r.writeTest === 'pass' ? 'passed' : 'failed'}.`
            : 'Connection test queued. Treasury support will confirm the host and credentials.';
    }
    get sftpLiveLabel() { return liveLabel(this.sftpLive); }
    get sftpLiveClass() { return liveClass(this.sftpLive); }
    get wireLiveLabel() { return liveLabel(this.wireLive); }
    get wireLiveClass() { return liveClass(this.wireLive); }

    saveSftp() {
        this.sftpTicket = 'SFTP-' + Math.floor(10000 + Math.random() * 90000);
        this.sftpSaved = true;
    }

    saveAch() {
        this.achTicket = 'ACH-' + Math.floor(10000 + Math.random() * 90000);
        this.achSaved = true;
    }

    async saveWire() {
        const permissions = {};
        this.wirePermissions.forEach(p => { permissions[p.id] = p.enabled; });
        const d = this.wireData;
        const live = await callApi('provisionWire', {
            permissions,
            limits: { perWire: Number(d.wireLimit) || null, daily: Number(d.wireDailyLimit) || null, dualControlAbove: Number(d.dualControlThreshold) || null },
            approvalType: d.approvalType || 'threshold',
            swiftBic: d.swiftBic, correspondentBank: d.correspondentBank
        });
        this.wireLive = live;
        this.wireTicket = (live && live.data.ticket) || 'WIRE-' + Math.floor(10000 + Math.random() * 90000);
        this.wireSaved = true;
    }
}
