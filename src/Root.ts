import * as mysql from 'mysql'

export class Root {
  public static async query<T>(conn: mysql.Connection | undefined, query: string, placeholders: any[]): Promise<T | null> {
    if (typeof conn == 'undefined') return Promise.resolve(null)
    return new Promise<Promise<T>>(resolve => {
      conn.query(query, placeholders, (err, results, fields) => {
        if (err) throw err
        resolve(results)
      })
    })
  }
}