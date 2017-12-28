## Installation

To install blueberrypie, use npm:

```
npm install blueberrypie
```

## Introduction

QueryBuilder is a node.js library that utilizes the [mysql](https://www.npmjs.com/package/mysql) npm driver.

Here is a basic example of how to use the query builder:

```js
let { initdb, db } = require('blueberrypie')

initdb({
  myConnection: {
    connection: {
      host: 'localhost',
      user: 'me',
      password: 'secret',
      database: 'my_db'
    }
  }
})

db.table('users')
  .where('id', 12345)
  .first()
  .then(user => {
    console.log(user.username)
    db.disconnect()
  })
```

## Connections

The query builder can handle many connection configurations. Calling `initdb` should only be called once within the application, because connections stay open once the application starts. You can set up configurations like this:

```js
const { initdb } = require('blueberrypie');

initdb({
  connectionA: {
    default: true,
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'database1'
    }
  },
  connectionB: {
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'database2'
    }
  }
});
```

* `connectionA | connectionB`: This is the name of the connection. It can be pretty much any valid JavaScript property.
* `default`: This is the default connection and there should only be one, otherwise you might get unexpected results. If you have only one connection than this option is optional.
* `connection`: This is a list of connection options. For a full list of connection options see: [Connection Options](https://www.npmjs.com/package/mysql#connection-options) in the mysql package.

### Connection Options

* `default: boolean = undefined` This determines if this is the default connection to connect to. This is optional if there is only one connection. If there is more than one connection this value should be set otherwise unexpected connections may be selected.
* `safeAlter: boolean = true` This determines if the the query builder should allow for mass updates/deletes with or without a `where` clause. By default this is set to true, so all update/delete queries must have a `where` clause if using the query builder. Raw queries are not affected (those using `db.update` and `db.delete`)
* `dumpQueries: boolean = false` This determines if the queries for that connection should be dumped to the console or not. This is helpful for debugging queries and will output an object containing the query string, placeholder value array and the connection that was used to make the query.
* `saveNonDirtyRows: boolean = false` This determines if updates should update non-dirty rows. By default dirty rows are not updated in the database.
* `connection: Settings` This the database connection object. See [Connection Options](https://www.npmjs.com/package/mysql#connection-options) for more information.


To connect to a specific connection you can call the `connection()` method from `db`

```js
const { db } = require('blueberrypie');

// Set your connection config

db.connection('connectionA');
```

You can also select the default connection by calling `table`. If only one connection is difined, it automatically is the default connection.

```js
const { db } = require('blueberrypie');

// Set your connection config

db.table('users');
```

## Raw Queries

Sometimes you need to run raw queries, to do so it is made easy by calling the correct query you would like to run.

To run an insert you can call the `insert()` method. This will return information about the insert such as the `insertId`.

```js
const { db } = require('blueberrypie');

// Set your connection config

(async () => {
  let result = await db.insert('insert into users (username) values (?)', ['MyUser']);
  console.log(result.insertId);
})();
```

If you want to run the query on a connection other than the default, just pass 3 parameters to the method.

```js
db.insert('connectionB', 'insert into users (username) values (?)', ['MyUser']);
```

## Query Builder

The query builder is how you can quickly make queries without writing the actual query. It is very helpful when you want to build a query and have lots of if statements or just because you can.

```js
const { db } = require('blueberrypie');

// Make connection to database

(async () => {
  // Find all users who are 50 and older and have a salary of 100,000 or more
  let users = await db.table('users')
    .where('salary', '>=', 100000)
    .where('age', '>=', 50)
    .get()

  console.log(users)
})();
```

With the query builder that seems very basic, but it allows you to not only join items like that but it allows you to write cleaner queries if you have a loop, if statements or something else. This allows you to clean up those queries.

Take this express example, we hit a route and pass `first/last` name as route parameters. Then in our loop we pass those params and their values to the query builder, then get the first item that was returned.

```js
// require express here
const { db } = require('blueberrypie');

// Make connection to database
// Connect to an express app

app.get('/:first/:last', async (req, res) => {
  let users = db.table('users');
  for (let param in req.params) {
    users.where(param, req.params[param]);
  }
  res.json(await users.first());
});
```

### Retrieving rows with query builder

There are multiple ways to get results from the database, and each method may modify your query to optimize the query speed such as `first()`, `value()` and `chunk()`.

### get()

`get()` will return an array of rows that match the query.

### first()

`first()` will return the first row found in the database. It will temporarily modify the limit to `limit 1` before it is ran to optimize the query speed.

### value(column)

`value()` will return the specified columns value of the first row found in the database. This runs `first()` then gets the result.

### values(column)

`values()` will return an array of values of the specified column.

### chunk(results, callback(rows))

`chunk()` will run multiple queries returning a maximum number of results specified by `results` in each chunk until there are no more results left. Each chunk of rows will be passed to the callback.

```js
// Get all purchases where amount > 200
// Chunk the results into groups of 1000 rows
// Assuming there are 2000 matching records it will run these 3 queries:
// "select * from purchases where amount > 200 limit 0, 1000"
// "select * from purchases where amount > 200 limit 1000, 1000"
// "select * from purchases where amount > 200 limit 2000, 1000"
new purchases().where('amount', '>', 200).chunk(1000, (rows) => {
  rows.forEach(row => {
    // Do something with the row
  });
});
```

Q: In this example we run 3 queries. Why not 2?

A: Because, our second query returns the the max number of results, so it is possible that there is more, so a 3rd query is ran to check. If there were only 999 results returned in the second query a 3rd query would not be run.

## Models

Models create database table structures. They define how the application and the data relate to one another. This helps for building queries quickly.

Here is an example of a simple Model. We start off by creating a class that extends the `model` class. In the constructor we call the model's super and pass in a object of settings that the model should adhere to.

```js
const { model } = require('blueberrypie')

module.exports = class users extends model {
  constructor() {
    super({
      table: 'users',
      primaryKey: ['id'],
      fillable: ['username', 'password', 'email'],
      hidden: ['password']
    });
  }
}
```

* `table`: this is the table that this model relates to
* `primaryKey`: this is the primary key of the table, which is an array of column names
* `fillable`: this is an array of columns that can be filled when inserted or updated. Anything not in this list will be ignored.
* `hidden`: this is a list of fields that will be removed when running `.toArray()` or `.toJson()`. This is handy for api calls to hide private database data.

Next we can use this model the following way

```js
const users = require('./models/users');

///////////////////////////////////////////////////
/// The connection should already have been made
/// See: Connections
///////////////////////////////////////////////////

(async () => {
  // Get the user
  let user = await users.firstOrNew({ id: 1 }, {
    username: 'MrAwesome',
    password: genPassHash('abc123'),
    email: 'example@example.com',
    // This is not in the fillable array, it will be ignored:
    dob: '1990-01-01'
  });
  // If the user with an id of 1 is not found create a new user
  if (user.new) {
    let info = await user.save();
    console.log(info.insertId);
  }
})();
```

In the above example we utilize the `user` model that was created in the previous code block.

1. Using `user.firstOrNew()` we pass an object of `where` items to identify the item in the database.
2. When the result comes back we can check and see if this is a new item or an existing item with `user.new`.
3. If it is a new item we will set the columns, otherwise we will continue on.
4. Next we save the items. If the model is dirty it will run the query otherwise it will just exit and return `false`.

We can also automatically inesrt the record using `firstOrCreate()` which will automatically insert the record if one does not exist. This way `save()` does't have to be called.

```js
const users = require('./models/users');

///////////////////////////////////////////////////
/// The connection should already have been made
/// See: Connections
///////////////////////////////////////////////////

(async () => {
  // Get the user
  let user = await users.firstOrCreate({ id: 1 }, {
    username: 'MrAwesome',
    password: genPassHash('abc123'),
    email: 'example@example.com',
    // This is not in the fillable array, it will be ignored:
    dob: '1990-01-01'
  });
  console.log(user.item('id'));
})();
```