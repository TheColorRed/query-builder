const { model } = require('../../lib')

module.exports = class Test extends model {

  constructor() {
    super({
      table: 'test',
      primaryKey: ['id'],
      fillable: ['name']
    })
  }

}