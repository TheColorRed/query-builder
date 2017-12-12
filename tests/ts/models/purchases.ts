import { model } from 'query-builder'

export interface Purchase {
  id?: number
  amount?: number
}

export default class purchases extends model<Purchase> {

  public constructor() {
    super({
      table: 'purchases',
      fillable: ['amount'],
      primaryKey: ['id']
    })
  }

  public awesome() {
    console.log('hi')
  }

}