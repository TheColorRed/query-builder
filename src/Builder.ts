import * as mysql from 'mysql'
import { Root } from './Root'
import { ModelOptions, ModelItems } from './Model';
import { DB } from './DB';
import { BaseBuilder, queryType } from './BaseBuilder';

export class QueryResult { }

export class Builder extends BaseBuilder {

  public constructor(connection: mysql.Connection | ModelOptions) {
    super()
    if (connection && 'connection' in connection && (<any>connection).connection.length > 0) {
      this._conn = DB.getConnection((<ModelOptions>connection).connection || '').conn
    } else if ('threadId' in connection) {
      this._conn = connection as mysql.Connection
    } else {
      let conn = DB.connections.find(c => c.config.default === true)
      if (conn) {
        this._conn = conn.conn
      }
    }
  }

  public async insert(): Promise<mysql.packetCallback | null | boolean> {
    this.queryType = queryType.insert
    if (this._set.length == 0) return false
    let query = this.toString()
    let results = await Root.query<mysql.packetCallback>(this._conn, query, this._placeholders)
    this.reset()
    if (results) {
      return results
    }
    return null
  }

  public async update(update?: ModelItems): Promise<mysql.packetCallback | null> {
    this.queryType = queryType.update
    if (update) {
      for (let key in update) {
        this.set(key, update[key])
      }
    }
    let query = this.toString()
    let results = await Root.query<mysql.packetCallback>(this._conn, query, this._placeholders)
    this.reset()
    if (results) {
      return results
    }
    return null
  }

  public async get<T>(): Promise<T[]> {
    let query = this.toString()
    let results = await Root.query<T[]>(this._conn, query, this._placeholders)
    this.reset()
    return results
  }

  public async first<T>(): Promise<T | null> {
    this.limit(1)
    let query = this.toString()
    let results = await Root.query<T[]>(this._conn, query, this._placeholders)
    this.reset()
    if (results && results[0]) {
      return results[0]
    }
    return null
  }

  public async values(column: string) {
    this._select = []
    this.select(column)
    let result = await this.get()
    if (result) {
      return result.reduce<any[]>((arr, val: any) => arr.concat(val[column]), [])
    }
    return []
  }

  public async value(column: string) {
    this._select = []
    this.select(column)
    return (await this.first() as any)[column]
  }

}