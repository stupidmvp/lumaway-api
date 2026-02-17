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
exports.ProjectSettingsService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../utils/roles");
/**
 * `project-settings` service — update project settings (deep-merge, owner/admin only).
 *
 * - patch(id, data) → PATCH /project-settings/:id
 */
class ProjectSettingsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
        this.adapter = storage;
    }
    async patch(id, data, params) {
        const userId = params?.user?.id;
        if (!userId) {
            throw new Error('Authentication required');
        }
        const { settings } = data;
        if (!settings || typeof settings !== 'object') {
            throw new Error('Settings object is required');
        }
        // Validate settings shape
        const { projectSettingsSchema } = await Promise.resolve().then(() => __importStar(require('../projects/projects.settings-schema')));
        const parsed = projectSettingsSchema.safeParse(settings);
        if (!parsed.success) {
            throw new Error('Invalid settings');
        }
        const dbInstance = this.adapter.db;
        // Check project exists
        const [project] = await dbInstance
            .select({ id: schema_1.projects.id, organizationId: schema_1.projects.organizationId, settings: schema_1.projects.settings })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, id))
            .limit(1);
        if (!project) {
            throw new Error('Project not found');
        }
        // Check permissions: must be owner of the project (or superadmin)
        const isSuperAdmin = (await (0, roles_1.getUserRoles)(this.adapter, userId)).includes('superadmin');
        if (!isSuperAdmin) {
            const [membership] = await dbInstance
                .select({ role: schema_1.projectMembers.role })
                .from(schema_1.projectMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, id), (0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, userId)))
                .limit(1);
            if (!membership || membership.role !== 'owner') {
                throw new Error('Only project owners can update project settings');
            }
        }
        // Deep-merge settings
        const existingSettings = project.settings || {};
        const mergedSettings = { ...existingSettings, ...parsed.data };
        // Update project
        const [updated] = await dbInstance
            .update(schema_1.projects)
            .set({ settings: mergedSettings, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, id))
            .returning();
        return updated;
    }
    // ── Not implemented methods ──
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.ProjectSettingsService = ProjectSettingsService;
