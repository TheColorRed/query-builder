import { Builder } from "./Builder";
import { Model } from "./Model";
import { direction } from "./BuilderBase";
import { Raw } from "./QueryConstructs";
import DataSet from "./DataSet";
import { Row } from "./Row";

export interface ModelSettings {
  table: string
  connection?: string | undefined
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

  protected _items: DataSet<I>

  protected _settings: ModelSettings
  protected _dirty: boolean = false
  protected _new: boolean = false
  protected _customModel: boolean = false

  public get new(): boolean { return this._new }
  public get itemCount(): number { return Object.keys(this._items).length }
  // public get attributes(): I { return this._items }

  public isPrimary(column: string): boolean {
    return (this._settings.primaryKey || false) && this._settings.primaryKey.indexOf(column) > -1
  }

  public isFillable(column: string): boolean {
    return (this._settings.fillable || false) && this._settings.fillable.indexOf(column) > -1
  }

  public hasColumn(column: string): boolean {
    if (this._settings.columns && this._settings.columns.indexOf(column) > -1)
      return true
    if (this._settings.fillable && this._settings.fillable.indexOf(column) > -1)
      return true
    if (this._settings.primaryKey && this._settings.primaryKey.indexOf(column) > -1)
      return true
    return false
  }

  public toObject() {
    let obj: { [key: string]: any } = {}
    for (let key in this._items) {
      if (this._settings.hidden && this._settings.hidden.indexOf(key) == -1) {
        obj[key] = this._items[key]
      }
    }
    this._settings.attributes && this._settings.attributes.forEach(attr => {
      let origAttr = attr
      attr = attr.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
      attr = attr.charAt(0).toUpperCase() + attr.slice(1)
      if (typeof (<any>this)[`get${attr}Attribute`] == 'function') {
        obj[origAttr] = (<any>this)[`get${attr}Attribute`]()
      }
    })
    return obj
  }

  public toJson() {
    return JSON.stringify(this.toObject())
  }

  public static create<T extends Model<any>, I extends ModelItems>(options?: I) {
    let t = new this() as T
    if (options) for (let key in options) { t.set(key, options[key]) }
    t['_new'] = true
    t['_dirty'] = true
    return t as T
  }

  public static createFromExisting<T extends Model<any>, I extends ModelItems>(options?: I) {
    let t = this.create(options)
    t['_new'] = false
    t['_dirty'] = false
    return t as T
  }

  public static distinct() {
    return this.create().distinct()
  }

  public static where<T extends Model<any>>(raw: Raw): T
  public static where<T extends Model<any>>(obj: Object): T
  public static where<T extends Model<any>>(column: string, value: string | number): T
  public static where<T extends Model<any>>(column: string, value: any[]): T
  public static where<T extends Model<any>>(column: string, operator: string, value: string | number): T
  public static where<T extends Model<any>>(...args: any[]): T {
    return this.create().where(...args) as T
  }
  public static orWhere<T extends Model<any>>(raw: Raw): T
  public static orWhere<T extends Model<any>>(obj: Object): T
  public static orWhere<T extends Model<any>>(column: string, value: string | number): T
  public static orWhere<T extends Model<any>>(column: string, value: any[]): T
  public static orWhere<T extends Model<any>>(column: string, operator: string, value: string | number): T
  public static orWhere<T extends Model<any>>(...args: (string | number | Raw | Object)[]): T {
    return this.create().orWhere(...args)
  }

  public static whereHaving<T extends Model<any>>(raw: Raw): T
  public static whereHaving<T extends Model<any>>(obj: Object): T
  public static whereHaving<T extends Model<any>>(column: string, value: string | number): T
  public static whereHaving<T extends Model<any>>(column: string, value: any[]): T
  public static whereHaving<T extends Model<any>>(column: string, operator: string, value: string | number): T
  public static whereHaving<T extends Model<any>>(...args: (string | number | Raw | Object)[]): T {
    return this.create().whereHaving(...args)
  }

  public static whereNull<T extends Model<any>>(column: string) {
    return this.create().whereNull(column) as T
  }

  public static whereNotNull<T extends Model<any>>(column: string) {
    return this.create().whereNotNull(column) as T
  }

  public static between<T extends Model<any>>(column: string, value1: any, value2: any) {
    return this.create().between(column, value1, value2) as T
  }

  public static betweenHaving(column: string, value1: any, value2: any) {
    return this.create().betweenHaving(column, value1, value2)
  }

  public static orderBy<T extends Model<any>>(dir: direction): Model<any>
  public static orderBy<T extends Model<any>>(column: string, dir: direction): Model<any>
  public static orderBy<T extends Model<any>>(...args: any[]): Model<any> {
    return this.create().orderBy(...args) as T
  }

  public static groupBy<T extends Model<any>>(column: string, dir: direction = direction.asc) {
    return this.create().groupBy(column, dir) as T
  }

  public static join<T extends Model<any>>(table: string, columnA: string, operator: string, columnB: string) {
    return this.create().join(table, columnA, operator, columnB) as T
  }

  public static leftJoin<T extends Model<any>>(table: string, columnA: string, operator: string, columnB: string) {
    return this.create().leftJoin(table, columnA, operator, columnB) as T
  }

  public static rightJoin<T extends Model<any>>(table: string, columnA: string, operator: string, columnB: string) {
    return this.create().rightJoin(table, columnA, operator, columnB) as T
  }

  public static table<T extends Model<any>>(table: string) {
    return this.create().table(table) as T
  }

  public static select<T extends Model<any>>(...args: (string | Raw)[]) {
    return this.create().select(...args) as T
  }

  public static addSelect<T extends Model<any>>(...args: (string | Raw)[]) {
    return this.create().addSelect(...args) as T
  }

  public static async chunk<T extends Model<any>>(records: number, callback: (rows: T[]) => void) {
    return await this.create().chunk(records, callback)
  }

  public static async first<T extends ModelItems>(): Promise<DataSet<T>> {
    return await this.create().first<T>()
  }

  public static async all<T extends ModelItems>(): Promise<DataSet<T>> {
    return await this.create().get<T>()
  }
}