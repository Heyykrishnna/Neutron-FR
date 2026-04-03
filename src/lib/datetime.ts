export const toDateTimeLocalInput = (value: any): string => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const toIsoFromDateTimeLocal = (value: any): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

export const normalizeDateTimeFieldsToIso = <T extends Record<string, any>>(
  payload: T,
  fields: string[],
): T => {
  const next = { ...payload };

  for (const field of fields) {
    if (
      next[field] === undefined ||
      next[field] === null ||
      next[field] === ""
    ) {
      continue;
    }

    const iso = toIsoFromDateTimeLocal(next[field]);
    if (iso) {
      next[field] = iso;
    }
  }

  return next;
};
