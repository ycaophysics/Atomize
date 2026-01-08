export const config = {
  storage: process.env.ATOMIZE_STORAGE ?? "json",
  dataFile: process.env.ATOMIZE_DATA_FILE ?? "data/atomize.json",
  sqlitePath: process.env.ATOMIZE_SQLITE_PATH ?? "data/atomize.db",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.0-flash",
  geminiThinkingModel: process.env.GEMINI_THINKING_MODEL ?? "gemini-3.0-pro",
  defaultSnoozeMinutes: Number(process.env.ATOMIZE_SNOOZE_MINUTES ?? "30")
};
