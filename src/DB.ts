import * as mysql from 'mysql'
import { packetCallback, Query, Connection as MysqlConnection } from "mysql";
import { Builder } from './Builder';
import { QueryBuilder } from './QueryBuilder';

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
    let conn = this._connections.find(c => c.name == name)
    if (!conn) throw new Error(`The connection "${name}" does not exist`)
    return conn
  }

  public static getDefaultConnection() {
    let conn = this._connections.find(c => c.config.default === true)
    if (!conn && this._connections[0]) conn = this._connections[0]
    if (!conn) throw new Error('There are no connections setup')
    return conn
  }

  public static init(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true) {
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

  public static connect(connection?: string, throwError: boolean = true) {
    if (!connection) {
      for (let conn of this._connections) {
        if (!conn.conn) {
          let c = mysql.createConnection(conn.config.connection)
          c.connect((err) => {
            if (err && !throwError) console.error(new Error().stack)
            if (err && throwError) throw err
          })
        }
      }
    } else {
      let conn = this._connections.find(c => c.name == connection)
      if (conn) {
        let c = mysql.createConnection(conn.config.connection)
        c.connect((err) => {
          if (err && !throwError) console.error(new Error().stack)
          if (err && throwError) throw err
        })
      }
    }
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
    if (!conn) { throw new Error('No connection avalible') }
    return new Builder(conn.conn)
  }

  public static table(tableName: string) {
    return this.connection().table(tableName)
  }

  public static async select<T>(query: string, params?: any[]): Promise<T[] | null>
  public static async select<T>(conn: string, query: string, params: any[]): Promise<T[] | null>
  public static async select<T>(...args: any[]): Promise<T[] | null> {
    let conn: MysqlConnection | null = null, query: string = '', params: any[] = []
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
    return await <Promise<T[] | null>>QueryBuilder.query(conn, query, params)
  }

  public static async insert(query: string, params?: any[]): Promise<packetCallback | null>
  public static async insert(conn: string, query: string, params?: any[]): Promise<packetCallback | null>
  public static async insert(...args: any[]): Promise<packetCallback | null> {
    let conn: MysqlConnection | null = null, query: string = '', params: any[] = []
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
      let insert = await QueryBuilder.query<Query>(conn, query, params)
      if (insert) {
        return insert.OkPacket ? insert.OkPacket : insert.ErrorPacket
      }
    }
    return null
  }

  public static async delete(query: string, params?: any[]): Promise<packetCallback | null>
  public static async delete(conn: string, query: string, params: any[]): Promise<packetCallback | null>
  public static async delete(...args: any[]): Promise<packetCallback | null> {
    let conn: MysqlConnection | null = null, query: string = '', params: any[] = []
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
    let del = await QueryBuilder.query<Query>(conn, query, params)
    if (del) {
      return del.OkPacket ? del.OkPacket : del.ErrorPacket
    }
    return null
  }

}

export class Connection {
  public name: string = ''
  public conn: MysqlConnection
  public config: DatabaseConnection

  public constructor(name: string, conn: MysqlConnection, config: DatabaseConnection) {
    this.name = name
    this.conn = conn
    this.config = config
  }
}