import { DB } from "./DB";
import { Builder } from "./Builder";
import { raw } from "./QueryConstructs";

export interface ModelType<T> extends Model<T> {
  new(): T
}

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

export class Model<I extends ModelItems> extends Builder {

  protected _items: I = <I>{}

  protected settings: ModelSettings
  protected _dirty: boolean = false
  protected _new: boolean = false
  protected _customModel: boolean = false

  public get builder() {
    let conn = DB.connection(this.settings.connection)
    if (!conn) throw new Error('Could not get a connection')
    return conn.table(this.settings.table)
  }

  public get new(): boolean { return this._new }
  public get itemCount(): number { return Object.keys(this._items).length }

  public constructor(options?: ModelSettings) {
    super(options)
    this._customModel = true
    if (options && options.primaryKey && typeof options.primaryKey == 'string') { options.primaryKey = [options.primaryKey] }
    this.settings = Object.assign(<ModelSettings>{
      table: '',
      connection: '',
      hidden: [],
      primaryKey: [],
      fillable: []
    }, options)
    this._table = this.settings.table
  }

  public isDirty(): boolean { return this._dirty }

  public set(items: I): this
  public set(key: string, value: any): this
  public set(...args: any[]): this {
    if (args.length == 1 && args[0] instanceof Object) {
      for (let key in args[0]) {
        let current = this._items[key]
        this._items[key] = args[0][key]
        if (current != this._items[key]) { this._dirty = true }
      }
    } else if (args.length == 2) {
      let current = this._items[args[0]]
      this._items[args[0]] = args[1]
      if (current != this._items[args[0]]) { this._dirty = true }
    }
    return this
  }

  public async save() {
    if (!this.isDirty()) return false
    let builder = this.builder
    // Creates an update
    if (!this._new) {
      if (Array.isArray(this.settings.primaryKey) && this.settings.primaryKey.length > 0) {
        for (let key in this._items) {
          if (this.settings.fillable && this.settings.fillable.indexOf(key) > -1) {
            builder.setValue(key, this._items[key])
          }
        }
        for (let key of this.settings.primaryKey) { builder.where(key, this._items[key]) }
      } else {
        // No primary keys set, we cannot do an update
        console.error(`No primary key(s) set on model "${this.constructor.name}", an update cannot be performed`)
        return false
      }
      let update = await builder.update()
      if (update) this._dirty = false
      return update
    }
    // Creates an insert
    else {
      for (let key in this._items) {
        if (this.settings.fillable && this.settings.fillable.indexOf(key) > -1) {
          builder.setValue(key, this._items[key])
        }
      }
      let insert = await builder.insert()
      if (insert) this._dirty = false
      return insert
    }
  }

  public async delete() {
    for (let key in this._items) {
      this.where(key, this._items[key])
    }
    return await super.delete()
  }

  public async increment(columns: { [key: string]: number }): Promise<any>
  public async increment(column: string, amount?: number): Promise<any>
  public async increment(...args: any[]): Promise<any> {
    if (args.length == 1 && args[0] instanceof Object) {
      for (let key in args[0]) {
        super.setValue(key, raw(`${key} + ${parseFloat(args[0][key])}`))
      }
    } else if (args.length == 2) {
      super.setValue(args[0], raw(`${args[0]} + ${parseFloat(args[1])}`))
    }
    await this.update()
    return this
  }

  public static create<T extends Model<any>, I extends ModelItems>(options?: I) {
    let t = new this()
    t['_new'] = true
    if (options) for (let key in options) { t.set(key, options[key]) }
    t['_dirty'] = true
    return t as T
  }

  public static async find<T extends Model<any>>(value: Object): Promise<T>
  public static async find<T extends Model<any>>(value: any): Promise<T>
  public static async find<T extends Model<any>>(...args: any[]): Promise<T> {
    let t = this.create()
    if (t.settings.primaryKey && t.settings.primaryKey.length > 0) {
      let primaryKeys = t.settings.primaryKey
      if (args.length == 1 && args[0] instanceof Object) {
        if (Object.keys(args[0]).length != primaryKeys.length) {
          throw new Error(`Invalid keys passed in. "${this.name}" Requires: "[${primaryKeys.toString()}]".`)
        }
        for (let key in args[0]) {
          if (primaryKeys.indexOf(key) > -1) {
            t.where(key, args[0][key])
          } else {
            throw new Error(`The key "${key}" does not exist on the model "${this.name}". Required keys are: "[${primaryKeys.toString()}]".`)
          }
        }
      } else if (args.length == 1) {
        if (primaryKeys.length == 1) {
          t.where(primaryKeys[0], args[0])
        } else {
          throw new Error(`The model "${this.name}" has more than one primary key, use an object instead.`)
        }
      }
      try {
        return this.create(await t.first()) as T
      } catch (e) {
        return t as T
      }
    } else {
      throw new Error(`No primary key(s) set on the model "${this.name}".`)
    }
  }

  public static async findOrFail<T extends Model<any>>(value: Object): Promise<T>
  public static async findOrFail<T extends Model<any>>(value: any): Promise<T>
  public static async findOrFail<T extends Model<any>>(arg: any): Promise<T> {
    let find = await this.find(arg) as T
    if (find.itemCount == 0) {
      throw new Error('Record was not found')
    }
    find['_new'] = false
    return find as T
  }

  public static async firstOrNew<T extends Model<any>, I extends ModelItems>(options: I) {
    let t = this.create(options)
    t['_new'] = true
    for (let key in options) { t.where(key, options[key]) }
    let result = await t.first<I>()
    if (result) {
      t['_new'] = false
      for (let key in result) t.set(key, result[key])
      t['_dirty'] = false
    } else {
      for (let key in options) { t.set(key, options[key]) }
    }
    return t as T
  }

}