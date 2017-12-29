export enum Type {
  // Integer
  tinyint, smallint, mediumint, int, bigint, bit,
  // Real
  float, double, decimal,
  // Text
  char, varchar, tinytext, text, mediumtext, longtext, json,
  // Binary
  binary, varbinary, tinyblob, blob, mediumblob, longblob,
  // Temporal (time)
  date, time, year, datetime, timestamp,
  // Spatial (geometry)
  point, linestring, polygon, geometry, multipoint, multilinestring, multipolygon, geometrycollection,
  // Other
  enum, set
}