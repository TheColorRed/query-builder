import DB, { DatabaseConnections, DatabaseConnection } from "./DB";

module.exports = function config(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true): any {
  return DB.connect(config, throwError)
}