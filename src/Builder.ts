import { packetCallback } from 'mysql'
import { BuilderBase, queryType } from './BuilderBase';
import { ModelOptions, ModelItems } from './ModelBase';
import { QueryBuilder } from './QueryBuilder';
import { Row } from './Row';
import { DB, Connection } from './DB';

export class Builder extends BuilderBase {

  public constructor(connection?: Connection | ModelOptions) {
    super()
    if (connection && 'connection' in connection && (<any>connection).connection.length > 0) {
      this._conn = DB.getConnection((<ModelOptions>connection).connection || '')
    } else if (connection && 'threadId' in connection) {
      this._conn = connection as Connection
    } else {
      let conn = DB.connections.find(c => c.config && c.config.default === true)
      if (conn) {
        this._conn = conn
      } else {
        this._conn = DB.connections[0]
      }
    }
  }

  public async insert(): Promise<packetCallback | boolean> {
    this.queryType = queryType.insert
    if (this.opt.set.length == 0) return false
    let results = await this.query<packetCallback>()
    return results
  }

  public async update(items?: ModelItems): Promise<packetCallback | null> {
    this.queryType = queryType.update
    if (this._conn.config.safeAlter && this.opt.where.length == 0 && this.opt.between.length == 0)
      throw new Error(`A where clause is required${this._conn ? ` when using connection "${this._conn.name}"` : ''}. Set "safeAlter = false" in the initdb to disable.`)
    if (items) {
      for (let key in items) {
        this.setValue(key, items[key])
      }
    }
    return await this.query<packetCallback>()
  }

  public async delete() {
    this.queryType = queryType.delete
    if (this._conn.config.safeAlter && this.opt.where.length == 0) {
      throw new Error(`A where clause is required${this._conn ? ` when using connection "${this._conn.name}"` : ''}. Set "safeAlter = false" in the initdb to disable.`)
    }
    let results = await this.query<packetCallback>()
    return results
  }

  public async get<I extends ModelItems>(): Promise<Row<I>[] | this> {
    this.queryType = queryType.select
    let results = await this.query<I[]>()
    let rows: Row<I>[] = []
    results.forEach((result: any) => rows.push(new Row(result, false)))
    return rows
  }

  public async first<I extends ModelItems>(): Promise<Row<I> | this> {
    this.queryType = queryType.select
    let currentLimit = this._limit
    this.limit(1)
    let results = await this.query<any[]>()
    this.limit(currentLimit)
    if (results && results[0]) {
      // console.log(results[0])
      return new Row<I>(results[0], false)
    }
    return new Row<I>(undefined, false)
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
    if (Array.isArray(result)) {
      let values: any[] = []
      result.forEach((item: { [key: string]: any }) => values.push(item[column]))
      return values
      // return result.reduce<any[]>((arr, val: any) => arr.concat(val[column]), [])
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

  public async firstOrFail<I extends ModelItems>(): Promise<Row<I> | this> {
    let first = await this.first<I>()
    if ('length' in first && first.length == 0) {
      throw new Error('Record was not found')
    }
    return first
  }

  private async query<T>() {
    try {
      return await QueryBuilder.query<T>(this._conn, this.toString(), this._placeholders)
    } catch (e) {
      throw e
    }
  }

}