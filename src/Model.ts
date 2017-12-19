import { raw } from "./QueryConstructs";
import { ModelBase, ModelItems, ModelSettings } from "./ModelBase";
import { Row } from "./Row";
import DataSet from "./DataSet";

export interface ModelType<T> extends Model<T> {
  new(): T
}

export class Model<I extends ModelItems> extends ModelBase<I> {

  public constructor(options?: ModelSettings) {
    super(options)
    this._customModel = true
    if (options && options.primaryKey && typeof options.primaryKey == 'string') { options.primaryKey = [options.primaryKey] }
    this._settings = Object.assign(<ModelSettings>{
      table: '',
      connection: '',
      hidden: [],
      primaryKey: [],
      fillable: []
    }, options)
    this._table = this._settings.table
  }

  public async get() {
    this._items = await super.get()
    return this._items
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
    let builder = ModelBase.create().table(this._settings.table)
    // Creates an update
    if (!this._new) {
      if (Array.isArray(this._settings.primaryKey) && this._settings.primaryKey.length > 0) {
        for (let key in this._items) {
          if (this._settings.fillable && this._settings.fillable.indexOf(key) > -1) {
            builder.setValue(key, this._items[key])
          }
        }
        for (let key of this._settings.primaryKey) { builder.where(key, this._items[key]) }
      } else {
        // No primary keys set, we cannot do an update
        console.error(`No primary key(s) set on model "${this.constructor.name}", an update cannot be performed`)
        return false
      }
      let update = await builder.update()
      if (update) {
        builder._dirty = false
        builder._new = false
      }
      return update
    }
    // Creates an insert
    else {
      for (let key in this._items) {
        if (this._settings.fillable && this._settings.fillable.indexOf(key) > -1) {
          builder.setValue(key, this._items[key])
        }
      }
      let insert = await builder.insert()
      if (insert) {
        builder._dirty = false
        builder._new = false
      }
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

  public static async find<T extends ModelItems>(value: Object): Promise<Row<T>>
  public static async find<T extends ModelItems>(value: any): Promise<Row<T>>
  public static async find<T extends ModelItems>(...args: any[]): Promise<Row<T>> {
    let t = this.create()
    if (t._settings.primaryKey && t._settings.primaryKey.length > 0) {
      let primaryKeys = t._settings.primaryKey
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
        return await t.first<T>()
      } catch (e) {
        return new Row
      }
    } else {
      throw new Error(`No primary key(s) set on the model "${this.name}".`)
    }
  }

  public static async findOrFail<T extends Model<any>, I extends ModelItems>(value: Object): Promise<T & I>
  public static async findOrFail<T extends Model<any>, I extends ModelItems>(value: any): Promise<T & I>
  public static async findOrFail<T extends Model<any>, I extends ModelItems>(arg: any): Promise<T & I> {
    let find = await this.find(arg) as T & I
    if (find.itemCount == 0) {
      throw new Error('Record was not found')
    }
    return find
  }

  public static async firstOrNew<T extends Model<any>, I extends ModelItems>(options: I, newOptions: I) {
    let t = this.create() as T & I
    for (let key in options) { t.where(key, options[key]) }
    let result = await t.first<I>()
    if (Object.keys(result).length > 0) {
      t = this.createFromExisting(result)
    } else {
      t = this.create(Object.assign(options, newOptions))
    }
    return t
  }

  public static async firstOrCreate<T extends Model<any>, I extends ModelItems>(options: I, newOptions?: I) {
    let t = this.create() as T & I
    for (let key in options) { t.where(key, options[key]) }
    let result = await t.first<I>()
    if (Object.keys(result).length > 0) {
      t = this.createFromExisting(result)
    } else {
      t = this.create(Object.assign(options, newOptions))
      await t.save()
      // t._dirty = false
    }
    return t
  }

  public static async all<I extends ModelItems>() {
    return await this.create().get<I>()
  }

  public static toString() {
    let t = this.create()
    return t.toString()
  }

}