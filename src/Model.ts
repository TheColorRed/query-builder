import { raw } from './QueryConstructs';
import { ModelBase, ModelItems, ModelSettings } from './ModelBase';
import { Row } from './Row';

// export interface ModelType<T> extends Model<T> {
//   new(): T
// }

export interface Model<I extends ModelItems> {
  [key: string]: any
}

export class Model<I extends ModelItems> extends ModelBase<I> implements IterableIterator<I> {

  protected pointer = 0

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

    return new Proxy(this, {
      get: (target, prop) => {
        if (!Array.isArray(target._items) && target._items instanceof Row) {
          if (prop in target._items.row) {
            return target._items.row[prop]
          }
        }
        if (Array.isArray(target._items) && target._items[0] instanceof Row) {
          if (prop in target._items[0].row) {
            return target._items[0].row[prop]
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

  [Symbol.iterator](): IterableIterator<I> {
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
    Array.isArray(this._items) && this._items.forEach(callback)
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
    Array.isArray(this._items) && this._items.forEach((item) => {
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
    return this
  }

  public async save() {
    let updates: Promise<any>[] = []
    Array.isArray(this._items) && this._items.forEach(async item => {
      if (!item.isDirty) return false
      if (!this._settings) return false
      if (Array.isArray(this._settings.primaryKey) && this._settings.primaryKey.length > 0) {
        let builder = ModelBase.create().table(this._settings.table)
        for (let key in item.row) {
          if (this._settings.fillable && this._settings.fillable.indexOf(key) > -1) {
            builder.setValue(key, (<any>item.row)[key])
          }
        }
        for (let key of this._settings.primaryKey) { builder.where(key, (<any>item.row)[key]) }
        let u = builder.update()
        updates.push(u)
        u.then(() => { item['_dirty'] = false })
      }
    })
    await Promise.all(updates)
    return this
    // Creates an update
    // if (!this._new) {
    //   if (Array.isArray(this._settings.primaryKey) && this._settings.primaryKey.length > 0) {
    //     for (let key in this._items) {
    //       if (this._settings.fillable && this._settings.fillable.indexOf(key) > -1) {
    //         builder.setValue(key, this._items[key])
    //       }
    //     }
    //     for (let key of this._settings.primaryKey) { builder.where(key, this._items[key]) }
    //   } else {
    //     // No primary keys set, we cannot do an update
    //     console.error(`No primary key(s) set on model "${this.constructor.name}", an update cannot be performed`)
    //     return false
    //   }
    //   let update = await builder.update()
    //   if (update) {
    //     builder._dirty = false
    //     builder._new = false
    //   }
    //   return update
    // }
    // // Creates an insert
    // else {
    //   for (let key in this._items) {
    //     if (this._settings.fillable && this._settings.fillable.indexOf(key) > -1) {
    //       builder.setValue(key, this._items[key])
    //     }
    //   }
    //   let insert = await builder.insert()
    //   if (insert) {
    //     builder._dirty = false
    //     builder._new = false
    //   }
    //   return insert
    // }
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

  public static toString<T extends Model<I>, I extends ModelItems>(): string {
    return this.create<T, I>().toString()
  }

}