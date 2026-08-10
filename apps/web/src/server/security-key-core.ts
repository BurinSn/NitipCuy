export function decodeExactBase64Key(
  value: string | undefined,
  expectedBytes = 32,
): Uint8Array | null {
  if (
    !value ||
    value.trim() !== value ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    return null;
  }

  const key = Buffer.from(value, "base64");
  if (key.byteLength !== expectedBytes || key.toString("base64") !== value) {
    return null;
  }
  return Uint8Array.from(key);
}
