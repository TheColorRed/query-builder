"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_builder_1 = require("query-builder");
const purchases_1 = require("./models/purchases");
query_builder_1.initdb({
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
// purchases.create<purchases, Purchase>().awesome();
(async () => {
    let p = await purchases_1.default.firstOrNew({ id: 1000 });
    p.forEach(row => {
        console.log(row);
    });
    // await p.set('amount', 100).save()
    query_builder_1.db.disconnect();
    // try {
    //   // await purchases.create<purchases, Purchase>({ amount: Math.round(Math.random() * 1000) }).save()
    //   // console.log(await purchases.all())
    // } catch (e) {
    //   console.log(e.sql)
    //   console.log(e.message)
    // }
    // let p = await purchases.firstOrCreate<purchases, Purchase>({ id: 100 }, {
    //   amount: 123
    // })
    // console.log(p.item('amount'))
    // db.disconnect()
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
