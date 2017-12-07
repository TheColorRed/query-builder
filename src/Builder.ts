import * as mysql from 'mysql'
import Root from './Root';
import DB, { Connection } from './DB';
import { ModelOptions } from './Model';

export class QueryResult { }

export enum direction { asc = 'asc', desc = 'desc' }
export enum JoinType { join = 'join', leftJoin = 'left join', rightJoin = 'rightJoin' }

export default class Builder extends Root {

  private _conn: mysql.Connection

  private _table: string = ''
  private _distinct: boolean = false
  private _select: Select[] = []
  private _join: Join[] = []
  private _where: Where[] = []
  private _order: Order[] = []
  private _group: Order[] = []
  private _placeholders: any[] = []
  private _limit: number = -1


  public constructor(connection: mysql.Connection | ModelOptions) {
    super()
    if (connection && 'connection' in connection) {
      let conn = DB.getConnection((<ModelOptions>connection).connection || '')
      if (conn) {
        this._conn = conn.conn
      }
    } else if ('threadId' in connection) {
      this._conn = connection as mysql.Connection
    } else {
      let conn = DB.connections.find(c => c.config.default === true)
      if (conn) {
        this._conn = conn.conn
      }
    }
  }

  public table(table: string) {
    this._table = table
    return this
  }

  public select(...args: string[]): this {
    args.forEach(arg => {
      this._select.push(new Select(arg))
    })
    return this
  }

  public distinct() {
    this._distinct = true
    return this
  }

  public where(column: string, value: string): this
  public where(column: string, operator: string, value: string): this
  public where(...args: string[]): this {
    if (args.length == 2) {
      this._where.push(new Where(args[0], args[1]))
    } else if (args.length == 3) {
      this._where.push(new Where(args[0], args[2], args[1]))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereNull(column: string) {
    this._where.push(new Where(column, null, 'is null'))
    return this
  }

  public whereNotNull(column: string) {
    this._where.push(new Where(column, null, 'is not null'))
    return this
  }

  public limit(limit: number): this {
    this._limit = limit
    return this
  }

  public orderBy(column: string, dir: direction = direction.asc): this {
    this._order.push(new Order(column, dir))
    return this
  }

  public groupBy(column: string, dir: direction = direction.asc): this {
    this._group.push(new Order(column, dir))
    return this
  }

  public join(table: string, columnA: string, operator: string, columnB: string) {
    this._join.push(new Join(JoinType.join, table, columnA, operator, columnB))
    return this
  }

  public leftJoin(table: string, columnA: string, operator: string, columnB: string) {
    this._join.push(new Join(JoinType.leftJoin, table, columnA, operator, columnB))
    return this
  }

  public toString(): string {
    let q: string[] = []
    // Create the select
    q.push('select')
    // Make distinct
    this._distinct && q.push('distinct')
    this._select.length == 0 ? q.push('*') : this._select.forEach(select => q.push(select.raw))
    // Create the from
    q.push('from', this.getOption('table'))
    // Create joins
    this._join.forEach(j => {
      q.push(`${j.joinType} ${j.table} on ${j.column.column} ${j.column.operator} ${j.column.value}`)
    })
    // Create the where
    this._where.length > 0 ? q.push('where') : null
    let wheres: string[] = []
    this._where.forEach(where => {
      if (where.value === null) {
        wheres.push(`${where.column} ${where.operator}`)
      } else {
        wheres.push(`${where.column} ${where.operator} ?`)
        this._placeholders.push(where.value)
      }
    })
    if (wheres.length > 0) q = q.concat(wheres.join(' and '))
    // Create the group by
    this._group.length > 0 && q.push(
      'group by',
      this._group.reduce<string[]>((arr, val) => arr.concat(`${val.column} ${val.direction}`), []).join(', ')
    )
    // Create the order by
    this._order.length > 0 && q.push(
      'order by',
      this._order.reduce<string[]>((arr, val) => arr.concat(`${val.column} ${val.direction}`), []).join(', ')
    )
    // Create the limit
    this._limit > 0 && q.push(`limit ${this._limit}`)
    return q.join(' ')
  }

  private getOption(key: string) {
    if ((<any>this).options && (<any>this).options[key]) {
      return (<any>this).options[key] as string
    } else if ((<any>this)[`_${key}`]) {
      return (<any>this)[`_${key}`]
    } else {
      return ''
    }
  }

  public async get<T>(): Promise<T[] | null> {
    let query = this.toString()
    console.log(query)
    let results = await Root.query<T[]>(this._conn, query, this._placeholders)
    this.reset()
    return results
  }

  public async first<T>(): Promise<T | null> {
    this.limit(1)
    let query = this.toString()
    let results = await Root.query<T[]>(this._conn, query, this._placeholders)
    this.reset()
    if (results) {
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

  private reset() {
    this._placeholders = []
    this._select = []
    this._join = []
    this._where = []
    this._order = []
    this._group = []
    this._limit = -1
    this._distinct = false
  }

}

class Table {
  public name: string = ''
  public alias: string = ''

  public constructor(name: string) {

  }
}

class Select {
  public column: string = ''
  public alias: string = ''
  public raw: string = ''

  public constructor(select: string) {
    let cols = select.split(/\sas|\s/i).map(v => v.replace(/[^A-Z0-9_$]/ig, '').trim())
    this.raw = select
    this.column = cols[0]
    if (cols.length == 2) {
      this.alias = cols[1]
    }
  }
}

class Join {
  public joinType: JoinType = JoinType.join
  public table: string = ''
  public column: Where

  public constructor(type: JoinType, table: string, columnA: string, operator: string, columnB: string) {
    this.table = table
    this.column = new Where(columnA, columnB, operator)
  }

}

class Where {
  public column: string = ''
  public operator: string = '='
  public value: string | number | null = ''

  public constructor(column: string, value: string | number | null, operator = '=') {
    this.column = column
    this.value = value
    this.operator = operator
  }
}

class Order {
  public column: string = ''
  public direction: direction = direction.asc

  public constructor(column: string, dir: direction = direction.asc) {
    this.column = column
    this.direction = dir
  }
}