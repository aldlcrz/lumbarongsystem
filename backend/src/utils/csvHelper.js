/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data - The array of objects to convert.
 * @param {Array<string>} [headers] - Optional specific headers to include.
 * @returns {string} - The generated CSV string.
 */
function jsonToCsv(data, headers) {
  if (!data || !data.length) return "";

  const cols = headers || Object.keys(data[0]);
  const headerRow = cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",");

  const rows = data.map(row => {
    return cols.map(col => {
      let val = row[col];
      if (val === null || val === undefined) val = "";
      
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(",");
  });

  // Adding UTF-8 BOM for Excel compatibility
  return "\uFEFF" + [headerRow, ...rows].join("\r\n");
}

module.exports = {
  jsonToCsv
};
