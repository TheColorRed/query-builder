import { DB, DatabaseConnections, DatabaseConnection } from './DB'
import { Connection } from 'mysql'

export { Model as model } from './Model'
export { DB as db } from './DB'
export { sort } from './BuilderBase'
export { raw } from './QueryConstructs'
export { Type as type } from './Types'

export function escape(value: any): any {
  return DB.getDefaultConnection().conn.escape(value)
}

export function mysql(connectionName?: string): Connection {
  return (connectionName ? DB.getConnection(connectionName) : DB.getDefaultConnection()).conn
}

export function initdb(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true): any {
  DB.init(config, throwError)
}