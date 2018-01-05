import { raw } from './QueryConstructs';
import { ModelBase, ModelItems, ModelOptions } from './ModelBase';
import { Row } from './Row';

// export interface ModelType<T> extends Model<T> {
//   new(): T
// }

export interface Model<I extends ModelItems> {
  [key: string]: any
}

export interface ModelCreator<T extends Model<T>> {
  new(): T
}

export class Model<I extends ModelItems> extends ModelBase<I> implements IterableIterator<I> {

  protected pointer = 0

  public constructor(options?: ModelOptions) {
    super(options)
    this._customModel = true
    if (options && options.primaryKey && typeof options.primaryKey == 'string') { options.primaryKey = [options.primaryKey] }
    this._settings = Object.assign(<ModelOptions>{
      table: '',
      connection: '',
      hidden: [],
      primaryKey: [],
      fillable: []
    }, options)
    this._table = this._settings.table

    return new Proxy(this, {
      get: (target, prop) => {
        // let attr = prop.toString().replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
        // attr = attr.charAt(0).toUpperCase() + attr.slice(1)
        if (!Array.isArray(target._items) && target._items instanceof Row) {
          if (prop in target._items.row) {
            return target._items.row[prop.toString()]
          }
        }
        if (Array.isArray(target._items) && target._items[0] instanceof Row) {
          if (prop in target._items[0].row) {
            return target._items[0].row[prop.toString()]
          }
        }
        return target[prop]
      }
    })
  }

  public next(): IteratorResult<I> {
    if (Array.isArray(this._items)) {
      if (this.pointer < this._items.length) {
        return { done: false, value: this._items[this.pointer++] }
      } else {
        this.pointer = 0
        return { done: true, value: undefined } as any as IteratorResult<I>
      }
    } else {
      return { done: true, value: this._items && this._items[0] } as any as IteratorResult<I>
    }
  }

  public [Symbol.iterator](): IterableIterator<I> {
    return this
  }

  public hasOne<T extends Model<I>, I extends ModelItems>(model: ModelCreator<any>, foreignKey?: string, localKey?: string) {
    let m = new model() as T
    if (m.settings.table) {
      localKey = localKey ? localKey : 'id'
      foreignKey = foreignKey ? foreignKey : this.constructor.name + '_id'
      this.join(m.settings.table, this.settings.table + '.' + localKey, m.settings.table + '.' + foreignKey)
      this.limit(1)
    }
    return this
  }

  public hasMany<T extends Model<I>, I extends ModelItems>(model: ModelCreator<any>, foreignKey?: string, localKey?: string) {
    let m = new model() as T
    if (m.settings.table) {
      localKey = localKey ? localKey : 'id'
      foreignKey = foreignKey ? foreignKey : this.constructor.name + '_id'
      this.join(m.settings.table, this.settings.table + '.' + localKey, m.settings.table + '.' + foreignKey)
      this.limit(-1)
    }
    return this
  }

  public async get() {
    let i = await super.get<I>()
    if (Array.isArray(i)) {
      this._items = i
    }
    return this
  }

  public async first() {
    let i = await super.first<I>()
    if (i instanceof Row) {
      this._items = i
    }
    return this
  }

  public async firstOrFail() {
    let i = await super.firstOrFail<I>()
    if (Array.isArray(i)) {
      this._items = i[0]
    } else if (i instanceof Row) {
      this._items = i
    }
    return this
  }

  public forEach(callback: (row: Row<I>, index: number) => void) {
    if (Array.isArray(this._items)) {
      for (let [index, row] of this._items.entries()) {
        callback(row, index)
      }
    }
  }

  // public static async all<T extends Model<I>, I extends ModelItems>() {
  //   return await this.create<T, I>().get()
  // }

