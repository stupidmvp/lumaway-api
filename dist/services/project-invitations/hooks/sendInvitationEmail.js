"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvitationEmail = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const emailProvider_1 = require("../../../providers/email/emailProvider");
/**
 * After create: sends an invitation email to the invitee.
 */
const sendInvitationEmail = async (context) => {
    const invitation = context.result;
    console.log('[sendInvitationEmail] Hook triggered. Result:', invitation ? { id: invitation.id, email: invitation.email, token: invitation.token?.substring(0, 8) + '...', invitedBy: invitation.invitedBy } : 'NO RESULT');
    if (!invitation)
        return context;
    try {
        // Get project name
        const [project] = await adapters_1.db
            .select({ name: schema_1.projects.name })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, invitation.projectId))
            .limit(1);
        // Get inviter name
        const [inviter] = await adapters_1.db
            .select({ firstName: schema_1.users.firstName, lastName: schema_1.users.lastName, email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, invitation.invitedBy))
            .limit(1);
        const projectName = project?.name || 'a project';
        const inviterName = inviter
            ? [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || inviter.email
            : 'Someone';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteUrl = `${frontendUrl}/invite/${invitation.token}`;
        const roleLabel = invitation.role === 'owner' ? 'Owner' : invitation.role === 'editor' ? 'Editor' : 'Viewer';
        console.log('[sendInvitationEmail] Sending email to:', invitation.email, 'from inviter:', inviterName, 'project:', projectName);
        await (0, emailProvider_1.sendEmail)({
            to: invitation.email,
            subject: `${inviterName} invited you to join "${projectName}" on LumaWay`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                    <h2 style="color: #1a1a1a; margin-bottom: 8px; font-size: 20px;">You've been invited</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
                        <strong>${inviterName}</strong> invited you to join <strong>${projectName}</strong> as <strong>${roleLabel}</strong> on LumaWay.
                    </p>
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Accept Invitation
                    </a>
                    <p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">
                        This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `${inviterName} invited you to join "${projectName}" as ${roleLabel} on LumaWay.\n\nAccept the invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.`,
        });
        console.log('[sendInvitationEmail] Email sent successfully to:', invitation.email);
    }
    catch (error) {
        console.error('[sendInvitationEmail] Error sending invitation email:', error);
        // Non-blocking: invitation is created even if email fails
    }
    return context;
};
exports.sendInvitationEmail = sendInvitationEmail;
