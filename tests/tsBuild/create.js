"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_builder_1 = require("query-builder");
const purchases_1 = require("./models/purchases");
query_builder_1.init({
    test: {
        connection: {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'test'
        }
    }
});
(async () => {
    await new purchases_1.default().delete();
    // try {
    //   let p = await purchases.findOrFail(2)
    //   await p.delete()
    //   console.log('Item deleted')
    // } catch (e) {
    //   console.log('No item found')
    // }
    // purchases.findOrFail(10).then(data => {
    //   console.log(data)
    //   db.disconnect()
    // }).catch(e => {
    //   console.log(e.message)
    //   db.disconnect()
    // })
    // try {
    //   let find = await purchases.findOrFail({ id: 1 })
    //   console.log(find)
    // } catch (e) {
    //   console.log(e.message)
    // }
    query_builder_1.db.disconnect();
})();
