export type TableDangerNote = "unrecoverable" | "recoverable";

// Classified from the statement that is actually about to run rather than from
// the menu action: several engines (SQLite, DuckDB, Spanner, IoTDB) truncate
// with DELETE, and others (ClickHouse, Doris, StarRocks, Hive, Cassandra)
// clear with TRUNCATE, so the action name alone cannot say whether rows are
// recoverable. Other DDL (DROP VIEW / DROP INDEX / ALTER ...) stays silent
// instead of guessing.
const UNRECOVERABLE_STATEMENT = /^(TRUNCATE\s+TABLE|DROP\s+(TABLE|DATABASE|SCHEMA))\b/;
const RECOVERABLE_STATEMENT = /^DELETE\s+FROM\b/;

function statementNote(statement: string): TableDangerNote | null {
  const upper = statement.toUpperCase();
  if (UNRECOVERABLE_STATEMENT.test(upper)) return "unrecoverable";
  if (RECOVERABLE_STATEMENT.test(upper)) return "recoverable";
  return null;
}

/** Worst-case classification across the previewed statements; `null` when nothing is recognised. */
export function tableDangerNote(sql: string | null | undefined): TableDangerNote | null {
  const notes = (sql ?? "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map(statementNote);
  if (!notes.length) return null;
  if (notes.includes("unrecoverable")) return "unrecoverable";
  return notes.every((note) => note === "recoverable") ? "recoverable" : null;
}
