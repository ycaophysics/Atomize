export function nowIso(): string {
  return new Date().toISOString();
}

export function addMinutesIso(minutes: number): string {
  const ms = Date.now() + minutes * 60 * 1000;
  return new Date(ms).toISOString();
}

export function isAfterNow(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}
