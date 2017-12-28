"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_builder_1 = require("query-builder");
class purchases extends query_builder_1.model {
    constructor() {
        super({
            table: 'purchases',
            fillable: ['amount'],
            primaryKey: ['id']
        });
    }
    static awesome() {
        return this.create().awesome();
    }
    awesome() {
        console.log('hi');
        return this;
    }
}
exports.default = purchases;
