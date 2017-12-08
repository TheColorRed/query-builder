import { DB, DatabaseConnections, DatabaseConnection } from "./DB";
import { Model } from "./Model";

function config(config: DatabaseConnections<DatabaseConnection>, throwError: boolean = true): any {
  DB.connect(config, throwError)
}

module.exports = {
  config,
  db: DB,
  Model
}