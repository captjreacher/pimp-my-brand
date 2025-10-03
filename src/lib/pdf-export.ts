let cachedToolsPromise: Promise<{
  html2canvas: typeof import("html2canvas")["default"];
  jsPDF: import("jspdf").jsPDF;
}> | null = null;

export const PDF_EXPORT_MODULE_ERROR_MESSAGE =
  "Unable to load PDF export tools. Please reinstall dependencies and try again.";

const moduleLoadError = new Error(PDF_EXPORT_MODULE_ERROR_MESSAGE);

export async function loadPdfExportTools() {
  if (!cachedToolsPromise) {
    cachedToolsPromise = Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ])
      .then(([html2canvasModule, jsPDFModule]) => {
        const html2canvas = html2canvasModule?.default;
        const jsPDF = (jsPDFModule as any)?.jsPDF ?? jsPDFModule?.default;

        if (typeof html2canvas !== "function") {
          throw moduleLoadError;
        }

        if (typeof jsPDF !== "function") {
          throw moduleLoadError;
        }

        return { html2canvas, jsPDF };
      })
      .catch((error) => {
        cachedToolsPromise = null;
        throw error;
      });
  }

  return cachedToolsPromise;
}

export function resetPdfExportToolsCache() {
  cachedToolsPromise = null;
}
