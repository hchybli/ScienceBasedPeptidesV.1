export function toNumberIfBigInt(value: unknown): unknown {
  return typeof value === "bigint" ? Number(value) : value;
}

export function jsonSafeRow<T extends Record<string, unknown>>(row: T, keys: Array<keyof T>): T {
  const out = { ...row };
  for (const k of keys) {
    const v = out[k];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (out as any)[k] = toNumberIfBigInt(v);
  }
  return out;
}

