import { Builder } from './Builder';
import { Row } from './Row';
import { Model } from './Model';
import { Raw } from './QueryConstructs';
import { sort } from './BuilderBase';

export interface ModelOptions {
  table: string
  connection?: string
  primaryKey?: string[]
  hidden?: string[]
  fillable?: string[],
  columns?: string[],
  attributes?: string[]
}

export interface ModelItems {
  [key: string]: any
}

export class ModelBase<I extends ModelItems> extends Builder {

  protected _items?: Row<I> | Row<I>[] | { [key: string]: any }

  protected _settings?: ModelOptions
  protected _dirty: boolean = false
  protected _new: boolean = false
  protected _customModel: boolean = false

  public get new(): boolean { return this._new }
  public get length(): number { return Array.isArray(this._items) && this._items.length || this._items ? 1 : 0 }
  public get attributes(): I { return (Array.isArray(this._items) ? this._items[0] : this._items) as I }
  public get settings(): ModelOptions { return this._settings as ModelOptions }

  public isPrimary(column: string): boolean {
    return (this._settings && this._settings.primaryKey || false) && this._settings.primaryKey.indexOf(column) > -1
  }

  public isFillable(column: string): boolean {
    return (this._settings && this._settings.fillable || false) && this._settings.fillable.indexOf(column) > -1
  }

  public hasColumn(column: string): boolean {
    if (this._settings && this._settings.columns && this._settings.columns.indexOf(column) > -1)
      return true
    if (this._settings && this._settings.fillable && this._settings.fillable.indexOf(column) > -1)
      return true
    if (this._settings && this._settings.primaryKey && this._settings.primaryKey.indexOf(column) > -1)
      return true
    return false
  }

  public toArray(...filters: string[]) {
    if (!this._items) return {}
    let result: { [key: string]: any } | { [key: string]: any }[] = {}
    let settings = this._settings && this._settings.hidden ? this._settings.hidden : []
    let hidden = settings.concat(filters)
    if (Array.isArray(this._items)) {
      result = []
      for (let [index, value] of this._items.entries()) {
        let obj: { [key: string]: any } = {}
        for (let key in value.row) {
          if (hidden.indexOf(key) == -1) {
            obj[key] = this._items[index][key]
          }
        }
        this._settings && this._settings.attributes && this._settings.attributes.forEach(attr => {
          let origAttr = attr
          attr = attr.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
          attr = attr.charAt(0).toUpperCase() + attr.slice(1)
          if (typeof (<any>this)[`get${attr}Attribute`] == 'function') {
            obj[origAttr] = (<any>this)[`get${attr}Attribute`]()
          }
        })
        Array.isArray(result) && result.push(obj)
      }
    } else if (this._items instanceof Row) {
      result = {}
      for (let key in this._items.row) {
        if (hidden.indexOf(key) == -1) {
          result[key] = this._items.row[key]
        }
      }
      this._settings && this._settings.attributes && this._settings.attributes.forEach(attr => {
        let origAttr = attr
        attr = attr.replace(/_([a-z])/g, g => { return g[1].toUpperCase(); })
        attr = attr.charAt(0).toUpperCase() + attr.slice(1)
        if (typeof (<any>this)[`get${attr}Attribute`] == 'function') {
          (<any>result)[origAttr] = (<any>this)[`get${attr}Attribute`]()
        }
      })
    }
    return result
  }

  public toJson(...filters: string[]) {
    return JSON.stringify(this.toArray(...filters))
  }

  public static create<T extends Model<I>, I extends ModelItems>(options?: I) {
    let t: T = new this() as T
    if (options) for (let key in options) { t.set(key, options[key]) }
    t['_new'] = true
    t['_dirty'] = true
    return t
  }

  public static createFromExisting<T extends Model<I>, I extends ModelItems>(options?: I) {
    let t = this.create<T, I>(options)
    t['_new'] = false
    t['_dirty'] = false
    return t
  }

  public static distinct<T extends Model<I>, I extends ModelItems>() {
    return this.create<T, I>().distinct()
  }

  public static where<T extends Model<I>, I extends ModelItems>(raw: Raw): T
  public static where<T extends Model<I>, I extends ModelItems>(obj: Object): T
  public static where<T extends Model<I>, I extends ModelItems>(column: string, value: string | number): T
  public static where<T extends Model<I>, I extends ModelItems>(column: string, value: any[]): T
  public static where<T extends Model<I>, I extends ModelItems>(column: string, operator: string, value: string | number): T
  public static where<T extends Model<I>, I extends ModelItems>(...args: any[]): T {
    return this.create<T, I>().where(...args)
  }
  public static orWhere<T extends Model<I>, I extends ModelItems>(raw: Raw): T
  public static orWhere<T extends Model<I>, I extends ModelItems>(obj: Object): T
  public static orWhere<T extends Model<I>, I extends ModelItems>(column: string, value: string | number): T
  public static orWhere<T extends Model<I>, I extends ModelItems>(column: string, value: any[]): T
  public static orWhere<T extends Model<I>, I extends ModelItems>(column: string, operator: string, value: string | number): T
  public static orWhere<T extends Model<I>, I extends ModelItems>(...args: (string | number | Raw | Object)[]): T {
    return this.create<T, I>().orWhere(...args)
  }

