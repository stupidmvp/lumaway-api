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
exports.findRoles = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `admin-roles`.
 *
 * Lists all roles with user/permission counts.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findRoles = async (context) => {
    const { count: countFn } = await Promise.resolve().then(() => __importStar(require('drizzle-orm')));
    const allRoles = await adapters_1.db
        .select({
        id: schema_1.roles.id,
        name: schema_1.roles.name,
        description: schema_1.roles.description,
        createdAt: schema_1.roles.createdAt,
    })
        .from(schema_1.roles)
        .where((0, drizzle_orm_1.isNull)(schema_1.roles.deletedAt))
        .orderBy(schema_1.roles.name);
    // Count users per role
    const userCounts = await adapters_1.db
        .select({
        roleId: schema_1.userRoles.roleId,
        count: countFn(schema_1.userRoles.userId),
    })
        .from(schema_1.userRoles)
        .groupBy(schema_1.userRoles.roleId);
    const countMap = {};
    for (const uc of userCounts) {
        countMap[uc.roleId] = Number(uc.count);
    }
    // Count permissions per role
    const permCounts = await adapters_1.db
        .select({
        roleId: schema_1.rolePermissions.roleId,
        count: countFn(schema_1.rolePermissions.permissionId),
    })
        .from(schema_1.rolePermissions)
        .groupBy(schema_1.rolePermissions.roleId);
    const permCountMap = {};
    for (const pc of permCounts) {
        permCountMap[pc.roleId] = Number(pc.count);
    }
    context.result = {
        data: allRoles.map((r) => ({
            ...r,
            usersCount: countMap[r.id] || 0,
            permissionsCount: permCountMap[r.id] || 0,
        })),
        total: allRoles.length,
    };
    return context;
};
exports.findRoles = findRoles;
