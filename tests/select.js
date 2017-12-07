const mysql = require('../lib')({
  gamesmart: {
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'gamesmart'
    }
  },
  littleapi: {
    default: true,
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'littlebigapi'
    }
  }
});
const Test = require('./models/Test');

(async function () {

  console.log(await new Test().userId(11).userName('TheColorRed').get())
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