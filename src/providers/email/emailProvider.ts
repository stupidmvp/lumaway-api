/**
 * Email Provider
 *
 * Sends transactional emails via Resend.
 * Configure with RESEND_API_KEY environment variable.
 */

import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
    }
    return resend;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'LumaWay <onboarding@resend.dev>';

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
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
