"use strict";
/**
 * Centralized Notification Dispatcher
 *
 * Handles both in-app notifications and email notifications
 * with a two-layer gate system:
 *
 * Layer 1 — Project settings (admin/owner controls):
 *   If the project disables a notification type, NO member receives it
 *   (neither in-app nor email). Acts as an organizational kill switch.
 *
 * Layer 2 — User preferences (individual controls):
 *   - In-app notifications are ALWAYS created (if project allows)
 *   - Email notifications respect user preferences:
 *     1. Master toggle: `emailNotifications` must be ON
 *     2. Per-type toggle: the specific email preference must be ON
 *
 * Usage:
 *   await dispatchNotification({
 *       userId: recipientId,
 *       type: 'mention',
 *       projectId: projectId,   // optional — enables project-level gate
 *       title: 'John mentioned you',
 *       body: 'Check this out...',
 *       metadata: { projectId, commentId },
 *       email: {
 *           subject: 'John mentioned you in a comment',
 *           html: '<p>...</p>',
 *           text: '...',
 *       },
 *   });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchNotification = dispatchNotification;
exports.buildNotificationEmail = buildNotificationEmail;
exports.buildCommentUrl = buildCommentUrl;
const adapters_1 = require("../../adapters");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const emailProvider_1 = require("../email/emailProvider");
// ── Project-level setting mapping ────────────────────────────────────────
/**
 * Maps notification types to the project setting key that controls whether
 * this notification type is enabled at the project level.
 * If the project setting is OFF, no member receives this notification type
 * (neither in-app nor email).
 */
const PROJECT_SETTING_MAP = {
    mention: 'notifyOnMention',
    comment_reply: 'notifyOnReply',
    reaction: 'notifyOnReaction',
    correction: 'notifyOnCorrection',
    comment_resolved: 'notifyOnResolved',
    announcement: 'notifyOnAnnouncement',
    project_invitation: 'notifyOnNewMember',
    invitation_accepted: 'notifyOnNewMember',
};
/**
 * Default project-level setting values.
 * All notification types are enabled by default at the project level.
 */
const PROJECT_SETTING_DEFAULTS = {
    notifyOnMention: true,
    notifyOnReply: true,
    notifyOnReaction: true,
    notifyOnCorrection: true,
    notifyOnResolved: true,
    notifyOnAnnouncement: true,
    notifyOnNewMember: true,
};
// ── User preference mapping ─────────────────────────────────────────────
/**
 * Maps notification types to the user preference key that controls email
 * delivery for that type. If a type is not mapped, email is always sent
 * (as long as the master toggle is on).
 */
const EMAIL_PREF_MAP = {
    mention: 'emailOnMention',
    comment_reply: 'emailOnReply',
    reaction: 'emailOnReaction',
    correction: 'emailOnCorrection',
    comment_resolved: 'emailOnResolved',
    announcement: 'emailOnAnnouncement',
    project_invitation: 'notifyOnInvitation',
    invitation_accepted: 'notifyOnInvitation',
};
/**
 * Default email preference values for each type.
 * Reactions default to false (too noisy, like social media).
 */
const EMAIL_PREF_DEFAULTS = {
    emailOnMention: true,
    emailOnReply: true,
    emailOnReaction: false, // social-media style: reactions don't email by default
    emailOnCorrection: true,
    emailOnResolved: true,
    emailOnAnnouncement: true,
    notifyOnInvitation: true,
};
// ── Dispatcher ──────────────────────────────────────────────────────────
/**
 * Dispatches both in-app and (optionally) email notifications.
 *
 * Gate order:
 *   1. Project setting (if projectId provided) — if OFF, skip everything
 *   2. Create in-app notification (always, if project allows)
 *   3. Email: user master toggle must be ON
 *   4. Email: per-type user preference must be ON
 */
