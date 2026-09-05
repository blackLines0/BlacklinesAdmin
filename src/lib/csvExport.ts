export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number;
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Semicolon-separated: French-locale Excel (comma as decimal separator)
// misreads comma-separated CSVs, but reads ";" correctly out of the box.
export function exportToCsv<T>(filenamePrefix: string, rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((c) => escapeCsvField(c.label)).join(";");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(";"));
  const csv = [header, ...lines].join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
