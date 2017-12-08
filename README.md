## Connections

The query builder can handle many connection configurations. Calling config should only be called once within the application, because connections stay open once the application starts. You can set up configurations like this:

```js
const { config } = require('query-builder');

let mysql = config({
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

* `connectionA | connectionB`: This is the name of the connection. It can be anything.
* `default`: This is the default connection and there should only be one, otherwise you might get unexpected results. If you have only one connection than this option is optional.
* `connection`: This is a list of connection options. For a full list of connection options see: [Connection Options](https://www.npmjs.com/package/mysql#connection-options) in the mysql package.

To connect to a specific connection you can call the `connection()` method from `db`

```js
const { db } = require('query-builder');

// Set your connection config

db.connection('connectionA')
```

You can also select the default connection by calling `table`

```js
const { db } = require('query-builder');

// Set your connection config

db.table('users')
```

## Raw Queries

Sometimes you need to run raw queries, to do so it is made easy by calling the correct query you would like to run.

To run an insert you can call the `insert()` method. This will return information about the insert such as the `insertId`.

```js
const { db } = require('query-builder');

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
const { db } = require('query-builder');

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
const { db } = require('query-builder');

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

## Models

Models create database table structures. They define how the application and the data relate to one another. This helps for building queries quickly.

Here is an example of a simple Model. We start off by creating a class that extends the `Model` class. In the constructor we call the model's super and pass in a object of settings that the model should adhere to.

```js
const { Model } = require('query-builder')

module.exports = class Users extends Model {
  constructor() {
    super({
      table: 'users',
      primaryKey: ['id'],
      fillable: ['username', 'password', 'email']
    });
  }
}
```

* `table`: this is the table that this model relates to
* `primaryKey`: this is the primary key of the table, which is an array of column names
* `fillable`: this is an array of columns that can be filled when inserted or updated. Anything not in this list will be ignored.

Next we can use this model the following way

```js
const { Model } = require('query-builder');
const Users = require('./models/users');

///////////////////////////////////////////////////
/// The connection should already have been made
/// See: Connections
///////////////////////////////////////////////////

(async () => {
  // Get the user
  let user = await Model.firstOrNew(Users, { id: 1 });
  // If the user with an id of 1 is not found create a new user
  if (user.isNew) {
    // These keys MUST be in the "fillable" array within the Model.
    // Values not in the fillable array will be skipped.
    user.set('username', 'MrAwesome');
    user.set('password', genPassHash('abc123'));
    user.set('email', 'example@example.com');
    // This is not in the fillable array, it will be ignored:
    user.set('dob', '1990-01-01');
  }
  // Insert a new item or update the current item
  await user.save();
})();
```

In the above example we utilize the `User Model` that was created

1. Using `Model.firstOrNew()` we pass the type of model we want to it, the we pass an object of `where` items.
2. When the result comes back we can check and see if this is a new item or an existing item with `user.isNew`.
3. If it is a new item we will set the columns, otherwise we will continue on.
4. Next we save the items. If the model is dirty it will run the query otherwise it will just exit and return `false`.