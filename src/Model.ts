import DB from "./DB";
import Builder from "./Builder";

export interface ModelCreator<T> extends Model {
  new(): T
}

export interface ModelOptions {
  table: string
  connection?: string | undefined
  primaryKey?: string
  hidden: string[]
}

export interface ModelItems {
  [key: string]: any
}

export class Model extends Builder {

  protected options: ModelOptions
  public items: ModelItems = {}

  public constructor(options: ModelOptions) {
    super(options)
    this.options = options
  }

  public get builder() {
    let conn = DB.connection(this.options.connection)
    if (conn) {
      return conn.table(this.options.table)
    }
    return null
  }

  public set(key: string, value: any) {
    this.items[key] = value
  }

  public static async firstOrNew<T extends ModelCreator<T>>(type: ModelCreator<T>, options: ModelItems): Promise<T> {
    let builder = this.builder
    let t = new type()
    for (let key in options) {
      t.where(key, options[key])
    }
    let result = await t.first() as any
    if (result) {
      for (let key in result) {
        t.set(key, result[key])
      }
    }
    return t as T
  }

}