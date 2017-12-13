import { joinType, direction, condition } from "./BuilderBase";

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

export class Join {
  public joinType: joinType = joinType.join
  public table: string = ''
  public column: Where

  public constructor(type: joinType, table: string, columnA: string, operator: string, columnB: string) {
    this.table = table
    this.joinType = type
    this.column = new Where(columnA, columnB, operator)
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

  public constructor(column: string, value1: string | number | any[] | null | Raw, value2: string | number | any[] | null | Raw, cond: condition = condition.and) {
    this.column = column
    this.value1 = value1
    this.value2 = value2
    this.condition = cond
  }
}


export class Set extends Where {
  public constructor(column: string, value: string | number | null | Raw) {
    super(column, value)
  }
}

export class Order {
  public column: string = ''
  public direction: direction = direction.asc

  public constructor(column: string, dir: direction = direction.asc) {
    this.column = column
    this.direction = dir
  }
}