"use client";

// Assumption: the published `pdf-lib` package is used here because `@pdf-lib/core` is not available from npm.
import { PDFDocument } from "pdf-lib";
import { toPng, toSvg } from "html-to-image";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { apiFetch } from "@/lib/api";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, data] = dataUrl.split(",");
  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

async function withHiddenExportChrome<T>(element: HTMLElement, fn: () => Promise<T>): Promise<T> {
  const selectors = [
    ".orbit-comment-pin",
    ".orbit-remote-cursor",
    ".react-flow__selection",
    ".react-flow__background",
  ];

  const hiddenElements = selectors.flatMap((selector) => Array.from(element.querySelectorAll<HTMLElement>(selector)));
  const previousDisplays = hiddenElements.map((item) => item.style.display);

  hiddenElements.forEach((item) => {
    item.style.display = "none";
  });

  try {
    return await fn();
  } finally {
    hiddenElements.forEach((item, index) => {
      item.style.display = previousDisplays[index] ?? "";
    });
  }
}

export function useFlowchartExport() {
  const { workspaceId, authToken } = useSessionContext();

  const exportToPng = async (element: HTMLElement, filename: string) => {
    const dataUrl = await withHiddenExportChrome(element, () =>
      toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
      }),
    );

    downloadBlob(dataUrlToBlob(dataUrl), filename.endsWith(".png") ? filename : `${filename}.png`);
  };

  const exportToSvg = async (element: HTMLElement, filename: string) => {
    const dataUrl = await withHiddenExportChrome(element, () =>
      toSvg(element, {
        cacheBust: true,
      }),
    );

    downloadBlob(dataUrlToBlob(dataUrl), filename.endsWith(".svg") ? filename : `${filename}.svg`);
  };

  const exportToPdf = async (element: HTMLElement, filename: string) => {
    const dataUrl = await withHiddenExportChrome(element, () =>
      toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
      }),
    );

    const imageBytes = await dataUrlToBlob(dataUrl).arrayBuffer();
    const pdf = await PDFDocument.create();
    const image = await pdf.embedPng(imageBytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const pdfBytes = await pdf.save();
    downloadBlob(
      new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
      filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
    );
  };

  const exportToJson = async (flowchartId: string) => {
    const response = await apiFetch(`/api/flowcharts/${flowchartId}/export?format=json`, {
      session: {
        workspaceId,
        authToken,
      },
    });

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const match = contentDisposition?.match(/filename="(.+?)"/);
    const filename = match?.[1] ?? `flowchart-${flowchartId}.json`;
    downloadBlob(blob, filename);
  };

  return {
    exportToPng,
    exportToSvg,
    exportToPdf,
    exportToJson,
  };
}
