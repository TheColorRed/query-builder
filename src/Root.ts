import { Connection } from 'mysql'
import { DB } from './DB';

export class Root {
  public static async query<T>(conn: Connection | undefined, query: string, placeholders: any[]): Promise<T> {
    return new Promise<Promise<T>>(resolve => {
      if (!conn) conn = DB.getDefaultConnection().conn
      conn.query(query, placeholders, (err, results) => {
        if (err) throw err
        resolve(results)
      })
    })
  }
}