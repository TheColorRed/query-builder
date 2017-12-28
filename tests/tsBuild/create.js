"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_builder_1 = require("query-builder");
const purchases_1 = require("./models/purchases");
// purchases.chunk(10, (rows) => {
//   console.log(rows)
// }).then(() => db.disconnect());
(async () => {
    query_builder_1.initdb({
        test: {
            dumpQueries: true,
            connection: {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'test'
            }
        }
    });
    console.log(purchases_1.default.where('id', 4).rightJoin('test', (join) => {
        join.on('a', 'b').on('c', 'd');
    }).toString());
    // let p = await purchases.where<purchases, Purchase>('id', '<', 10).get()
    // p.forEach((r) => {
    //   r.amount = 20
    // })
    // for (let i of p) {
    //   i.amount = 10//Math.round(Math.random() * 100)
    // }
    // p.set({ amount: 100 })
    // await p.save()
    // let p = await purchases.firstOrNew<purchases, Purchase>({ id: 1000 })
    // p.forEach(row => {
    //   console.log(row)
    // })
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
