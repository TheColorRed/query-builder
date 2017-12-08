const { Model } = require('../../lib')

module.exports = class Test extends Model {

  constructor() {
    super({
      table: 'test',
      primaryKey: ['id'],
      fillable: ['name']
    })
  }

}