import DB from "./DB";
import Builder from "./Builder";

export interface ModelOptions {
  table: string
  connection?: string | undefined
}

module.exports = class Model extends Builder {

  protected options: ModelOptions

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

}