const Model = require('../../lib/Model')

module.exports = class Test extends Model.Model {

  constructor() {
    super({
      table: 'users'
    })
  }

  userId(id) {
    return this.where('id', id)
  }

  userName(name) {
    return this.where('name', name)
  }

}