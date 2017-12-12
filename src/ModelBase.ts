import { Builder } from "./Builder";
import { Model } from "./Model";
import { direction } from "./BuilderBase";
import { Raw } from "./QueryConstructs";

export interface ModelSettings {
  table: string
  connection?: string | undefined
  primaryKey?: string[]
  hidden?: string[]
  fillable?: string[]
}

export interface ModelItems {
  [key: string]: any
}

export class ModelBase<I extends ModelItems> extends Builder {

  protected _items: I = <I>{}

  protected settings: ModelSettings
  protected _dirty: boolean = false
  protected _new: boolean = false
  protected _customModel: boolean = false

  public get new(): boolean { return this._new }
  public get itemCount(): number { return Object.keys(this._items).length }

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

  public static whereNull<T extends Model<any>>(column: string) {
    return this.create().whereNull(column) as T
  }

  public static whereNotNull<T extends Model<any>>(column: string) {
    return this.create().whereNotNull(column) as T
  }

  public static between<T extends Model<any>>(column: string, value1: any, value2: any) {
    return this.create().between(column, value1, value2) as T
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

  public static async chunk<T extends Model<any>>(records: number, callback: (rows: T[]) => void) {
    return await this.create().chunk(records, callback)
  }

  public static async first<T extends Model<any>>() {
    return await this.create().first<T>()
  }

  public static async all<T extends Model<any>>() {
    return await this.create().get<T>()
  }
}