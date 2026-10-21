import { splitSqlStatementRanges } from "@/lib/sql/sqlStatementRanges";

// Statements that remove rows or a whole table/schema. The note never claims a
// statement is recoverable: a committed DELETE, a TRUNCATE with no backup and a
// DELETE inside an open transaction all differ, and the dialog cannot see the
// transaction state, logging or backups. It only warns that recovery is not
// guaranteed.
const ROW_DESTRUCTIVE_STATEMENT = /^(TRUNCATE\s+TABLE|DROP\s+(TABLE|DATABASE|SCHEMA)|DELETE\s+FROM)\b/;

// Leading comments and whitespace are not part of the statement keyword.
const LEADING_NOISE = /^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|#[^\n]*(?:\n|$))+/;

function isRowDestructive(statement: string): boolean {
  return ROW_DESTRUCTIVE_STATEMENT.test(statement.replace(LEADING_NOISE, "").toUpperCase());
}

/**
 * Whether the previewed SQL deserves the "recovery is not guaranteed" warning.
 *
 * Splitting reuses the editor's statement splitter, so a semicolon inside a
 * quoted identifier/string or a leading comment does not split or hide the real
 * statement. A batch warns as soon as one of its statements is destructive.
 */
export function tableDangerNote(sql: string | null | undefined): boolean {
  if (!sql) return false;
  return splitSqlStatementRanges(sql).some((statement) => isRowDestructive(statement.sql));
}
