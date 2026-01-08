import { config } from "@/lib/config";
import { createJsonStore } from "@/lib/storage/json";
import { createSqliteStore } from "@/lib/storage/sqlite";
import type { Store } from "@/lib/storage/store";

let store: Store | null = null;

export async function getStore(): Promise<Store> {
  if (store) {
    return store;
  }
  if (config.storage === "sqlite") {
    try {
      store = createSqliteStore();
      await store.init();
      return store;
    } catch (error) {
      console.warn("SQLite init failed, falling back to JSON.", error);
    }
  }
  store = createJsonStore();
  await store.init();
  return store;
}
