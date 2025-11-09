export const safeSpread = <T extends Record<string, any>>(
  value: any
): Partial<T> => (value && typeof value === "object" ? value : {});