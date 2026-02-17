"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationMarkReadService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `notification-mark-read` service — mark all notifications as read for authenticated user.
 *
 * - create(data) → POST /notification-mark-read
 *
 * The actual logic lives in `hooks/markAllRead.ts`.
 */
class NotificationMarkReadService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.NotificationMarkReadService = NotificationMarkReadService;
