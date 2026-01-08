import { getStore } from "@/lib/storage";

export async function getPreferences() {
  const store = await getStore();
  return store.getPreferences();
}
