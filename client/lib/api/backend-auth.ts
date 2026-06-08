export async function buildBackendAuthHeaders(
  getToken: () => Promise<string | null>,
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  try {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
  }

  return headers;
}
