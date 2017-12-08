import { DB } from "./DB";
import { Builder } from "./Builder";

export interface ModelCreator<T> extends Model {
  new(): T
}

export interface ModelSettings {
  table: string
  connection?: string | undefined
  primaryKey?: string | string[]
  hidden?: string[]
  fillable?: string[]
}

export interface ModelItems {
  [key: string]: any
}

export class Model extends Builder {

  public items: ModelItems = {}

  protected settings: ModelSettings
  protected _dirty: boolean = false
  protected _new: boolean = false
  protected _customModel: boolean = false

  public get builder() {
    let conn = DB.connection(this.settings.connection)
    if (!conn) throw new Error('Could not get a connection')
    return conn.table(this.settings.table)
  }

  public get isNew(): boolean { return this._new }

  public constructor(options: ModelSettings) {
    super(options)
    this._customModel = true
    if (options.primaryKey && typeof options.primaryKey == 'string') { options.primaryKey = [options.primaryKey] }
    this.settings = Object.assign(<ModelSettings>{
      table: '',
      connection: '',
      hidden: [],
      primaryKey: [],
      fillable: []
    }, options)
  }

  public isDirty(): boolean { return this._dirty }

  public set(key: string, value: any) {
    let current = this.items[key]
    this.items[key] = value
    if (current != this.items[key]) { this._dirty = true }
  }

  public async save() {
    if (!this.isDirty()) return false
    let builder = this.builder
    if (builder) {
      // Creates an update
      if (!this._new) {
        if (Array.isArray(this.settings.primaryKey) && this.settings.primaryKey.length > 0) {
          for (let key in this.items) {
            if (this.settings.fillable && this.settings.fillable.indexOf(key) > -1) {
              builder.set(key, this.items[key])
            }
          }
          for (let key of this.settings.primaryKey) { builder.where(key, this.items[key]) }
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
        for (let key in this.items) {
          if (this.settings.fillable && this.settings.fillable.indexOf(key) > -1) {
            builder.set(key, this.items[key])
          }
        }
        let insert = await builder.insert()
        if (insert) this._dirty = false
        return insert
      }
    }
    return false
  }

  public static create<T extends ModelCreator<T>>(type: ModelCreator<T>, options: ModelItems) {
    let t = new type()
    t['_new'] = true
    for (let key in options) { t.set(key, options[key]) }
    t['_dirty'] = false
    return t as T
  }

  public static async firstOrNew<T extends ModelCreator<T>>(type: ModelCreator<T>, options: ModelItems): Promise<T> {
    let t = new type()
    t['_new'] = true
    for (let key in options) { t.where(key, options[key]) }
    let result = await t.first() as any
    if (result) {
      t['_new'] = false
      for (let key in result) {
        t.set(key, result[key])
      }
      t['_dirty'] = false
    }
    return t as T
  }

}