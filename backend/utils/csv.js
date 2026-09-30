/** Minimal RFC-4180 style CSV parser (quotes, escaped quotes, CRLF, BOM). Returns array of string arrays. */
function parseCSV(input) {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const pushRow = () => {
    row.push(field);
    field = '';
    if (row.some((x) => x.trim() !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      pushRow();
    } else field += c;
  }
  pushRow();
  return rows;
}

module.exports = { parseCSV };