const crypto = require('crypto');
const IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/i;
const GENERATED_ID_TABLES = new Set([
  'audit_records',
  'audit_errors',
  'cleaned_records',
  'cleaning_change_log',
  'review_queue',
  'etl_pipeline_issues'
]);

async function insertRowsInBatches(tx, table, columns, rows, batchSize = 200) {
  if (!IDENTIFIER_PATTERN.test(table) || !columns.length || columns.some(column => !IDENTIFIER_PATTERN.test(column))) {
    throw new Error('Bulk insert table and column names must be fixed database identifiers.');
  }
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Bulk insert batch size must be a positive integer.');
  }

  const insertColumns = GENERATED_ID_TABLES.has(table) && !columns.includes('id')
    ? ['id', ...columns]
    : columns;
  const insertRows = insertColumns === columns
    ? rows
    : rows.map(row => [crypto.randomUUID(), ...row]);

  for (let start = 0; start < insertRows.length; start += batchSize) {
    const batch = insertRows.slice(start, start + batchSize);
    if (batch.some(row => !Array.isArray(row) || row.length !== insertColumns.length)) {
      throw new Error(`Bulk insert rows for ${table} do not match the declared columns.`);
    }

    const values = [];
    const groups = batch.map((row) => {
      const placeholders = row.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await tx(`INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES ${groups.join(', ')}`, values);
  }
}

module.exports = { insertRowsInBatches };
