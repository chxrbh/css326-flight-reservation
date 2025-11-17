const pad2 = (value: number) => String(value).padStart(2, "0");

function toDate(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toUtcISOString(local: string) {
  if (!local) return local;
  const normalized = local.length === 16 ? `${local}:00` : local;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return local;
  return date.toISOString();
}

export function fromMySQLDateTime(mysqlDT?: string | null) {
  if (!mysqlDT) return "";
  const date = toDate(mysqlDT);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const HH = pad2(date.getHours());
  const MM = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

export function adjustLocalByMinutes(local: string, minutes: number) {
  if (!local || typeof minutes !== "number" || Number.isNaN(minutes)) {
    return local;
  }
  const inst = new Date(local);
  if (Number.isNaN(inst.getTime())) return local;
  inst.setMinutes(inst.getMinutes() + minutes);
  const yyyy = inst.getFullYear();
  const mm = pad2(inst.getMonth() + 1);
  const dd = pad2(inst.getDate());
  const HH = pad2(inst.getHours());
  const MM = pad2(inst.getMinutes());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

export function adjustISOStringByMinutes(input: string, minutes: number) {
  if (!input || typeof minutes !== "number" || Number.isNaN(minutes)) {
    return null;
  }
  const normalized = input.includes("T") ? input : input.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function addDurationLocal(local: string, duration?: string | null) {
  if (!local || !duration) return local;
  const parts = duration.split(":");
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return local;
  date.setHours(date.getHours() + h);
  date.setMinutes(date.getMinutes() + m);
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const HH = pad2(date.getHours());
  const MM = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

export function formatLocalDateTime(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
) {
  const date = toDate(value ?? undefined);
  if (!date) return "-";
  return date.toLocaleString(undefined, options);
}

export function formatLocalDate(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
) {
  const date = toDate(value ?? undefined);
  if (!date) return "-";
  return date.toLocaleDateString(undefined, options);
}

export function normalizeDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (value.includes("T")) {
    return value.split("T")[0];
  }
  if (value.includes(" ")) {
    return value.split(" ")[0];
  }
  return value;
}
