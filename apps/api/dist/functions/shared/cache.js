"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheCompositeId = cacheCompositeId;
exports.findCacheById = findCacheById;
function cacheCompositeId(item) {
    return item.id ?? item.sk.replace(/^CACHE#/, '');
}
function findCacheById(items, id) {
    return items.find(item => cacheCompositeId(item) === id);
}
//# sourceMappingURL=cache.js.map