const Model = require('../../lib/Model')

module.exports = class Test extends Model {

  constructor() {
    super({
      table: 'test'
    })
  }

  userId(id) {
    return this.where('id', id)
  }

  userName(name) {
    return this.where('name', name)
  }

}