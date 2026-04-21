"use client";

export async function apiFetch(
  url: string,
  opts: RequestInit & { privyToken?: string | null } = {},
): Promise<Response> {
  const { privyToken, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (privyToken) {
    h.set("authorization", `Bearer ${privyToken}`);
  }
  return fetch(url, { ...rest, headers: h });
}
