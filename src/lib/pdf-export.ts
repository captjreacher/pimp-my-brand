const HTML2CANVAS_MODULE_ID = "html2canvas/dist/html2canvas.esm.js" as const;
const JSPDF_MODULE_ID = "jspdf/dist/jspdf.es.min.js" as const;

type Html2Canvas = typeof import("html2canvas")["default"];
type JsPDFConstructor = typeof import("jspdf")["jsPDF"];

let cachedToolsPromise: Promise<{
  html2canvas: Html2Canvas;
  jsPDF: JsPDFConstructor;
}> | null = null;

export const PDF_EXPORT_MODULE_ERROR_MESSAGE =
  "Unable to load PDF export tools. Please reinstall dependencies and try again.";

const moduleLoadError = new Error(PDF_EXPORT_MODULE_ERROR_MESSAGE);

async function importHtml2Canvas() {
  const module = (await import(HTML2CANVAS_MODULE_ID)) as {
    default?: Html2Canvas;
  } & Record<string, unknown>;

  const html2canvas =
    module?.default ?? (module as unknown as Html2Canvas | undefined);

  if (typeof html2canvas !== "function") {
    throw moduleLoadError;
  }

  return html2canvas;
}

async function importJsPdf() {
  const module = (await import(JSPDF_MODULE_ID)) as {
    default?: JsPDFConstructor;
    jsPDF?: JsPDFConstructor;
  } & Record<string, unknown>;

  const jsPDF =
    module?.jsPDF ??
    module?.default ??
    (module as unknown as JsPDFConstructor | undefined);

  if (typeof jsPDF !== "function") {
    throw moduleLoadError;
  }

  return jsPDF;
}

export async function loadPdfExportTools() {
  if (!cachedToolsPromise) {
    cachedToolsPromise = Promise.all([importHtml2Canvas(), importJsPdf()])
      .then(([html2canvas, jsPDF]) => ({ html2canvas, jsPDF }))
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
