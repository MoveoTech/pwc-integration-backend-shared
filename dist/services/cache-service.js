"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class CacheService {
    constructor() {
        this.cache = new node_cache_1.default();
    }
    static getCacheService() {
        if (this.cacheServiceInstance) {
            return this.cacheServiceInstance;
        }
        this.cacheServiceInstance = new CacheService();
        return this.cacheServiceInstance;
    }
    setKey(key, object, ttl) {
        const success = this.cache.set(key, object, ttl !== null && ttl !== void 0 ? ttl : '');
        return success;
    }
    getKey(key) {
        const value = this.cache.get(key);
        if (value == undefined) {
            return false;
        }
        return value;
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cache-service.js.map