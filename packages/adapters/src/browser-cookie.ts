export function createHostOnlyBrowserCookie(name: `__Host-${string}`) {
  return Object.freeze({
    httpOnly: true,
    name,
    path: "/",
    sameSite: "lax" as const,
    secure: true,
  });
}
