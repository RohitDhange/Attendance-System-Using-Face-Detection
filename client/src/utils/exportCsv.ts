export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    alert('No data to export.');
    return;
  }

  const keys = Object.keys(rows[0]);
  const headerRow = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',');

  const csvRows = rows.map((row) =>
    keys
      .map((key) => {
        const val = row[key] === null || row[key] === undefined ? '' : String(row[key]);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headerRow, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

