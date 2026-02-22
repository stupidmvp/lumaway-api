"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identityDecisionSchema = exports.securityDecisionSchema = exports.responseDecisionSchema = exports.retrievalDecisionSchema = exports.plannerDecisionSchema = exports.intentDecisionSchema = void 0;
const zod_1 = require("zod");
exports.intentDecisionSchema = zod_1.z.object({
    intent: zod_1.z.string(),
    responseType: zod_1.z.enum(['answer', 'guide', 'clarify']),
    confidence: zod_1.z.number().min(0).max(1),
});
exports.plannerDecisionSchema = zod_1.z.object({
    allow: zod_1.z.boolean(),
    category: zod_1.z.enum(['safe', 'abuse', 'uncertain']),
    reason: zod_1.z.string(),
    safeMessage: zod_1.z.string().optional(),
    intent: zod_1.z.string(),
    responseType: zod_1.z.enum(['answer', 'guide', 'clarify']),
    confidence: zod_1.z.number().min(0).max(1),
    suggestedWalkthroughIds: zod_1.z.array(zod_1.z.string()).max(3),
});
exports.retrievalDecisionSchema = zod_1.z.object({
    suggestedWalkthroughIds: zod_1.z.array(zod_1.z.string()).max(3),
});
exports.responseDecisionSchema = zod_1.z.object({
    responseType: zod_1.z.enum(['answer', 'guide', 'clarify']),
    message: zod_1.z.string().min(1),
});
exports.securityDecisionSchema = zod_1.z.object({
    allow: zod_1.z.boolean(),
    category: zod_1.z.enum(['safe', 'abuse', 'uncertain']),
    reason: zod_1.z.string(),
    safeMessage: zod_1.z.string().optional(),
});
exports.identityDecisionSchema = zod_1.z.object({
    hasProvidedName: zod_1.z.boolean(),
    providedName: zod_1.z.string().min(1).max(60).optional(),
});
