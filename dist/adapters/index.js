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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleAdapter = exports.db = void 0;
const core_1 = require("@flex-donec/core");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("../db/schema"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Create Postgres Client
const client = (0, postgres_1.default)(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lumaway');
exports.db = (0, postgres_js_1.drizzle)(client, { schema });
// Extend DrizzleAdapter to expose the db instance for services
class ExtendedDrizzleAdapter extends core_1.DrizzleAdapter {
    constructor(dbConfig) {
        super(dbConfig);
        this.db = exports.db; // Inject the schema-aware db instance
    }
}
exports.drizzleAdapter = new ExtendedDrizzleAdapter(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lumaway');
