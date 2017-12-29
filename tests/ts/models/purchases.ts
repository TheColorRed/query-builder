import { model, type } from 'query-builder'

export interface Purchase {
  id: type.int
  amount: type.int
}

export default class purchases extends model<Purchase> {

  public constructor() {
    super({
      table: 'purchases',
      fillable: ['amount'],
      primaryKey: ['id']
    })
  }

}