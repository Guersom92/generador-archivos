const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// Ruta para generar archivo Excel
router.post('/excel', fileController.generateExcel);

// Ruta para generar archivo PDF
router.post('/pdf', fileController.generatePdf);

module.exports = router;
