const { model } = require('query-builder')

module.exports = class Test extends model {

  constructor() {
    super({
      table: 'inc',
      primaryKey: ['id'],
      fillable: ['name']
    })
  }

}