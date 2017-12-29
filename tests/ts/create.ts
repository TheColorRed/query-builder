import { initdb, db } from 'query-builder'
import purchases, { Purchase } from './models/purchases'

import * as assert from 'assert'
import user, { User } from './models/users';

// purchases.chunk(10, (rows) => {
//   console.log(rows)
// }).then(() => db.disconnect());

(async () => {
  initdb({
    test: {
      dumpQueries: true,
      connection: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test'
      }
    }
  })

  console.log((await user.where<user, User>('users.id', 1).purchases().get()).toArray())

  // console.log(purchases.where('id', 4).join('test', (join) => {
  //   join.on('a', 'b').where('a', [1, 212, 12, 3])
  // }).toString())

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
  db.disconnect()
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

})()