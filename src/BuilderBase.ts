import { QueryBuilder } from "./QueryBuilder";
import { Select, Join, Where, Order, Set, Raw, Between } from "./QueryConstructs";
import { Connection } from './DB';

export enum sort { asc = 'asc', desc = 'desc', random = 'rand()' }
export enum joinType { join = 'join', leftJoin = 'left join', rightJoin = 'right join' }
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

export class BuilderBase extends QueryBuilder {

  public queryType: queryType = queryType.select

  protected _conn: Connection
  protected _table: string = ''
  protected _distinct: boolean = false
  protected _placeholders: any[] = []
  protected opt: Opts = {
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
        let sel: any[] = []
        this.opt.select.length == 0 ? q.push('*') : this.opt.select.forEach(select => sel.push(select.raw))
        q.push(sel.join(', '))
        q.push('from', table)
        break
    }
    // Create joins
    this.opt.join.forEach(j => {
      if (j instanceof Raw) {
        q.push(j.raw)
      } else {
        q.push(`${j.joinType} ${j.table} on`)
        let joins: string[] = []
        j.columns.forEach(c => {
          joins.push(`${c.column} ${c.operator} ${c.value}`)
        })
        q.push(joins.join(' and '))
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
      if (sets.length > 0) q = q.concat(sets.join(', ').trim())
    }

    // Create the where
    this.opt.where.length > 0 || this.opt.between.length > 0 ? q.push('where') : null
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
          wheres.push(`${wheres.length > 0 ? where.condition : ''} ${where.column} in(${ins.join(',')})`)
        } else {
          wheres.push(`${wheres.length > 0 ? where.condition : ''} ${where.column} ${where.operator} ?`)
          this._placeholders.push(where.value)
        }
      }
    })
    this.opt.between.forEach(between => {
      if (between instanceof Between) {
        wheres.push(`${wheres.length > 0 ? between.condition : ''} ${between.column} ${between.not ? 'not' : ''} between ? and ?`)
        this._placeholders.push(between.value1, between.value2)
      } else {
        wheres.push(between.raw)
      }
    })
    if (wheres.length > 0) q = q.concat(wheres.join(' ').trim())
    // Create the betweens

    // Create the group by
    this.opt.group.length > 0 && q.push(
      'group by',
      this.opt.group.reduce<string[]>((arr, val) => arr.concat(`${val instanceof Raw ? val.raw : `${val.column}   ${val.direction}`}`), []).join(', ')
    )
    // Creating the having
    // Create the where
    this.opt.havingWhere.length > 0 || this.opt.havingBetween.length > 0 ? q.push('having') : null
    let having: string[] = []
    this.opt.havingWhere.forEach(have => {
      if (have instanceof Raw) {
        q.push(have.raw)
      } else {
        if (have.value === null) {
          having.push(`${have.column} ${have.operator}`)
        } else if (Array.isArray(have.value)) {
          let ins: string[] = []
          have.value.forEach(val => {
            ins.push('?')
            this._placeholders.push(val)
          })
          having.push(`${having.length > 0 ? have.condition : ''} ${have.column} in(${ins.join(',')})`)
        } else {
          having.push(`${having.length > 0 ? have.condition : ''} ${have.column} ${have.operator} ?`)
          this._placeholders.push(have.value)
        }
      }
    })
    this.opt.havingBetween.forEach(between => {
      if (between instanceof Between) {
        having.push(`${having.length > 0 ? between.condition : ''} ${between.column} ${between.not ? 'not' : ''} between ? and ?`)
        this._placeholders.push(between.value1, between.value2)
      } else {
        having.push(between.raw)
      }
    })
    if (having.length > 0) q = q.concat(having.join(' ').trim())
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
  public where(column: string, join: (join: Join) => void): this
  public where(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this.opt.where.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this.opt.where.push(new Where(key, arg[key]))
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

  public whereHaving(raw: Raw): this
  public whereHaving(obj: Object): this
  public whereHaving(column: string, value: string | number): this
  public whereHaving(column: string, value: any[]): this
  public whereHaving(column: string, operator: string, value: string | number): this
  public whereHaving(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Raw) {
      this.opt.havingWhere.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this.opt.havingWhere.push(new Where(key, arg[key]))
      }
    } else if (args.length == 2) {
      this.opt.havingWhere.push(new Where(<string>args[0], <any>args[1]))
    } else if (args.length == 3) {
      this.opt.havingWhere.push(new Where(<string>args[0], <any>args[2], <string>args[1]))
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
      this.opt.where.push(args[0] as Raw)
    } else if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in <any>args[0]) {
        this.opt.where.push(new Where(key, arg[key], '=', condition.or))
      }
    } else if (args.length == 2) {
      this.opt.where.push(new Where(<string>args[0], <any>args[1], '=', condition.or))
    } else if (args.length == 3) {
      this.opt.where.push(new Where(<string>args[0], <any>args[2], <string>args[1], condition.or))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereNull(...columns: string[]) {
    columns.forEach(column => this.opt.where.push(new Where(column, null, 'is null')))

    return this
  }

  public whereNotNull(...columns: string[]) {
    columns.forEach(column => this.opt.where.push(new Where(column, null, 'is not null')))
    return this
  }

  public between(column: string, value1: any, value2: any, cond: condition = condition.and) {
    this.opt.between.push(new Between(column, value1, value2, cond))
    return this
  }

  public notBetween(column: string, value1: any, value2: any, cond: condition = condition.and) {
    this.opt.between.push(new Between(column, value1, value2, cond, true))
    return this
  }

  public betweenHaving(column: string, value1: any, value2: any) {
    this.opt.havingBetween.push(new Between(column, value1, value2))
    return this
  }

  public orderBy(dir: sort): this
  public orderBy(column: string, dir: sort): this
  public orderBy(...args: any[]): this {
    if (args.length == 1) {
      this.opt.order.push(new Order('', args[0]))
    } else {
      this.opt.order.push(new Order(args[0], args[1]))
    }
    return this
  }

  public groupBy(column: string, dir: sort = sort.asc): this {
    this.opt.group.push(new Order(column, dir))
    return this
  }

  public join(table: string, callback: (join: Join) => void): this
  public join(table: string, columnA: string, columnB: string): this
  public join(table: string, columnA: string, operator: string, columnB: string): this
  public join(...args: (string | Function)[]) {
    if (args.length == 2) {
      this.opt.join.push(new Join(joinType.join, <string>args[0], <(join: Join) => void>args[1]))
    } else if (args.length == 3) {
      this.opt.join.push(new Join(joinType.join, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this.opt.join.push(new Join(joinType.join, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public leftJoin(table: string, callback: (join: Join) => void): this
  public leftJoin(table: string, columnA: string, columnB: string): this
  public leftJoin(table: string, columnA: string, operator: string, columnB: string): this
  public leftJoin(...args: (string | Function)[]) {
    if (args.length == 2) {
      this.opt.join.push(new Join(joinType.leftJoin, <string>args[0], <(join: Join) => void>args[1]))
    } else if (args.length == 3) {
      this.opt.join.push(new Join(joinType.leftJoin, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this.opt.join.push(new Join(joinType.leftJoin, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public rightJoin(table: string, callback: (join: Join) => void): this
  public rightJoin(table: string, columnA: string, columnB: string): this
  public rightJoin(table: string, columnA: string, operator: string, columnB: string): this
  public rightJoin(...args: (string | Function)[]) {
    if (args.length == 2) {
      this.opt.join.push(new Join(joinType.rightJoin, <string>args[0], <(join: Join) => void>args[1]))
    } else if (args.length == 3) {
      this.opt.join.push(new Join(joinType.rightJoin, <string>args[0], <string>args[1], '=', <string>args[2]))
    } else if (args.length == 4) {
      this.opt.join.push(new Join(joinType.rightJoin, <string>args[0], <string>args[1], <string>args[2], <string>args[3]))
    }
    return this
  }

  public table(table: string) {
    this._table = table
    return this
  }

  public select(...args: (string | Raw)[]): this {
    this.opt.select = []
    args.forEach(arg => {
      this.opt.select.push(arg instanceof Raw ? arg : new Select(arg))
    })
    return this
  }

  public addSelect(...args: (string | Raw)[]): this {
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