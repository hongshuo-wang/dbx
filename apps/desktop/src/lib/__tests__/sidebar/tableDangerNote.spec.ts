import { describe, expect, it } from "vitest";
import { tableDangerNote } from "@/lib/sidebar/tableDangerNote";

describe("tableDangerNote", () => {
  it("reports TRUNCATE and DROP TABLE as unrecoverable", () => {
    expect(tableDangerNote("TRUNCATE TABLE public.orders;")).toBe("unrecoverable");
    expect(tableDangerNote("TRUNCATE TABLE orders CASCADE;")).toBe("unrecoverable");
    expect(tableDangerNote("DROP TABLE public.orders;")).toBe("unrecoverable");
    expect(tableDangerNote('DROP TABLE IF EXISTS "orders";')).toBe("unrecoverable");
    expect(tableDangerNote("DROP DATABASE shop;")).toBe("unrecoverable");
    expect(tableDangerNote("DROP SCHEMA public CASCADE;")).toBe("unrecoverable");
  });

  it("reports row-wise DELETE as recoverable", () => {
    expect(tableDangerNote("DELETE FROM public.orders;")).toBe("recoverable");
    // SQLite, DuckDB, Spanner and IoTDB clear a table with DELETE, not TRUNCATE.
    expect(tableDangerNote("DELETE FROM orders WHERE TRUE;")).toBe("recoverable");
  });

  it("keeps the worst case for batch previews", () => {
    expect(tableDangerNote("DELETE FROM a;\nDELETE FROM b;")).toBe("recoverable");
    expect(tableDangerNote("DELETE FROM a;\nTRUNCATE TABLE b;")).toBe("unrecoverable");
    expect(tableDangerNote("TRUNCATE TABLE a;\nDROP TABLE b;")).toBe("unrecoverable");
  });

  it("stays silent for unrelated DDL and for an unbuilt preview", () => {
    expect(tableDangerNote("DROP VIEW public.v;")).toBeNull();
    expect(tableDangerNote("DROP INDEX public.ix;")).toBeNull();
    expect(tableDangerNote("ALTER TABLE public.orders RENAME TO orders_old;")).toBeNull();
    expect(tableDangerNote("")).toBeNull();
    expect(tableDangerNote("   ")).toBeNull();
    expect(tableDangerNote(undefined)).toBeNull();
    expect(tableDangerNote(null)).toBeNull();
  });
});
