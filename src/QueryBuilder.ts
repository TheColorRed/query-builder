import { DB, Connection } from './DB';
import { Opts, queryType } from './BuilderBase';
import { Raw, Where, On, Between, Order, Join, Set } from './QueryConstructs';

export interface QueryBuilder {
  [key: string]: any
}

export class QueryBuilder {

  protected _table: string = ''
  protected _limit: number = -1
  protected _offset: number = 0
  protected opts: Opts
  protected _queryType: queryType
  protected _distinct: boolean = false
  protected placeholders: any[] = []

  private q: string[] = []

  public static async query<T>(conn: Connection | undefined, query: string, values: any[]) {
    return new Promise<Promise<T>>((resolve, reject) => {
      if (!conn) conn = DB.getDefaultConnection()
      if (!conn) return reject({ message: 'Could not get connection' })
      if (conn.config.dumpQueries) console.log({
        query, values,
        connection: conn.name
      })
      conn.conn.query(query, values, (err, results) => {
        if (err) return reject({ sql: err.sql, message: err.message })
        return resolve(results)
      })
    })
  }

  public async query<T>(conn: Connection | undefined/* , query: string, values: any[] */): Promise<T> {
    return new Promise<Promise<T>>((resolve, reject) => {
      if (!conn) conn = DB.getDefaultConnection()
      if (!conn) return reject({ message: 'Could not get connection' })
      let query = this.toString()
      let values = this.placeholders
      if (conn.config.dumpQueries) console.log({
        query, values,
        connection: conn.name
      })
      conn.conn.query(query, values, (err, results) => {
        if (err) return reject({ sql: err.sql, message: err.message })
        return resolve(results)
      })
    })
  }

  public constructor(type: queryType, table: string, opts: Opts, limit: number, offset: number, distinct: boolean) {
    this._queryType = type
    this._table = table
    this.opts = opts
    this._limit = limit
    this._offset = offset
    this._distinct = distinct
  }

  private getOption(key: string): string {
    if (this[`_${key}`]) {
      return this[`_${key}`]
    } else {
      return ''
    }
  }

  public toString(): string {
    this.placeholders = []
    let table = this.getOption('table')
    // Create the select
    switch (this._queryType) {
      case queryType.insert:
        this.q.push(`insert into ${table}`)
        break
      case queryType.update:
        this.q.push(`update ${table}`)
        break
      case queryType.delete:
        this.q.push(`delete from ${table}`)
        break
      default:
        this.q.push('select')
        // Make distinct
        this._distinct && this.q.push('distinct')
        // Create the from
        let sel: any[] = []
        this.opts.select.length == 0 ? this.q.push('*') : this.opts.select.forEach(select => sel.push(select.raw))
        this.q.push(sel.join(', '))
        this.q.push('from', table)
        break
    }

    // Create the joins
    this.q = this.q.concat(this.join(this.opts.join))

    // Create the sets
    this.q = this.q.concat(this.set(this.opts.set))

    // Create the where
    this.opts.where.length > 0 || this.opts.between.length > 0 ? this.q.push('where') : null
    this.q = this.q.concat(this.where(this.opts.where))
    this.q = this.q.concat(this.between(this.opts.between))

    // Create the group by
    this.q = this.q.concat(this.groupBy(this.opts.group))

    // Create the having
    this.opts.havingWhere.length > 0 || this.opts.havingBetween.length > 0 ? this.q.push('having') : null
    let having = (<string[]>[]).concat(this.where(this.opts.havingWhere))
    having = having.concat(this.between(this.opts.havingBetween))
    this.q.push(having.join(' and '))

    // Create the order by
    this.q = this.q.concat(this.orderBy(this.opts.order))

    // Create the limit
    this.q = this.q.concat(this.limit(this._limit, this._offset))

    // Finalize the string
    return this.q.join(' ').trim()
  }

  private join(join: (Join | Raw)[]) {
    let q: string[] = []
    join.forEach(j => {
      if (j instanceof Raw) {
        q.push(j.raw)
      } else {
        q.push(`${j.joinType} ${j.table} on`)
        let joins: string[] = []
        j.columns.forEach(c => {
          if (c instanceof On) {
            joins.push(`${joins.length > 0 ? c.condition : ''} ${c.columnA} ${c.operator} ${c.columnB}`.trim())
          } else if (c instanceof Where) {
            if (Array.isArray(c.value)) {
              joins = joins.concat(this.where([c]))
            } else {
              joins.push(`${joins.length > 0 ? c.condition : ''} ${c.column} ${c.operator} ${c.value}`.trim())
              // this.placeholders.push(c.value)
            }
          }
        })
        q.push(joins.join(' and '))
      }
    })
    return q
  }

  private set(set: (Set | Raw)[]) {
    let q: string[] = []
    if ([queryType.insert, queryType.update].indexOf(this._queryType) > -1) {
      set.length > 0 ? this.q.push('set') : null
      let sets: string[] = []
      set.forEach(set => {
        if (set instanceof Raw) {
          this.q.push(set.raw)
        } else if (set.value instanceof Raw) {
          this.q.push(`${set.column} = ${set.value.raw}`)
        } else {
          sets.push(`${set.column} = ?`)
          this.placeholders.push(set.value)
        }
      })
      if (sets.length > 0) {
        q = q.concat(sets.join(', ').trim())
      }
    }
    return q
  }

  private where(where: (Where | Raw)[]) {
    let q: string[] = []
    let wheres: string[] = []
    where.forEach(where => {
      if (where instanceof Raw) {
        q.push(where.raw)
      } else {
        if (where.value === null) {
          wheres.push(`${where.column} ${where.operator}`)
        } else if (Array.isArray(where.value)) {
          let ins: string[] = []
          where.value.forEach(val => {
            ins.push('?')
            this.placeholders.push(val)
          })
          wheres.push(`${wheres.length > 0 ? where.condition : ''} ${where.column} in(${ins.join(',')})`)
        } else {
          wheres.push(`${wheres.length > 0 ? where.condition : ''} ${where.column} ${where.operator} ?`)
          this.placeholders.push(where.value)
        }
      }
    })
    if (wheres.length > 0) {
      q = q.concat(wheres.join(' ').trim())
    }
    return q
  }

  private between(between: (Between | Raw)[]) {
    let q: string[] = []
    let wheres: string[] = []
    between.forEach(between => {
      if (between instanceof Between) {
        wheres.push(`${wheres.length > 0 ? between.condition : ''} ${between.column} ${between.not ? 'not' : ''} between ? and ?`)
        this.placeholders.push(between.value1, between.value2)
      } else {
        wheres.push(between.raw)
      }
    })
    if (wheres.length > 0) {
      q = q.concat(wheres.join(' ').trim())
    }
    return q
  }


  private groupBy(group: (Order | Raw)[]) {
    let q: string[] = []
    if (group.length > 0) {
      q.push(
        'group by',
        group.reduce<string[]>((arr, val) => arr.concat(`${val instanceof Raw ? val.raw : `${val.column} ${val.direction}`}`), []).join(', ')
      )
    }
    return q
  }

  private orderBy(order: (Order | Raw)[]) {
    let q: string[] = []
    if (order.length > 0) {
      q.push(
        'order by',
        order.reduce<string[]>((arr, val) => arr.concat(`${val instanceof Raw ? val.raw : `${val.column}   ${val.direction}`}`), []).join(', ')
      )
    }
    return q
  }

  private limit(limit: number, offset: number) {
    let q: string[] = []
    this._limit > 0 && q.push(`limit ${offset > 0 ? `${offset},` : ''} ${limit}`)
    return q
  }

}