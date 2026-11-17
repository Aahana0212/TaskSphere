// Scope cached workspace to the signed-in account. Never read legacy global keys.
export function scopedKey(key: string): string {
  const id = sessionStorage.getItem("tasksphere_user_id");
  if (!id) throw new Error("No authenticated user");
  return `tasksphere:${id}:${key}`;
}
