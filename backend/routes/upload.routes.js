/**
 * Upload Route
 * POST /api/upload  — accept CSV file upload, run audit, persist to DB
 * POST /api/generate-sample — generate 500-record gym dataset, audit, persist
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auditDataset } = require('../lib/auditEngine');
const { generateRecords, recordsToCSV } = require('../generate_dataset');
const { persistSession } = require('../db/sessionService');
const fs = require('fs');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/upload
router.post('/', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file was uploaded.' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname || 'uploaded_dataset.csv';

    const auditResult = auditDataset(csvContent);
    if (!auditResult.success) {
      return res.status(400).json(auditResult);
    }

    const session = await persistSession(fileName, csvContent, auditResult);

    return res.json({
      success: true,
      message: `Successfully uploaded and audited "${fileName}".`,
      sessionId: session.id,
      fileName,
      audit: auditResult
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: `Upload failed: ${err.message}` });
  }
});

// POST /api/generate-sample
router.post('/generate-sample', async (req, res) => {
  try {
    const fileName = 'sample_dataset.csv';
    const filePath = path.join(__dirname, '..', fileName);
    let csvContent;

    if (fs.existsSync(filePath)) {
      csvContent = fs.readFileSync(filePath, 'utf-8');
    } else {
      const records = generateRecords(500);
      csvContent = recordsToCSV(records);
      fs.writeFileSync(filePath, csvContent, 'utf-8');
    }

    const auditResult = auditDataset(csvContent);
    if (!auditResult.success) {
      return res.status(500).json(auditResult);
    }

    const session = await persistSession(fileName, csvContent, auditResult);

    return res.json({
      success: true,
      message: 'Loaded 500 gym member records with intentional DQM issues.',
      sessionId: session.id,
      fileName,
      audit: auditResult
    });
  } catch (err) {
    console.error('Generate-sample error:', err);
    return res.status(500).json({ success: false, error: `Generation failed: ${err.message}` });
  }
});

module.exports = router;

