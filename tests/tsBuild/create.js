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
// purchases.chunk(10, (rows) => {
//   console.log(rows)
// }).then(() => db.disconnect());
purchases_1.default.create().awesome();
(async () => {
    try {
        // await purchases.create<purchases, Purchase>({ amount: Math.round(Math.random() * 1000) }).save()
        // console.log(await purchases.all())
    }
    catch (e) {
        console.log(e.sql);
        console.log(e.message);
    }
    // db.disconnect()
    // describe('Saving Records', () => {
    //   describe('#create()', () => {
    //     it('should not throw an error', () => {
    //       assert.doesNotThrow(async () => {
    //       })
    //     })
    //   })
    //   describe('#firstOrNew()', () => {
    //     it('should not throw an error', () => {
    //       assert.doesNotThrow(async () => {
    //         let first = await purchases.firstOrNew<purchases, Purchase>({ amount: 5000 })
    //         first.save()
    //       })
    //     })
    //   })
    // })
})();
