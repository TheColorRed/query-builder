const Test = require('./models/Test')
const { init, db, raw, model } = require('query-builder')

init({
  gamesmart: {
    default: true,
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test'
    }
  }
});

(async function () {
  new Test()
  let users = await (await new Test().where('id', [2, 4]).increment('viewed', 10)).get()

  // let users = await db.table('users')
  //   .where({ id: 1, username: 'TheColorRed' }).toString()
  // .chunk(10, (rows) => {
  //   console.log(rows.length)
  //   rows.forEach(row => {
  //     console.log(row.player_tag)
  //   })
  // })

  console.log(users)


  // console.log(await new Test().userId(11).get())
  // console.log(await mysql.table('test').toString())


  // let i = await mysql.insert('insert into test (name) values (?)', ['TheColorRed'])
  // console.log(i)

  // console.log(await mysql.delete('delete from test where name = ? limit 1', ['TheColorRed']))

  // console.log(
  //   await mysql.table('test')
  //     .first()
  // )
  // console.log(
  //   await mysql.table('users')
  //     .where('player_tag', 'like', 'the%')
  //     .limit(2)
  //     .orderBy('id')
  //     .value('player_tag')
  // )
  db.disconnect()
})()