import { DB, DatabaseConnections, DatabaseConnection } from "./DB";

export { Model as model } from "./Model";
export { DB as db } from './DB'
export { direction } from './BaseBuilder'

export function connections(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true): any {
  DB.connect(config, throwError)
}