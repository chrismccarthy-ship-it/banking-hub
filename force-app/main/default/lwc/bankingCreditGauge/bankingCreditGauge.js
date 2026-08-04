import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

const CREDIT_SCORE_FIELD = 'Contact.Credit_Score__c';
const GAUGE_RADIUS = 80;
const TOTAL_ARC_LENGTH = Math.PI * GAUGE_RADIUS; // semicircle circumference

export default class CreditScoreGauge extends LightningElement {
    @api brandColor = '#5a3fc0';
    @api contactId;
    @api fallbackScore = 720;

    @track _resolvedScore = null;

    @wire(getRecord, { recordId: '$contactId', fields: [CREDIT_SCORE_FIELD] })
    wiredContact({ data, error }) {
        if (data) {
            const val = getFieldValue(data, CREDIT_SCORE_FIELD);
            this._resolvedScore = val ? Number(val) : null;
        }
    }

    get creditScore() {
        return this._resolvedScore || this.fallbackScore || 720;
    }

    // Map 300–850 to 0–1
    get scoreRatio() {
        return Math.min(Math.max((this.creditScore - 300) / 550, 0), 1);
    }

    // Dash array for the filled arc
    get arcDashArray() {
        return `${TOTAL_ARC_LENGTH} ${TOTAL_ARC_LENGTH}`;
    }

    // Offset controls how much of the arc is visible
    get arcDashOffset() {
        const filled = this.scoreRatio * TOTAL_ARC_LENGTH;
        return TOTAL_ARC_LENGTH - filled;
    }

    // Needle angle: -180deg (300) to 0deg (850), mapped to SVG coords
    get needleAngle() {
        return -180 + this.scoreRatio * 180;
    }

    get needleX2() {
        const rad = (this.needleAngle * Math.PI) / 180;
        return 100 + 65 * Math.cos(rad);
    }

    get needleY2() {
        const rad = (this.needleAngle * Math.PI) / 180;
        return 100 + 65 * Math.sin(rad);
    }

    // Color based on score tier
    get arcColor() {
        const s = this.creditScore;
        if (s >= 800) return '#1a6b3a';
        if (s >= 740) return '#2e7d32';
        if (s >= 670) return '#558b2f';
        if (s >= 580) return '#e65100';
        return '#b71c1c';
    }

    get tierLabel() {
        const s = this.creditScore;
        if (s >= 800) return 'Exceptional';
        if (s >= 740) return 'Very Good';
        if (s >= 670) return 'Good';
        if (s >= 580) return 'Fair';
        return 'Poor';
    }

    get scoreLabel() {
        return 'FICO® Score';
    }

    get gaugeAriaLabel() {
        return `Credit score gauge: ${this.creditScore} — ${this.tierLabel}`;
    }

    get tierBadgeStyle() {
        return `background:${this.arcColor}20; color:${this.arcColor}; border:1px solid ${this.arcColor}40;`;
    }
}
