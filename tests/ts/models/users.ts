import { model, type } from 'query-builder';
import purchases from './purchases';

export interface User {
  user_id: type.int
  first_name: type.varchar
}

export default class user extends model<User> {

  public constructor() {
    super({
      table: 'users',
      primaryKey: ['user_id']
    })
  }

  public purchases() {
    return this.hasOne<user, User>(purchases)
  }

}