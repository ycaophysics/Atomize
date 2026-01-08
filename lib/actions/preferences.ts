"use server";

import { redirect } from "next/navigation";
import { getStore } from "@/lib/storage";
import type { Preferences } from "@/lib/types";

function parsePref<T extends string>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  return value as T;
}

export async function updatePreferencesAction(formData: FormData) {
  const store = await getStore();
  const current = await store.getPreferences();

  const breakdownDepth = parsePref<Preferences["breakdownDepth"]>(
    formData.get("breakdownDepth"),
    current.breakdownDepth
  );
  const stepSize = parsePref<Preferences["stepSize"]>(
    formData.get("stepSize"),
    current.stepSize
  );
  const stylePreset = parsePref<Preferences["stylePreset"]>(
    formData.get("stylePreset"),
    current.stylePreset
  );
  const nudgeStyle = parsePref<Preferences["nudgeStyle"]>(
    formData.get("nudgeStyle"),
    current.nudgeStyle
  );

  await store.updatePreferences({ breakdownDepth, stepSize, stylePreset, nudgeStyle });
  redirect("/settings");
}
