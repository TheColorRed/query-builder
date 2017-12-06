import Builder from "./Builder";
import * as mysql from 'mysql'

export default class DB {

  public static connect(host: string, user: string, password: string, database: string) {
    let conn = mysql.createConnection({
      host,
      user,
      password,
      database
    })
    conn.connect()
    return new Builder(conn)
  }

  public static async query<T>(conn: mysql.Connection, query: string, ...placeholders: any[]) {
    return new Promise<Promise<T[]>>(resolve => {
      conn.query(query, placeholders, (err, results, fields) => {
        resolve(results)
      })
    })
  }

}