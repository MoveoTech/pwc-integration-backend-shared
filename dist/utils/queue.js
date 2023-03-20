"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueueExportService {
    static getQueue() {
        return this.queue;
    }
    static setQueue(queue) {
        this.queue = queue;
    }
    static getQueueConnection() {
        return this.connection;
    }
    static setQueueConnection(connection) {
        this.connection = connection;
    }
}
exports.default = QueueExportService;
//# sourceMappingURL=queue.js.map