const { beforeEach, describe, test, expect } = require('@playwright/test');

describe('File Generator', () => {

  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  })
  test('La página principal carga correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Icono Generador de Archivos' })).toBeVisible()
  });

  describe("Cuando el formato es correcto", () => {

    test('Se muestra la notificación correspondiente ', async ({ page }) => {
      await page.getByText("generar archivo").click()
      await expect(page.locator(".success-message")).toBeVisible()
      await expect(page.locator(".success-message")).toContainText("Archivo generado y descargado")
    })

    test('Descarga el archivo', async ({ page }) => {

      const downloadPromise = page.waitForEvent('download');
      await page.getByText("generar archivo").click()
      const download = await downloadPromise;
      const suggestedFilename = download.suggestedFilename();
      expect(suggestedFilename).toBe('datos.xlsx');

    });


    test('El archivo lleva el tipo y nombre elegido', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Nombre del' }).fill("ArchivoTest")
      await page.getByText('PDF').click()
      const downloadPromise = page.waitForEvent('download');
      await page.getByText("generar archivo").click()
      const download = await downloadPromise;
      const suggestedFilename = download.suggestedFilename();
      expect(suggestedFilename).toBe('ArchivoTest.pdf');

    });

  })

  describe("Cuando el formato es incorrecto", () => {

    test('Se muestra la notificación correspondiente ', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Datos (formato JSON):' }).fill("Formato incorrecto")
      await page.getByText("generar archivo").click()
      await expect(page.locator(".error-message")).toBeVisible()
      await expect(page.locator(".error-message")).toContainText("Formato de datos JSON inválido. Asegúrate de que sea un arreglo de objetos.")
    })
  })


})