async function dispatchNotification(options) {
    const { userId, type, projectId, title, body, metadata, email } = options;
    // ── 0. Check project-level notification setting ──────────────
    if (projectId) {
        try {
            const [project] = await adapters_1.db
                .select({ settings: schema_1.projects.settings })
                .from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
                .limit(1);
            if (project) {
                const projectSettings = (project.settings || {});
                const settingKey = PROJECT_SETTING_MAP[type];
                if (settingKey) {
                    const settingValue = projectSettings[settingKey];
                    const defaultValue = PROJECT_SETTING_DEFAULTS[settingKey] ?? true;
                    const isEnabled = settingValue !== undefined ? Boolean(settingValue) : defaultValue;
                    if (!isEnabled) {
                        // Project has disabled this notification type — skip entirely
                        return;
                    }
                }
            }
        }
        catch (error) {
            console.error(`[notificationDispatcher] Failed to check project settings for project ${projectId}:`, error);
            // Non-blocking: proceed with notification if project check fails
        }
    }
    // ── 1. Create in-app notification (always) ──────────────────
    try {
        await adapters_1.db.insert(schema_1.notifications).values({
            userId,
            type,
            title,
            body: body || null,
            metadata: metadata || {},
        });
    }
    catch (error) {
        console.error(`[notificationDispatcher] Failed to create in-app notification for user ${userId}:`, error);
    }
    // ── 2. Send email (if applicable) ───────────────────────────
    if (!email)
        return;
    try {
        // Fetch user preferences + email
        const [user] = await adapters_1.db
            .select({
            email: schema_1.users.email,
            preferences: schema_1.users.preferences,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user?.email)
            return;
        const prefs = (user.preferences || {});
        // Check master email toggle (defaults to true if not set)
        const masterEmailEnabled = prefs.emailNotifications !== false;
        if (!masterEmailEnabled)
            return;
        // Check per-type email preference
        const prefKey = EMAIL_PREF_MAP[type];
        if (prefKey) {
            const prefValue = prefs[prefKey];
            const defaultValue = EMAIL_PREF_DEFAULTS[prefKey] ?? true;
            const isEnabled = prefValue !== undefined ? Boolean(prefValue) : defaultValue;
            if (!isEnabled)
                return;
        }
        // Send the email
        await (0, emailProvider_1.sendEmail)({
            to: user.email,
            subject: email.subject,
            html: email.html,
            text: email.text,
        });
    }
    catch (error) {
        console.error(`[notificationDispatcher] Failed to send email notification to user ${userId}:`, error);
        // Non-blocking: in-app notification was already created
    }
}
// ── Email template helpers ──────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
/**
 * Generates a simple, clean notification email HTML.
 */
function buildNotificationEmail(options) {
    const { heading, body, ctaLabel, ctaUrl, footer } = options;
    const ctaBlock = ctaLabel && ctaUrl
        ? `<a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">${ctaLabel}</a>`
        : '';
    const footerBlock = footer
        ? `<p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">${footer}</p>`
        : `<p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">You received this email because of your notification settings on LumaWay. You can adjust these in your <a href="${FRONTEND_URL}/settings" style="color: #3b82f6;">settings</a>.</p>`;
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px; font-size: 20px;">${heading}</h2>
            <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">${body}</p>
            ${ctaBlock}
            ${footerBlock}
        </div>
    `;
}
/**
 * Builds the CTA URL for a comment notification.
 */
function buildCommentUrl(metadata) {
    const { projectId, targetType, targetId, stepId } = metadata;
    if (targetType === 'walkthrough' && targetId) {
        return `${FRONTEND_URL}/projects/${projectId}/walkthroughs/${targetId}`;
    }
    if (targetType === 'walkthrough_step' && targetId) {
        const base = `${FRONTEND_URL}/projects/${projectId}/walkthroughs/${targetId}`;
        return stepId ? `${base}?step=${stepId}` : base;
    }
    return `${FRONTEND_URL}/projects/${projectId}`;
}
