function parseDate(value?: string | number | Date | null) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDDMMYY(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatDate(value?: string | number | Date | null) {
  const date = parseDate(value);
  if (!date) return "-";
  return formatDDMMYY(date);
}

export function formatDateTime(value?: string | number | Date | null) {
  const date = parseDate(value);
  if (!date) return "-";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
  return `${formatDDMMYY(date)} ${time}`;
}
