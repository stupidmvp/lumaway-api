"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateInvitation = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before create: checks if there's already a pending invitation or an existing member
 * for this email + project combo. Also cleans up old non-pending invitations to avoid
 * unique constraint violations on (projectId, email).
 */
const checkDuplicateInvitation = async (context) => {
    const { projectId, email } = context.data || {};
    if (!projectId || !email)
        return context;
    const normalizedEmail = email.toLowerCase().trim();
    // Check for existing pending invitation
    const [existingPending] = await adapters_1.db
        .select()
        .from(schema_1.projectInvitations)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectInvitations.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.projectInvitations.email, normalizedEmail), (0, drizzle_orm_1.eq)(schema_1.projectInvitations.status, 'pending')))
        .limit(1);
    if (existingPending) {
        throw new Error('An invitation for this email is already pending for this project');
    }
    // Check if user is already a member (by looking up the user by email first)
    const { users } = await Promise.resolve().then(() => __importStar(require('../../../db/schema')));
    const [user] = await adapters_1.db
        .select({ id: users.id })
        .from(users)
        .where((0, drizzle_orm_1.eq)(users.email, normalizedEmail))
        .limit(1);
    if (user) {
        const [existingMember] = await adapters_1.db
            .select()
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id)))
            .limit(1);
        if (existingMember) {
            throw new Error('This user is already a member of this project');
        }
    }
    // Clean up old non-pending invitations for this email+project to avoid
    // unique constraint violation on (projectId, email)
    await adapters_1.db
        .delete(schema_1.projectInvitations)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectInvitations.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.projectInvitations.email, normalizedEmail), (0, drizzle_orm_1.ne)(schema_1.projectInvitations.status, 'pending')));
    return context;
};
exports.checkDuplicateInvitation = checkDuplicateInvitation;
