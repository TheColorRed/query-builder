import { Select, Join, Where, Order, Set, Raw, Between, JoinClause } from "./QueryConstructs";
import { Connection } from './DB';
import { QueryBuilder } from "./QueryBuilder";

export enum sort { asc = 'asc', desc = 'desc', random = 'rand()' }
export enum joinType { join = 'inner join', leftJoin = 'left join', rightJoin = 'right join' }
export enum condition { and = 'and', or = 'or' }
export enum queryType { select, insert, update, delete }

export interface Opts {
  [key: string]: any[]
  select: (Select | Raw)[]
  join: (Join | Raw)[]
  where: (Where | Raw)[]
  havingWhere: (Where | Raw)[]
  between: (Between | Raw)[]
  havingBetween: (Between | Raw)[]
  set: (Set | Raw)[]
  order: (Order | Raw)[]
  group: (Order | Raw)[]
}

export class BuilderBase {

  public _queryType: queryType = queryType.select

  protected _conn: Connection
  protected _table: string = ''
  protected _distinct: boolean = false
  protected _opts: Opts = {
    select: [new Select('*')],
    join: [],
    where: [],
    havingWhere: [],
    between: [],
    havingBetween: [],
    set: [],
    order: [],
    group: [],
  }

  protected _limit: number = -1
  protected _offset: number = 0

  public toString() {
    return new QueryBuilder(this._queryType, this._table, this._opts, this._limit, this._offset, this._distinct).toString()
  }

  public distinct() {
    this._distinct = true
    return this
  }

  public where(raw: Raw): this
  public where(obj: Object): this
  public where(column: string, value: string | number): this
  public where(column: string, value: any[]): this
  public where(column: string, operator: string, value: string | number): this
  public where(column: string, join: (join: JoinClause) => void): this
  public where(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this._opts.where.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this._opts.where.push(new Where(key, arg[key]))
      }
    } else if (args.length == 2) {
      this._opts.where.push(new Where(<string>args[0], <any>args[1]))
    } else if (args.length == 3) {
      this._opts.where.push(new Where(<string>args[0], <any>args[2], <string>args[1]))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereHaving(raw: Raw): this
  public whereHaving(obj: Object): this
  public whereHaving(column: string, value: string | number): this
  public whereHaving(column: string, value: any[]): this
  public whereHaving(column: string, operator: string, value: string | number): this
  public whereHaving(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this._opts.havingWhere.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this._opts.havingWhere.push(new Where(key, arg[key]))
      }
    } else if (args.length == 2) {
      this._opts.havingWhere.push(new Where(<string>args[0], <any>args[1]))
    } else if (args.length == 3) {
      this._opts.havingWhere.push(new Where(<string>args[0], <any>args[2], <string>args[1]))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public orWhere(raw: Raw): this
  public orWhere(obj: Object): this
  public orWhere(column: string, value: string | number): this
  public orWhere(column: string, value: any[]): this
  public orWhere(column: string, operator: string, value: string | number): this
  public orWhere(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this._opts.where.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this._opts.where.push(new Where(key, arg[key], '=', condition.or))
      }
    } else if (args.length == 2) {
      this._opts.where.push(new Where(<string>args[0], <any>args[1], '=', condition.or))
    } else if (args.length == 3) {
      this._opts.where.push(new Where(<string>args[0], <any>args[2], <string>args[1], condition.or))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereNull(...columns: string[]) {
    columns.forEach(column => this._opts.where.push(new Where(column, null, 'is null')))

    return this
  }

  public whereNotNull(...columns: string[]) {
    columns.forEach(column => this._opts.where.push(new Where(column, null, 'is not null')))
    return this
  }

  public between(column: string, value1: any, value2: any, cond: condition = condition.and) {
    this._opts.between.push(new Between(column, value1, value2, cond))
    return this
  }

  public notBetween(column: string, value1: any, value2: any, cond: condition = condition.and) {
    this._opts.between.push(new Between(column, value1, value2, cond, true))
    return this
  }

  public betweenHaving(column: string, value1: any, value2: any) {
    this._opts.havingBetween.push(new Between(column, value1, value2))
    return this
  }

  public orderBy(dir: sort): this
  public orderBy(column: string, dir: sort): this
  public orderBy(...args: any[]): this {
    if (args.length == 1) {
      this._opts.order.push(new Order('', args[0]))
    } else {
      this._opts.order.push(new Order(args[0], args[1]))
    }
    return this
  }

  public groupBy(column: string, dir: sort = sort.asc): this {
    this._opts.group.push(new Order(column, dir))
    return this
  }

  public join(table: string, callback: (join: JoinClause) => void): this
  public join(table: string, columnA: string, columnB: string): this
  public join(table: string, columnA: string, operator: string, columnB: string): this
  public join(...args: (string | Function)[]) {
    if (args.length == 2) {
      this._opts.join.push(new Join(joinType.join, <string>args[0], <(join: JoinClause) => void>args[1]))
    } else if (args.length == 3) {
      this._opts.join.push(new Join(joinType.join, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this._opts.join.push(new Join(joinType.join, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public leftJoin(table: string, callback: (join: JoinClause) => void): this
  public leftJoin(table: string, columnA: string, columnB: string): this
  public leftJoin(table: string, columnA: string, operator: string, columnB: string): this
  public leftJoin(...args: (string | Function)[]) {
    if (args.length == 2) {
      this._opts.join.push(new Join(joinType.leftJoin, <string>args[0], <(join: JoinClause) => void>args[1]))
    } else if (args.length == 3) {
      this._opts.join.push(new Join(joinType.leftJoin, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this._opts.join.push(new Join(joinType.leftJoin, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public rightJoin(table: string, callback: (join: JoinClause) => void): this
  public rightJoin(table: string, columnA: string, columnB: string): this
  public rightJoin(table: string, columnA: string, operator: string, columnB: string): this
  public rightJoin(...args: (string | Function)[]) {
    if (args.length == 2) {
      this._opts.join.push(new Join(joinType.rightJoin, <string>args[0], <(join: JoinClause) => void>args[1]))
    } else if (args.length == 3) {
      this._opts.join.push(new Join(joinType.rightJoin, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this._opts.join.push(new Join(joinType.rightJoin, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public table(table: string) {
    this._table = table
    return this
  }

  public select(...args: (string | Raw)[]): this {
    this._opts.select = []
    args.forEach(arg => {
      this._opts.select.push(arg instanceof Raw ? arg : new Select(arg))
    })
    return this
  }

  public addSelect(...args: (string | Raw)[]): this {
    args.forEach(arg => {
      this._opts.select.push(arg instanceof Raw ? arg : new Select(arg))
    })
    return this
  }

  public setValue(value: Raw): this
  public setValue(column: string, value: string | Raw): this
  public setValue(...args: any[]): this {
    if (args.length == 1 && args[0] instanceof Raw) {
      this._opts.set.push(args[0])
    } else if (args.length == 2) {
      this._opts.set.push(new Set(args[0], args[1]))
    }
    return this
  }

  public limit(limit: number, offset?: number): this {
    this._limit = limit
    if (offset) {
      this._offset = offset
    }
    return this
  }

  public offset(offset: number) {
    this._offset = offset
    return this
  }

  // protected reset() {
  //   // this._placeholders = []
  //   for (let key in this.opt) {
  //     this.opt[key] = []
  //   }
  //   this._limit = -1
  //   this._distinct = false
  // }
}