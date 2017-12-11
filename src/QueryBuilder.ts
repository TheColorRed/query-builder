import { Connection } from 'mysql'
import { DB } from './DB';

export class QueryBuilder {
  public static tableSafeAlterMode: boolean = true
  public static async query<T>(conn: Connection | undefined, query: string, values: any[]): Promise<T> {
    return new Promise<Promise<T>>(resolve => {
      if (!conn) conn = DB.getDefaultConnection().conn
      conn.query(query, values, (err, results) => {
        if (err) throw { sql: err.sql, message: err.message }
        resolve(results)
      })
    })
  }
}