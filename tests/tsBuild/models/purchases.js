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
    awesome() {
        console.log('hi');
    }
}
exports.default = purchases;
