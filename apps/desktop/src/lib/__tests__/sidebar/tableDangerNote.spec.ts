import { describe, expect, it } from "vitest";
import { tableDangerNote } from "@/lib/sidebar/tableDangerNote";

describe("tableDangerNote", () => {
  it("warns for TRUNCATE and DROP, which keep no row data", () => {
    expect(tableDangerNote("TRUNCATE TABLE public.orders;")).toBe(true);
    expect(tableDangerNote("TRUNCATE TABLE orders CASCADE;")).toBe(true);
    expect(tableDangerNote("DROP TABLE public.orders;")).toBe(true);
    expect(tableDangerNote('DROP TABLE IF EXISTS "orders";')).toBe(true);
    expect(tableDangerNote("DROP DATABASE shop;")).toBe(true);
    expect(tableDangerNote("DROP SCHEMA public CASCADE;")).toBe(true);
  });

  it("warns for row-wise DELETE without promising it can be recovered", () => {
    // SQLite, DuckDB, Spanner and IoTDB clear a table with DELETE, not TRUNCATE.
    expect(tableDangerNote("DELETE FROM public.orders;")).toBe(true);
    expect(tableDangerNote("DELETE FROM orders WHERE TRUE;")).toBe(true);
  });

  it("uses the statement splitter, so quoted semicolons do not break the match", () => {
    expect(tableDangerNote('TRUNCATE TABLE "orders;archive";')).toBe(true);
    expect(tableDangerNote("DELETE FROM orders WHERE note = 'a; DROP TABLE orders;';")).toBe(true);
    expect(tableDangerNote("SELECT 'TRUNCATE TABLE orders;';")).toBe(false);
  });

  it("ignores leading comments", () => {
    expect(tableDangerNote("-- clean up\nTRUNCATE TABLE orders;")).toBe(true);
    expect(tableDangerNote("/* rollback plan: none */ DROP TABLE orders;")).toBe(true);
    expect(tableDangerNote("# mysql style\nDELETE FROM orders;")).toBe(true);
  });

  it("keeps the worst case for batch previews", () => {
    expect(tableDangerNote("TRUNCATE TABLE a;\nTRUNCATE TABLE b;")).toBe(true);
    expect(tableDangerNote("DROP VIEW v;\nDELETE FROM a;")).toBe(true);
    expect(tableDangerNote("-- first\nDELETE FROM a;\n/* second */ DROP TABLE b;")).toBe(true);
  });

  it("stays silent for DDL that does not delete rows and for an unbuilt preview", () => {
    expect(tableDangerNote("DROP VIEW public.v;")).toBe(false);
    expect(tableDangerNote("DROP INDEX public.ix;")).toBe(false);
    expect(tableDangerNote("ALTER TABLE public.orders RENAME TO orders_old;")).toBe(false);
    expect(tableDangerNote("SELECT * FROM orders;")).toBe(false);
    expect(tableDangerNote("")).toBe(false);
    expect(tableDangerNote("   ")).toBe(false);
    expect(tableDangerNote(undefined)).toBe(false);
    expect(tableDangerNote(null)).toBe(false);
  });
});
