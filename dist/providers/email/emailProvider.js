"use strict";
/**
 * Email Provider
 *
 * Sends transactional emails via Resend.
 * Configure with RESEND_API_KEY environment variable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
let resend = null;
function getResendClient() {
    if (!resend) {
        resend = new resend_1.Resend(process.env.RESEND_API_KEY || 'placeholder');
    }
    return resend;
}
const DEFAULT_FROM = process.env.EMAIL_FROM || 'LumaWay <onboarding@resend.dev>';
async function sendEmail(options) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY not configured — email logged to console instead');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.text || options.html}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }
    console.log('[emailProvider] Attempting to send via Resend. From:', DEFAULT_FROM, 'To:', options.to);
    const { data, error } = await getResendClient().emails.send({
        from: DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    });
    if (error) {
        console.error('[emailProvider] Failed to send email via Resend:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
    console.log('[emailProvider] Email sent successfully. Resend response:', data);
}
