const Test = require('./models/Test')
const { config, Model } = require('../lib')
const mysql = config({
  gamesmart: {
    default: true,
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'littlebigapi'
    }
  }
});

(async function () {

  let r = await Model.firstOrNew(Test, { id: 13 })
  r.set('name', Math.random())
  console.log(await r.save())


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
  mysql.disconnect()
})()