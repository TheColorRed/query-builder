import { Connection, packetCallback } from 'mysql'
import { Root } from './Root'
import { ModelSettings, ModelItems } from './Model';
import { DB } from './DB';
import { BaseBuilder, queryType } from './BaseBuilder';

export class QueryResult { }

export class Builder extends BaseBuilder {

  public constructor(connection: Connection | ModelSettings) {
    super()
    if (connection && 'connection' in connection && (<any>connection).connection.length > 0) {
      this._conn = DB.getConnection((<ModelSettings>connection).connection || '').conn
    } else if ('threadId' in connection) {
      this._conn = connection as Connection
    } else {
      let conn = DB.connections.find(c => c.config.default === true)
      if (conn) {
        this._conn = conn.conn
      }
    }
  }

  public async insert(): Promise<packetCallback | boolean> {
    this.queryType = queryType.insert
    if (this.opt.set.length == 0) return false
    let results = await this.query<packetCallback>()
    this.reset()
    return results
  }

  public async update(update?: ModelItems): Promise<packetCallback | null> {
    this.queryType = queryType.update
    if (update) {
      for (let key in update) {
        this.set(key, update[key])
      }
    }
    let results = await this.query<packetCallback>()
    this.reset()
    return results
  }

  public async delete() {
    this.queryType = queryType.delete
    let results = await this.query<packetCallback>()
    this.reset()
    return results
  }

  public async get<T>(): Promise<T[]> {
    let results = await this.query<T[]>()
    this.reset()
    return results
  }

  public async first<T>(): Promise<T | null> {
    this.limit(1)
    let results = await this.query<T[]>()
    this.reset()
    if (results && results[0]) {
      return results[0]
    }
    return null
  }

  public async values(column: string) {
    this.opt.select = []
    this.select(column)
    let result = await this.get()
    if (result) {
      return result.reduce<any[]>((arr, val: any) => arr.concat(val[column]), [])
    }
    return []
  }

  public async value<T>(column: string): Promise<T> {
    this.opt.select = []
    this.select(column)
    return (await this.first() as any)[column]
  }

  public async chunk<T>(records: number, callback: (rows: T[]) => void) {
    let offset = 0
    let results: T[] = []
    let totalResults = 0
    do {
      this.limit(records, offset)
      results = await this.query<T[]>()
      if (results.length > 0) { callback(results) }
      offset += records
      totalResults += results.length
    } while (results.length == records)
    this.reset()
    return totalResults
  }

  public async count(column: string = '*', distinct: boolean = false) {
    this.opt.select = []
    this.select(`count(${distinct ? 'distinct' : ''} ${column}) as total`)
    return (await this.first() as any)['total']
  }

  private async query<T>() {
    return await Root.query<T>(this._conn, this.toString(), this._placeholders)
  }

}