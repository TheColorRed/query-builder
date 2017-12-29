"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_builder_1 = require("query-builder");
const purchases_1 = require("./purchases");
class user extends query_builder_1.model {
    constructor() {
        super({
            table: 'users',
            primaryKey: ['user_id']
        });
    }
    purchases() {
        return this.hasOne(purchases_1.default);
    }
}
exports.default = user;
