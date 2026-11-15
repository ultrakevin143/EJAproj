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
const path = require('path');
const { requireAuth, requireRole, createRateLimiter } = require('../middleware/auth');

router.use(requireAuth, requireRole('STEWARD', 'ADMIN'));
const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: 'Too many uploads. Please wait before trying again.'
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (req, file, callback) => {
    if (path.extname(String(file.originalname || '').replace(/\\/g, '/')).toLowerCase() !== '.csv') {
      const error = new Error('Only CSV files are accepted.');
      error.code = 'INVALID_FILE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  }
});

// POST /api/upload
router.post('/', uploadRateLimit, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file was uploaded.' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const fileName = path.posix.basename(String(req.file.originalname || 'uploaded_dataset.csv').replace(/\\/g, '/')).slice(0, 255);

    const auditResult = auditDataset(csvContent);
    if (!auditResult.success) {
      return res.status(400).json(auditResult);
    }

    const session = await persistSession(fileName, csvContent, auditResult, req.authUser);

    return res.json({
      success: true,
      message: `Successfully uploaded and audited "${fileName}".`,
      sessionId: session.id,
      fileName,
      audit: auditResult
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: 'Upload failed. Check the file and try again.' });
  }
});

// POST /api/generate-sample
router.post('/generate-sample', uploadRateLimit, async (req, res) => {
  try {
    const fileName = 'sample_dataset.csv';
    const records = generateRecords(500);
    const csvContent = recordsToCSV(records);

    const auditResult = auditDataset(csvContent);
    if (!auditResult.success) {
      return res.status(500).json(auditResult);
    }

    const session = await persistSession(fileName, csvContent, auditResult, req.authUser, {
      action: 'sample_generate',
      details: 'Generated and audited 500 synthetic CSV rows.'
    });

    return res.json({
      success: true,
      message: 'Loaded 500 gym member records with intentional DQM issues.',
      sessionId: session.id,
      fileName,
      audit: auditResult
    });
  } catch (err) {
    console.error('Generate-sample error:', err);
    return res.status(500).json({ success: false, error: 'Sample generation failed.' });
  }
});

module.exports = router;

