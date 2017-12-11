import { Connection } from 'mysql'
import { QueryBuilder } from "./QueryBuilder";
import { Select, Join, Where, Order, Set, Raw } from "./QueryConstructs";

export enum direction { asc = 'asc', desc = 'desc', random = 'rand()' }
export enum joinType { join = 'join', leftJoin = 'left join', rightJoin = 'right join' }
export enum queryType { select, insert, update, delete }

export interface Opts {
  [key: string]: any[]
  select: (Select | Raw)[]
  join: (Join | Raw)[]
  where: (Where | Raw)[]
  set: (Set | Raw)[]
  order: (Order | Raw)[]
  group: (Order | Raw)[]
}

export class BaseBuilder extends QueryBuilder {

  public queryType: queryType = queryType.select

  protected _conn: Connection
  protected _table: string = ''
  protected _distinct: boolean = false
  protected _placeholders: any[] = []
  protected opt: Opts = {
    select: [],
    join: [],
    where: [],
    set: [],
    order: [],
    group: [],
  }

  protected _limit: number = -1
  protected _offset: number = 0

  public toString(): string {
    let q: string[] = []
    let table = this.getOption('table')
    // Create the select
    switch (this.queryType) {
      case queryType.insert:
        q.push(`insert into ${table}`)
        break
      case queryType.update:
        q.push(`update ${table}`)
        break
      case queryType.delete:
        q.push(`delete from ${table}`)
        break
      default:
        q.push('select')
        // Make distinct
        this._distinct && q.push('distinct')
        // Create the from
        this.opt.select.length == 0 ? q.push('*') : this.opt.select.forEach(select => q.push(select.raw))
        q.push('from', table)
        break
    }
    // Create joins
    this.opt.join.forEach(j => {
      if (j instanceof Raw) {
        q.push(j.raw)
      } else {
        q.push(`${j.joinType} ${j.table} on ${j.column.column} ${j.column.operator} ${j.column.value}`)
      }
    })

    // Create the set
    if ([queryType.insert, queryType.update].indexOf(this.queryType) > -1) {
      this.opt.set.length > 0 ? q.push('set') : null
      let sets: string[] = []
      this.opt.set.forEach(set => {
        if (set instanceof Raw) {
          q.push(set.raw)
        } else if (set.value instanceof Raw) {
          q.push(`${set.column} = ${set.value.raw}`)
        } else {
          sets.push(`${set.column} = ?`)
          this._placeholders.push(set.value)
        }
      })
      if (sets.length > 0) q = q.concat(sets.join(', '))
    }

    // Create the where
    this.opt.where.length > 0 ? q.push('where') : null
    let wheres: string[] = []
    this.opt.where.forEach(where => {
      if (where instanceof Raw) {
        q.push(where.raw)
      } else {
        if (where.value === null) {
          wheres.push(`${where.column} ${where.operator}`)
        } else if (Array.isArray(where.value)) {
          let ins: string[] = []
          where.value.forEach(val => {
            ins.push('?')
            this._placeholders.push(val)
          })
          wheres.push(`${where.column} in(${ins.join(',')})`)
        } else {
          wheres.push(`${where.column} ${where.operator} ?`)
          this._placeholders.push(where.value)
        }
      }
    })
    if (wheres.length > 0) q = q.concat(wheres.join(' and '))
    // Create the group by
    this.opt.group.length > 0 && q.push(
      'group by',
      this.opt.group.reduce<string[]>((arr, val) => arr.concat(`${val instanceof Raw ? val.raw : `${val.column}   ${val.direction}`}`), []).join(', ')
    )
    // Create the order by
    this.opt.order.length > 0 && q.push(
      'order by',
      this.opt.order.reduce<string[]>((arr, val) => arr.concat(`${val instanceof Raw ? val.raw : `${val.column}   ${val.direction}`}`), []).join(', ')
    )
    // Create the limit
    this._limit > 0 && q.push(`limit ${this._offset > 0 ? `${this._offset},` : ''} ${this._limit}`)
    return q.join(' ')
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
  public where(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this.opt.where.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      for (let key in <any>args[0]) {
        this.opt.where.push(new Where(key, (<any>args[0])[key]))
      }
    } else if (args.length == 2) {
      this.opt.where.push(new Where(<string>args[0], <any>args[1]))
    } else if (args.length == 3) {
      this.opt.where.push(new Where(<string>args[0], <any>args[2], <string>args[1]))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereNull(column: string) {
    this.opt.where.push(new Where(column, null, 'is null'))
    return this
  }

  public whereNotNull(column: string) {
    this.opt.where.push(new Where(column, null, 'is not null'))
    return this
  }

  public orderBy(dir: direction): this
  public orderBy(column: string, dir: direction): this
  public orderBy(...args: any[]): this {
    if (args.length == 1) {
      this.opt.order.push(new Order('', args[0]))
    } else {
      this.opt.order.push(new Order(args[0], args[1]))
    }
    return this
  }

  public groupBy(column: string, dir: direction = direction.asc): this {
    this.opt.group.push(new Order(column, dir))
    return this
  }

  public join(table: string, columnA: string, operator: string, columnB: string) {
    this.opt.join.push(new Join(joinType.join, table, columnA, operator, columnB))
    return this
  }

  public leftJoin(table: string, columnA: string, operator: string, columnB: string) {
    this.opt.join.push(new Join(joinType.leftJoin, table, columnA, operator, columnB))
    return this
  }

  public rightJoin(table: string, columnA: string, operator: string, columnB: string) {
    this.opt.join.push(new Join(joinType.rightJoin, table, columnA, operator, columnB))
    return this
  }

  public table(table: string) {
    this._table = table
    return this
  }

  public select(...args: (string | Raw)[]): this {
    args.forEach(arg => {
      this.opt.select.push(arg instanceof Raw ? arg : new Select(arg))
    })
    return this
  }

  public setValue(value: Raw): this
  public setValue(column: string, value: string | Raw): this
  public setValue(...args: any[]): this {
    if (args.length == 1 && args[0] instanceof Raw) {
      this.opt.set.push(args[0])
    } else if (args.length == 2) {
      this.opt.set.push(new Set(args[0], args[1]))
    }
    return this
  }

  public limit(limit: number, offset: number = 0): this {
    this._limit = limit
    this._offset = offset
    return this
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

  protected reset() {
    this._placeholders = []
    for (let key in this.opt) {
      this.opt[key] = []
    }
    this._limit = -1
    this._distinct = false
  }
}