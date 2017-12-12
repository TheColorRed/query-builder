import { Connection, packetCallback } from 'mysql'
import { QueryBuilder } from './QueryBuilder'
import { DB } from './DB';
import { BuilderBase, queryType } from './BuilderBase';
import { ModelSettings, ModelItems } from './ModelBase';

export class QueryResult { }

export class Builder extends BuilderBase {

  public constructor(connection?: Connection | ModelSettings) {
    super()
    if (connection && 'connection' in connection && (<any>connection).connection.length > 0) {
      this._conn = DB.getConnection((<ModelSettings>connection).connection || '').conn
    } else if (connection && 'threadId' in connection) {
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
    return results
  }

  public async update(update?: ModelItems): Promise<packetCallback | null> {
    this.queryType = queryType.update
    if (QueryBuilder.tableSafeAlterMode && this.opt.where.length == 0) throw new Error('A where clause is required. Set "QueryBuilder.tableSafeAlterMode = false" to disable.')
    if (update) {
      for (let key in update) {
        this.setValue(key, update[key])
      }
    }
    let results = await this.query<packetCallback>()
    return results
  }

  public async delete() {
    this.queryType = queryType.delete
    if (QueryBuilder.tableSafeAlterMode && this.opt.where.length == 0) {
      throw new Error('A where clause is required. Set "QueryBuilder.tableSafeAlterMode = false" to disable.')
    }
    let results = await this.query<packetCallback>()
    return results
  }

  public async get<T>(): Promise<T[]> {
    this.queryType = queryType.select
    let results = await this.query<T[]>()
    return results
  }

  public async first<T>(): Promise<T> {
    this.queryType = queryType.select
    let currentLimit = this._limit
    this.limit(1)
    let results = await this.query<T[]>()
    this.limit(currentLimit)
    if (results && results[0]) {
      return results[0]
    }
    return {} as T
  }

  public async value<T>(column: string): Promise<T> {
    this.queryType = queryType.select
    let currentSelect = this.opt.select
    this.opt.select = []
    this.select(column)
    let first = await this.first() as any
    this.opt.select = currentSelect
    return first[column]
  }

  public async values(column: string) {
    this.queryType = queryType.select
    let currentSelect = this.opt.select
    this.opt.select = []
    this.select(column)
    let result = await this.get()
    this.opt.select = currentSelect
    if (result) {
      return result.reduce<any[]>((arr, val: any) => arr.concat(val[column]), [])
    }
    return []
  }

  public async chunk<T>(records: number, callback: (rows: T[]) => void) {
    this.queryType = queryType.select
    let offset = 0
    let results: T[] = []
    let totalResults = 0
    let currentLimit = this._limit
    do {
      this.limit(records, offset)
      results = await this.query<T[]>()
      if (results.length > 0) { callback(results) }
      offset += records
      totalResults += results.length
    } while (results.length == records)
    this.limit(currentLimit)
    return totalResults
  }

  public async count(column: string = '*', distinct: boolean = false) {
    this.queryType = queryType.select
    this.opt.select = []
    this.select(`count(${distinct ? 'distinct' : ''} ${column}) as total`)
    return (await this.first() as any)['total']
  }

  public async firstOrFail<T>(): Promise<T> {
    let first = await this.first() as T
    if (Object.keys(first).length == 0) {
      throw new Error('Record was not found')
    }
    return first as T
  }

  private async query<T>() {
    try {
      return await QueryBuilder.query<T>(this._conn, this.toString(), this._placeholders)
    } catch (e) {
      throw e
    }
  }

}