  public static whereHaving<T extends Model<I>, I extends ModelItems>(raw: Raw): T
  public static whereHaving<T extends Model<I>, I extends ModelItems>(obj: Object): T
  public static whereHaving<T extends Model<I>, I extends ModelItems>(column: string, value: string | number): T
  public static whereHaving<T extends Model<I>, I extends ModelItems>(column: string, value: any[]): T
  public static whereHaving<T extends Model<I>, I extends ModelItems>(column: string, operator: string, value: string | number): T
  public static whereHaving<T extends Model<I>, I extends ModelItems>(...args: (string | number | Raw | Object)[]): T {
    return this.create<T, I>().whereHaving(...args)
  }

  public static whereNull<T extends Model<I>, I extends ModelItems>(column: string) {
    return this.create<T, I>().whereNull(column) as T
  }

  public static whereNotNull<T extends Model<I>, I extends ModelItems>(column: string) {
    return this.create<T, I>().whereNotNull(column) as T
  }

  public static between<T extends Model<I>, I extends ModelItems>(column: string, value1: any, value2: any) {
    return this.create<T, I>().between(column, value1, value2) as T
  }

  public static betweenHaving<T extends Model<I>, I extends ModelItems>(column: string, value1: any, value2: any) {
    return this.create<T, I>().betweenHaving(column, value1, value2)
  }

  public static orderBy<T extends Model<I>, I extends ModelItems>(dir: sort): Model<any>
  public static orderBy<T extends Model<I>, I extends ModelItems>(column: string, dir: sort): Model<any>
  public static orderBy<T extends Model<I>, I extends ModelItems>(...args: any[]): Model<any> {
    return this.create<T, I>().orderBy(...args) as T
  }

  public static groupBy<T extends Model<I>, I extends ModelItems>(column: string, dir: sort = sort.asc) {
    return this.create<T, I>().groupBy(column, dir) as T
  }

  public static join<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, columnB: string): T
  public static join<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, operator: string, columnB: string): T
  public static join<T extends Model<I>, I extends ModelItems>(...args: string[]) {
    if (args.length == 3) {
      return this.create<T, I>().join(args[0], args[1], '=', args[2]) as T
    } else if (args.length == 4) {
      return this.create<T, I>().join(args[0], args[1], args[2], args[3]) as T
    }
  }

  public static leftJoin<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, columnB: string): T
  public static leftJoin<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, operator: string, columnB: string): T
  public static leftJoin<T extends Model<I>, I extends ModelItems>(...args: string[]) {
    if (args.length == 3) {
      return this.create<T, I>().leftJoin(args[0], args[1], '=', args[2]) as T
    } else if (args.length == 4) {
      return this.create<T, I>().leftJoin(args[0], args[1], args[2], args[3]) as T
    }
  }

  public static rightJoin<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, columnB: string): T
  public static rightJoin<T extends Model<I>, I extends ModelItems>(table: string, columnA: string, operator: string, columnB: string): T
  public static rightJoin<T extends Model<I>, I extends ModelItems>(...args: string[]) {
    if (args.length == 3) {
      return this.create<T, I>().rightJoin(args[0], args[1], '=', args[2]) as T
    } else if (args.length == 4) {
      return this.create<T, I>().rightJoin(args[0], args[1], args[2], args[3]) as T
    }
  }

  public static table<T extends Model<I>, I extends ModelItems>(table: string) {
    return this.create<T, I>().table(table) as T
  }

  public static select<T extends Model<I>, I extends ModelItems>(...args: (string | Raw)[]) {
    return this.create<T, I>().select(...args) as T
  }

  public static addSelect<T extends Model<I>, I extends ModelItems>(...args: (string | Raw)[]) {
    return this.create<T, I>().addSelect(...args) as T
  }

  public static limit<T extends Model<I>, I extends ModelItems>(limit: number, offset: number = 0) {
    return this.create<T, I>().limit(limit, offset)
  }

  public static offset<T extends Model<I>, I extends ModelItems>(offset: number) {
    return this.create<T, I>().offset(offset)
  }

  public static async chunk<T extends Model<I>, I extends ModelItems>(records: number, callback: (rows: T[]) => void) {
    return await this.create<T, I>().chunk(records, callback)
  }

  public static async first<T extends Model<I>, I extends ModelItems>() {
    return await this.create<T, I>().first()
  }

  public static async all<T extends Model<I>, I extends ModelItems>() {
    return await this.create<T, I>().get()
  }
}