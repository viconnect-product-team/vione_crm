import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import type { EventItem, TicketType } from "@/lib/events.functions";

/** Build the QR payload string for a ticket, using the event's configured QR fields. */
export function buildTicketQrPayload(event: EventItem, ticket: TicketType): string {
  const payload: Record<string, string> = {
    eventId: event.id,
    event: event.name,
    ticketId: ticket.id,
    ticket: ticket.name,
  };
  for (const field of event.qrFields) {
    switch (field) {
      case "registration_code":
        payload.registration_code = "";
        break;
      case "ticket_code":
        payload.ticket_code = "";
        break;
      case "verify_url":
        payload.verify_url = `/verify?event=${event.id}&ticket=${ticket.id}`;
        break;
    }
  }
  return JSON.stringify(payload);
}

function safeFileName(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "qr"
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Generate and download a PNG QR code for a ticket type. */
export async function downloadTicketQrPng(event: EventItem, ticket: TicketType): Promise<void> {
  const payload = buildTicketQrPayload(event, ticket);
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  triggerDownload(dataUrl, `qr-${safeFileName(event.name)}-${safeFileName(ticket.name)}.png`);
}

/** Generate and download a printable PDF containing the ticket QR code. */
export async function downloadTicketQrPdf(event: EventItem, ticket: TicketType): Promise<void> {
  const payload = buildTicketQrPayload(event, ticket);
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 1024,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const qrSize = 110;
  const x = (pageW - qrSize) / 2;

  doc.setFontSize(20);
  doc.text(event.name, pageW / 2, 30, { align: "center", maxWidth: pageW - 30 });
  doc.setFontSize(14);
  doc.setTextColor(90);
  doc.text(ticket.name, pageW / 2, 42, { align: "center", maxWidth: pageW - 30 });

  doc.addImage(dataUrl, "PNG", x, 55, qrSize, qrSize);

  doc.setFontSize(10);
  doc.setTextColor(140);
  doc.text(event.date, pageW / 2, 55 + qrSize + 12, { align: "center" });
  if (event.location) {
    doc.text(event.location, pageW / 2, 55 + qrSize + 19, {
      align: "center",
      maxWidth: pageW - 30,
    });
  }

  doc.save(`qr-${safeFileName(event.name)}-${safeFileName(ticket.name)}.pdf`);
}
