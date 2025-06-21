const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Función para generar un nombre único temporal
function generateTempFileName(extension) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${timestamp}_${random}.${extension}`;
}

// Función para generar archivo Excel
exports.generateExcel = (req, res) => {
    try {
        const { data, fileName = 'datos' } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Se requiere un arreglo de datos' });
        }

        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');

        // Crear el directorio de descargas si no existe
        const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        // Generar el archivo
        const tempFileName = generateTempFileName('xlsx');
        const filePath = path.join(downloadsDir, tempFileName);
        XLSX.writeFile(wb, filePath);

        // Enviar el archivo como respuesta
        res.download(filePath, `${fileName}.xlsx`, (err) => {
            // Eliminar el archivo después de enviarlo
            if (err) {
                console.error('Error al enviar el archivo:', err);
            }
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ error: 'Error al generar el archivo Excel' });
    }
};

// Función para generar archivo PDF
exports.generatePdf = async (req, res) => {
    try {
        const { html, fileName = 'documento' } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'Se requiere contenido HTML' });
        }

        const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const tempFileName = generateTempFileName('pdf');
        const filePath = path.join(downloadsDir, tempFileName);

        // Usar Puppeteer para generar el PDF
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: filePath,
            format: 'A4',
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });
        await browser.close();

        // Enviar el archivo como respuesta
        res.download(filePath, `${fileName}.pdf`, (err) => {
            // Eliminar el archivo después de enviarlo
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (unlinkErr) {
                console.error('Error al eliminar el archivo temporal:', unlinkErr);
            }
            if (err) {
                console.error('Error al enviar el archivo:', err);
            }
        });

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Error al generar el archivo PDF' });
    }
};
