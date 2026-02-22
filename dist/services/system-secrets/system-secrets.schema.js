"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSecretsPatchSchema = exports.systemSecretsCreateSchema = exports.systemSecretsSchema = void 0;
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
exports.systemSecretsSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.systemSecrets);
exports.systemSecretsCreateSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.systemSecrets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.systemSecretsPatchSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.systemSecrets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).partial();
