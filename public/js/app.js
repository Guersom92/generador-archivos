document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const form = document.getElementById('fileForm');
    const fileNameInput = document.getElementById('fileName');
    const dataInput = document.getElementById('dataInput');
    const fileTypeRadios = document.getElementsByName('fileType');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    
    // Manejador del envío del formulario
    form.addEventListener('submit', handleSubmit);
    
    async function handleSubmit(event) {
        event.preventDefault(); // Prevenir el envío tradicional del formulario
        
        // Validar entrada
        const fileName = fileNameInput.value.trim() || 'datos';
        const fileType = document.querySelector('input[name="fileType"]:checked').value;
        
        let data;
        try {
            data = JSON.parse(dataInput.value);
            if (!Array.isArray(data)) {
                throw new Error('Los datos deben ser un arreglo de objetos');
            }
        } catch (error) {
            showError('Formato de datos JSON inválido. Asegúrate de que sea un arreglo de objetos.');
            console.error('Error al parsear JSON:', error);
            return;
        }
        
        // Mostrar carga
        showLoading(true);
        
        try {
            if (fileType === 'excel') {
                await generateExcel(fileName, data);
            } else {
                await generatePdf(fileName, data);
            }
        } catch (error) {
            showError('Error al generar el archivo. Por favor, inténtalo de nuevo.');
            console.error('Error al generar archivo:', error);
        } finally {
            showLoading(false);
        }
    }
    
    // Función para generar archivo Excel
    async function generateExcel(fileName, data) {
        try {
            const response = await fetch('/api/files/excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    data
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al generar el archivo Excel');
            }
            
            // Descargar el archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            throw error;
        }
    }
    
    // Función para generar archivo PDF
    async function generatePdf(fileName, data) {
        try {
            // Crear HTML para el PDF
            const htmlContent = createPdfHtml(data);
            
            const response = await fetch('/api/files/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    html: htmlContent
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al generar el archivo PDF');
            }
            
            // Descargar el archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            throw error;
        }
    }
    
    // Función para crear el HTML del PDF
    function createPdfHtml(data) {
        if (!data || data.length === 0) return '<p>No hay datos para mostrar</p>';
        
        // Obtener las claves de los objetos (encabezados de la tabla)
        const headers = Object.keys(data[0]);
        
        // Crear filas de la tabla
        const rows = data.map(item => {
            const cells = headers.map(header => 
                `<td>${item[header] !== undefined ? item[header] : ''}</td>`
            ).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        
        // Crear encabezados de la tabla
        const headerRow = headers.map(header => 
            `<th>${header}</th>`
        ).join('');
        
        // Plantilla HTML completa
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Documento PDF</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <h1>Reporte de Datos</h1>
            <p>Generado el: ${new Date().toLocaleString()}</p>
            
            <table>
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Generado por Generador de Archivos</p>
            </div>
        </body>
        </html>
        `;
    }
    
    // Mostrar/ocultar indicador de carga
    function showLoading(show) {
        if (show) {
            form.querySelector('button[type="submit"]').disabled = true;
            loadingElement.style.display = 'flex';
            errorElement.style.display = 'none';
        } else {
            form.querySelector('button[type="submit"]').disabled = false;
            loadingElement.style.display = 'none';
        }
    }
    
    // Mostrar mensaje de error
    function showError(message) {
        // Si ya hay un mensaje mostrándose, lo quitamos primero
        if (errorElement.style.display === 'flex') {
            errorElement.classList.add('hide');
            // Esperamos a que termine la animación de salida
            setTimeout(() => {
                errorElement.classList.remove('hide');
                errorElement.textContent = message;
                errorElement.style.display = 'flex';
                errorElement.setAttribute('aria-hidden', 'false');
                
                // Ocultar el mensaje después de 5 segundos
                setTimeout(hideError, 5000);
            }, 300);
        } else {
            errorElement.textContent = message;
            errorElement.style.display = 'flex';
            errorElement.setAttribute('aria-hidden', 'false');
            
            // Ocultar el mensaje después de 5 segundos
            setTimeout(hideError, 5000);
        }
    }
    
    // Función para ocultar el mensaje de error con animación
    function hideError() {
        errorElement.classList.add('hide');
        setTimeout(() => {
            errorElement.style.display = 'none';
            errorElement.classList.remove('hide');
            errorElement.setAttribute('aria-hidden', 'true');
        }, 300);
    }
});
