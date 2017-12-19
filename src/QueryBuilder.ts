import { Connection } from 'mysql'
import { DB } from './DB';

export class QueryBuilder {
  public static tableSafeAlterMode: boolean = true
  public static async query<T>(conn: Connection | undefined, query: string, values: any[]): Promise<T> {
    return new Promise<Promise<T>>((resolve, reject) => {
      if (!conn) conn = DB.getDefaultConnection().conn
      if (!conn) return reject({ message: 'Could not get connection' })
      conn.query(query, values, (err, results) => {
        if (err) return reject({ sql: err.sql, message: err.message })
        return resolve(results)
      })
    })
  }
}