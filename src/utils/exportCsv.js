// CSV Export Utility for Reports and Attendance Logs

export function exportToCSV(data = [], filename = 'attendance_report.csv') {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Get keys from first object
  const headers = Object.keys(data[0]);

  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      const stringified = String(val).replace(/"/g, '""');
      return `"${stringified}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