  public set(items: I): this
  public set(key: string, value: any): this
  public set(...args: any[]): this {
    if (!this._items) {
      this._items = new Row<I>()
    }
    if (Array.isArray(this._items)) {
      this._items.forEach((item) => {
        if (args.length == 1 && args[0] instanceof Object) {
          for (let key in args[0]) {
            let current = item.row[key]
            item.row[key] = args[0][key]
            if (current != item.row[key]) { item.dirty() }
          }
        } else if (args.length == 2) {
          let current = item.row[args[0]]
          item.row[args[0]] = args[1]
          if (current != item.row[args[0]]) { item.dirty() }
        }
        // this._items && this._items.set(idx, item)
      })
    } else if (this._items instanceof Row) {
      if (args.length == 1 && args[0] instanceof Object) {
        for (let key in args[0]) {
          let current = this._items.row[key]
          this._items.row[key] = args[0][key]
          if (current != this._items.row[key]) { this._items.dirty() }
        }
      } else if (args.length == 2) {
        let current = this._items.row[args[0]]
        this._items.row[args[0]] = args[1]
        if (current != this._items.row[args[0]]) { this._items.dirty() }
      }
    }
    return this
  }

  public async save() {
    let saves: Promise<any>[] = []
    if (Array.isArray(this._items)) {
      this._items.forEach(async item => this.saveItem<I>(item, saves))
    } else if (this._items instanceof Row) {
      this.saveItem<I>(this._items, saves)
    }
    await Promise.all(saves)
    return this
  }

  private saveItem<T extends ModelItems>(item: Row<T>, saves: Promise<any>[]) {
    if (!this._settings) return false
    let settings = this._settings
    if (!item.isDirty && (typeof this._conn.config.saveNonDirtyRows == 'undefined' || !this._conn.config.saveNonDirtyRows)) {
      return false
    }
    if (item.isNewRow) {
      // Saves a new item
      let builder = ModelBase.create().table(settings.table)
      for (let key in item.row) {
        if (settings.fillable && settings.fillable.indexOf(key) > -1) {
          builder.setValue(key, item.row[key])
        }
      }
      let i = builder.insert()
      i.then(() => { item['_dirty'] = false; item['_newRow'] = false })
      saves.push(i)
    } else {
      // Updates the current item
      if (Array.isArray(settings.primaryKey) && settings.primaryKey.length > 0) {
        let builder = ModelBase.create().table(settings.table)
        for (let key in item.row) {
          if (settings.fillable && settings.fillable.indexOf(key) > -1) {
            builder.setValue(key, item.row[key])
          }
        }
        for (let key of settings.primaryKey) { builder.where(key, item.row[key]) }
        let u = builder.update()
        u.then(() => { item['_dirty'] = false })
        saves.push(u)
      }
    }
  }

  public async delete() {
    if (this._items) {
      for (let key in this._items) {
        this.where(key, (<any>this._items)[key])
      }
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

  public static async find<T extends Model<I>, I extends ModelItems>(value: Object): Promise<T>
  public static async find<T extends Model<I>, I extends ModelItems>(value: any): Promise<T>
  public static async find<T extends Model<I>, I extends ModelItems>(...args: any[]): Promise<T> {
    let t = this.create<T, I>()
    if (!t._settings) return t
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
        return await t.first()
      } catch (e) {
        return t
      }
    } else {
      throw new Error(`No primary key(s) set on the model "${this.name}".`)
    }
  }

  public static async findOrFail<T extends Model<I>, I extends ModelItems>(value: Object): Promise<T>
  public static async findOrFail<T extends Model<I>, I extends ModelItems>(value: any): Promise<T>
  public static async findOrFail<T extends Model<I>, I extends ModelItems>(arg: any): Promise<T> {
    let find = await this.find<T, I>(arg)
    if (find.length == 0) {
      throw new Error('Record was not found')
    }
    return find
  }

  public static async firstOrNew<T extends Model<I>, I extends ModelItems>(options: I, newOptions?: I) {
    let t = this.create<T, I>()
    for (let key in options) { t.where(key, options[key]) }
    await t.first()
    if (t.length == 0) {
      t = this.create<T, I>(Object.assign(options, newOptions))
    }

    return t
  }

  public static async firstOrCreate<T extends Model<I>, I extends ModelItems>(options: I, newOptions?: I) {
    let t = this.create<T, I>()
    for (let key in options) { t.where(key, options[key]) }
    await t.first()

    if (t.length == 0) {
      t = this.create<T, I>(Object.assign(options, newOptions))
      await t.save()
    }

    return t
  }

  // public static toString<T extends Model<I>, I extends ModelItems>(): string {
  //   return this.create<T, I>().toString()
  // }

}