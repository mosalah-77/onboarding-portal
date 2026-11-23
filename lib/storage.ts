// File bytes live in D1 beside their metadata, so the whole demo runs on one free database.
// D1 caps a row at 2 MB, which is why uploads stop at MAX_FILE_BYTES.
export const MAX_FILE_BYTES = 1_900_000;

export type FileStore = {
  /** Create only. Resolves to null when the key already holds an object. */
  put(key: string, bytes: Uint8Array, options: { onlyIf?: unknown; customMetadata: { sha256: string } }): Promise<unknown | null>;
  head(key: string): Promise<{ customMetadata?: Record<string, string> } | null>;
  get(key: string): Promise<{ body: BodyInit } | null>;
  delete(key: string): Promise<unknown>;
};

export function d1Store(db: D1Database): FileStore {
  return {
    async put(key, bytes, options) {
      const result = await db.prepare('INSERT INTO objects (key,sha256,body) VALUES (?,?,?) ON CONFLICT(key) DO NOTHING').bind(key, options.customMetadata.sha256, bytes).run();
      return result.meta.changes ? { key } : null;
    },
    async head(key) {
      const row = await db.prepare('SELECT sha256 FROM objects WHERE key=?').bind(key).first<{ sha256: string }>();
      return row ? { customMetadata: { sha256: row.sha256 } } : null;
    },
    async get(key) {
      const row = await db.prepare('SELECT body FROM objects WHERE key=?').bind(key).first<{ body: ArrayBuffer | number[] }>();
      return row ? { body: new Uint8Array(row.body) } : null;
    },
    delete: key => db.prepare('DELETE FROM objects WHERE key=?').bind(key).run(),
  };
}
