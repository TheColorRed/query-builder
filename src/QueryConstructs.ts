import { joinType, sort, condition } from "./BuilderBase";

export function raw(data: string) {
  return new Raw(data)
}

export class Raw {
  public raw: string = ''
  public constructor(data: string) {
    this.raw = data
  }
}

export class Table {
  public name: string = ''
  public alias: string = ''
}

export class Select {
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

export class JoinClause {

  private columns: (Where | On)[] = []

  public on(columnA: string, columnB: string): this
  public on(columnA: string, operator: string, columnB: string): this
  public on(...args: string[]) {
    if (args.length == 2) {
      this.columns.push(new On(args[0], args[1], '='))
    } else {
      this.columns.push(new On(args[0], args[2], args[1]))
    }
    return this
  }

  public orOn(columnA: string, columnB: string): this
  public orOn(columnA: string, operator: string, columnB: string): this
  public orOn(...args: string[]) {
    if (args.length == 2) {
      this.columns.push(new On(args[0], args[1], '=', condition.or))
    } else {
      this.columns.push(new On(args[0], args[2], args[1], condition.or))
    }
    return this
  }

  public where(obj: Object): this
  public where(column: string, value: string | number): this
  public where(column: string, value: any[]): this
  public where(column: string, operator: string, value: string | number): this
  public where(column: string, join: (join: JoinClause) => void): this
  public where(...args: (string | number | Raw | Object)[]): this {
    if (args[0] instanceof Object) {
      let arg: { [key: string]: any } = args[0] as Object
      for (let key in arg) {
        this.columns.push(new Where(key, arg[key]))
      }
    } else if (args.length == 2) {
      this.columns.push(new Where(<string>args[0], <any>args[1]))
    } else if (args.length == 3) {
      this.columns.push(new Where(<string>args[0], <any>args[2], <string>args[1]))
    } else {
      throw new Error('Invalid number of "where" arguments')
    }
    return this
  }

  public whereNull(...columns: string[]) {
    columns.forEach(column => this.columns.push(new Where(column, null, 'is null')))
    return this
  }

  public whereNotNull(...columns: string[]) {
    columns.forEach(column => this.columns.push(new Where(column, null, 'is not null')))
    return this
  }
}

export class Join {
  public joinType: joinType = joinType.join
  public table: string = ''
  public columns: (Where | On)[] = []

  public constructor(type: joinType, table: string, callback: (join: JoinClause) => void)
  public constructor(type: joinType, table: string, columnA: string, operator: string, columnB: string)
  public constructor(...args: any[]) {
    this.joinType = args[0]
    this.table = args[1]
    if (args.length == 5) {
      this.columns.push(new Where(args[2], args[4], args[3]))
    } else if (args.length == 3 && typeof args[2] == 'function') {
      let joinClause = new JoinClause
      args[2](joinClause)
      this.columns = this.columns.concat(joinClause['columns'])
    }
  }

}

export class On {
  public columnA: string = ''
  public operator: string = '='
  public columnB: string = ''
  public condition: condition = condition.and

  public constructor(columnA: string, columnB: string, operator = '=', cond: condition = condition.and) {
    this.columnA = columnA
    this.columnB = columnB
    this.operator = operator
    this.condition = cond
  }
}

export class Where {
  public column: string = ''
  public operator: string = '='
  public value: string | number | any[] | null | Raw = ''
  public condition: condition = condition.and

  public constructor(column: string, value: string | number | any[] | null | Raw, operator = '=', cond: condition = condition.and) {
    this.column = column
    this.value = value
    this.operator = operator
    this.condition = cond
  }
}

export class Between {
  public column: string = ''
  public value1: string | number | any[] | null | Raw = ''
  public value2: string | number | any[] | null | Raw = ''
  public condition: condition = condition.and
  public not: boolean = false

  public constructor(column: string, value1: string | number | any[] | null | Raw, value2: string | number | any[] | null | Raw, cond: condition = condition.and, not: boolean = false) {
    this.column = column
    this.value1 = value1
    this.value2 = value2
    this.condition = cond
    this.not = not
  }
}


export class Set extends Where {
  public constructor(column: string, value: string | number | null | Raw) {
    super(column, value)
  }
}

export class Order {
  public column: string = ''
  public direction: sort = sort.asc

  public constructor(column: string, dir: sort = sort.asc) {
    this.column = column
    this.direction = dir
  }
}