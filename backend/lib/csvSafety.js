function protectCell(value) {
  if (typeof value !== 'string') return value;
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

function protectRows(rows) {
  return rows.map((row) => {
    const safeRow = {};
    for (const [key, value] of Object.entries(row || {})) {
      safeRow[key] = protectCell(value);
    }
    return safeRow;
  });
}

module.exports = { protectRows };
