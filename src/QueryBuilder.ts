import { DB, Connection } from './DB';

export class QueryBuilder {

  public static async query<T>(conn: Connection | undefined, query: string, values: any[]): Promise<T> {
    return new Promise<Promise<T>>((resolve, reject) => {
      if (!conn) conn = DB.getDefaultConnection()
      if (!conn) return reject({ message: 'Could not get connection' })
      if (conn.config.dumpQueries) console.log({
        query, values,
        connection: conn.name
      })
      conn.conn.query(query, values, (err, results) => {
        if (err) return reject({ sql: err.sql, message: err.message })
        return resolve(results)
      })
    })
  }
}