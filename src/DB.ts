import * as mysql from 'mysql'
import { packetCallback } from "mysql";
import { Builder } from './Builder';
import { Root } from './Root';

export interface DatabaseConnection {
  default?: boolean
  connection: {
    host: string
    user: string
    password: string
    database: string
  }
}

export type DatabaseConnections<T> = {
  [name: string]: T
}

export interface InsertInfo {
  fieldCount: number
  affectedRows: number
  insertId: number
  serverStatus: number
  warningCount: number
  message: string,
  protocol41: boolean
  changedRows: number
}

export class DB {

  private static _connections: Connection[] = []

  public static get connections(): Connection[] { return this._connections }

  public static getConnection(name: string) {
    return this._connections.find(c => c.name == name)
  }

  public static connect(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true) {
    for (let name in config) {
      let conn = mysql.createConnection(config[name].connection)
      conn.connect((err) => {
        if (err && !throwError) console.error(new Error().stack)
        if (err && throwError) throw err
      })
      this._connections.push(new Connection(name, conn, config[name]))
    }
    return this
  }

  public static disconnect(connection?: string) {
    if (!connection) {
      for (let conn of this._connections) {
        conn.conn.destroy()
      }
    } else {
      let conn = this._connections.find(c => c.name == connection)
      if (conn) conn.conn.destroy()
    }
  }

  public static connection(name?: string) {
    let conn = name ? this._connections.find(c => c.name == name) : this._connections.find(c => c.config.default === true)
    if (!conn) conn = this._connections[0]
    if (conn) {
      return new Builder(conn.conn)
    }
    return null
  }

  public static table(tableName: string) {
    let conn = this._connections.find(c => c.config.default === true)
    if (conn) {
      return new Builder(conn.conn).table(tableName)
    }
    return null
  }

  public static async select<T>(query: string, params?: any[]): Promise<T[] | null>
  public static async select<T>(conn: string, query: string, params: any[]): Promise<T[] | null>
  public static async select<T>(...args: any[]): Promise<T[] | null> {
    let conn: mysql.Connection | null = null, query: string = '', params: any[] = []
    if (args.length == 3) {
      conn = (<Connection>this.getConnection(args[0])).conn
      query = args[1]
      params = args[2]
    } else if (args.length == 2) {
      let c = this._connections.find(c => c.config.default === true)
      conn = c ? c.conn : null
      query = args[0]
      params = args[1]
    } else if (args.length == 1) {
      query = args[0]
    } else {
      throw new Error('Invalid number of aguments for select')
    }
    if (!conn) return null
    return await <Promise<T[] | null>>Root.query(conn, query, params)
  }

  public static async insert(query: string, params?: any[]): Promise<mysql.packetCallback | null>
  public static async insert(conn: string, query: string, params?: any[]): Promise<mysql.packetCallback | null>
  public static async insert(...args: any[]): Promise<mysql.packetCallback | null> {
    let conn: mysql.Connection | null = null, query: string = '', params: any[] = []
    if (args.length == 3) {
      conn = (<Connection>this.getConnection(args[0])).conn
      query = args[1]
      params = args[2]
    } else if (args.length == 2) {
      let c = this._connections.find(c => c.config.default === true)
      conn = c ? c.conn : null
      query = args[0]
      params = args[1]
    } else if (args.length == 1) {
      query = args[0]
    } else {
      throw new Error('Invalid number of aguments for insert')
    }
    if (conn) {
      let insert = await Root.query<mysql.Query>(conn, query, params)
      if (insert) {
        return insert.OkPacket ? insert.OkPacket : insert.ErrorPacket
      }
    }
    return null
  }

  public static async delete(query: string, params?: any[]): Promise<mysql.packetCallback | null>
  public static async delete(conn: string, query: string, params: any[]): Promise<mysql.packetCallback | null>
  public static async delete(...args: any[]): Promise<mysql.packetCallback | null> {
    let conn: mysql.Connection | null = null, query: string = '', params: any[] = []
    if (args.length == 3) {
      conn = (<Connection>this.getConnection(args[0])).conn
      query = args[1]
      params = args[2]
    } else if (args.length == 2) {
      let c = this._connections.find(c => c.config.default === true)
      conn = c ? c.conn : null
      query = args[0]
      params = args[1]
    } else if (args.length == 1) {
      query = args[0]
    } else {
      throw new Error('Invalid number of aguments for delete')
    }
    if (!conn) return null
    let del = await Root.query<mysql.Query>(conn, query, params)
    if (del) {
      return del.OkPacket ? del.OkPacket : del.ErrorPacket
    }
    return null
  }

}

export class Connection {
  public name: string = ''
  public conn: mysql.Connection
  public config: DatabaseConnection

  public constructor(name: string, conn: mysql.Connection, config: DatabaseConnection) {
    this.name = name
    this.conn = conn
    this.config = config
  }
}