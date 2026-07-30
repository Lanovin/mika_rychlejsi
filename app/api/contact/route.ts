import { NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import path from "node:path";
import { readStoredJson, writeStoredJson } from "@/src/lib/server-storage";

const FALLBACK_CONTACT_EMAIL = "info@mikaauto.cz";
const RESEND_ONBOARDING_FROM = "Mika Auto Web <onboarding@resend.dev>";
const messagesPath = path.join(process.cwd(), "data", "messages.json");

const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_TOTAL_BYTES = 20 * 1024 * 1024;

interface ContactMessage {
  name: string;
  email?: string;
  phone: string;
  message: string;
  source: string;
  date: string;
}

interface ContactAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

class AttachmentTooLargeError extends Error {
  constructor() {
    super("Attachments exceed the allowed size.");
    this.name = "AttachmentTooLargeError";
  }
}

function sanitizeAttachmentName(value: string, index: number) {
  const base = value.split(/[\\/]/).pop() || `foto-${index + 1}.jpg`;
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  return cleaned || `foto-${index + 1}.jpg`;
}

async function readAttachments(formData: FormData): Promise<ContactAttachment[]> {
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_ATTACHMENTS) {
    throw new AttachmentTooLargeError();
  }

  const attachments: ContactAttachment[] = [];
  let total = 0;

  for (const [index, file] of files.entries()) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new AttachmentTooLargeError();
    }
    total += file.size;
    if (total > MAX_ATTACHMENTS_TOTAL_BYTES) {
      throw new AttachmentTooLargeError();
    }

    attachments.push({
      filename: sanitizeAttachmentName(file.name, index),
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
    });
  }

  return attachments;
}

class ContactDeliveryNotConfiguredError extends Error {
  constructor() {
    super("No email provider configured for contact form delivery.");
    this.name = "ContactDeliveryNotConfiguredError";
  }
}

function getSourceLabel(source: string) {
  return source === "vykup"
    ? "Oceneni vozu"
    : source === "poptavka"
      ? "Poptavka vozu"
      : "Kontaktni formular";
}

function isStoragePermissionError(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (
      error.code === "EROFS"
      || error.code === "EACCES"
      || error.code === "EPERM"
    );
}

async function saveMessage(msg: ContactMessage) {
  try {
    const messages = await readStoredJson<ContactMessage[]>({
      storeKey: "messages",
      filePath: messagesPath,
      defaultValue: [],
    });

    messages.push(msg);

    await writeStoredJson({
      storeKey: "messages",
      filePath: messagesPath,
      data: messages,
    });

    return true;
  } catch (error) {
    if (isStoragePermissionError(error)) {
      console.warn("[contact] Message storage is read-only in this environment, skipping local persistence.");
      return false;
    }

    console.warn("[contact] Failed to persist message, continuing with email delivery.", error);
    return false;
  }
}

function isResendSenderError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("domain is not verified")
    || normalized.includes("add and verify your domain")
    || normalized.includes("testing emails")
    || normalized.includes("verify a domain");
}

async function sendWithResend(
  resend: Resend,
  from: string,
  msg: ContactMessage,
  contactEmail: string,
  subject: string,
  text: string,
  attachments: ContactAttachment[],
) {
  const { error } = await resend.emails.send({
    from,
    ...(msg.email ? { replyTo: msg.email } : {}),
    to: [contactEmail],
    subject,
    text,
    ...(attachments.length
      ? {
        attachments: attachments.map((file) => ({
          filename: file.filename,
          content: file.content,
        })),
      }
      : {}),
  });

  if (error) {
    throw new Error(error.message || "Failed to send email with Resend.");
  }
}

async function sendEmail(msg: ContactMessage, attachments: ContactAttachment[] = []) {
  const contactEmail = process.env.KONTAKT_EMAIL || process.env.CONTACT_EMAIL || FALLBACK_CONTACT_EMAIL;
  const sourceLabel = getSourceLabel(msg.source);

  const subject = `[${sourceLabel}] Nová zpráva od ${msg.name}`;
  const header = [
    `Jméno: ${msg.name}`,
    `Email: ${msg.email || "neuvedeno"}`,
    `Telefon: ${msg.phone || "neuvedeno"}`,
    `Zdroj: ${sourceLabel}`,
    ...(attachments.length ? [`Přiložené fotografie: ${attachments.length}`] : []),
  ];
  const text = [...header, "", "Zpráva:", msg.message].join("\n");

  // 1) Try Resend first
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const configuredFrom = process.env.RESEND_FROM?.trim();
    const fromAddress = configuredFrom || RESEND_ONBOARDING_FROM;

    try {
      await sendWithResend(resend, fromAddress, msg, contactEmail, subject, text, attachments);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldRetryWithOnboarding = Boolean(
        configuredFrom
        && configuredFrom !== RESEND_ONBOARDING_FROM
        && isResendSenderError(message)
      );

      if (!shouldRetryWithOnboarding) {
        throw error;
      }

      console.warn("[contact] Custom RESEND_FROM is not verified yet, retrying with onboarding sender.");
      await sendWithResend(resend, RESEND_ONBOARDING_FROM, msg, contactEmail, subject, text, attachments);
    }

    return;
  }

  // 2) Fallback to SMTP / nodemailer
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    throw new ContactDeliveryNotConfiguredError();
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // U některých poskytovatelů (např. Brevo) je přihlašovací login jiný než
  // odesílací adresa. SMTP_FROM nechá nastavit ověřeného odesílatele zvlášť.
  const fromAddress = process.env.SMTP_FROM?.trim() || user;

  await transporter.sendMail({
    from: `"Mika Auto Web" <${fromAddress}>`,
    ...(msg.email ? { replyTo: msg.email } : {}),
    to: contactEmail,
    subject,
    text,
    ...(attachments.length ? { attachments } : {}),
  });
}

export async function POST(request: Request) {
  let stored = false;

  try {
    const isMultipart = (request.headers.get("content-type") || "")
      .toLowerCase()
      .includes("multipart/form-data");

    let body: Record<string, unknown>;
    let attachments: ContactAttachment[] = [];

    if (isMultipart) {
      const formData = await request.formData();
      body = Object.fromEntries(
        ["name", "email", "phone", "message", "source"].map((key) => [key, formData.get(key)])
      );
      attachments = await readAttachments(formData);
    } else {
      body = await request.json();
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();
    const source = String(body.source ?? "contact").trim();

    if (!name || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Provide at least an email or phone number" },
        { status: 400 }
      );
    }

    // Basic email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const contactMessage: ContactMessage = {
      name,
      phone,
      message,
      source,
      date: new Date().toISOString(),
      ...(email ? { email } : {}),
    };

    // Save the message when storage is available and continue with email delivery.
    stored = await saveMessage(contactMessage);
    await sendEmail(contactMessage, attachments);

    return NextResponse.json({ success: true, stored, attachments: attachments.length });
  } catch (error) {
    if (error instanceof AttachmentTooLargeError) {
      return NextResponse.json(
        {
          error: "Fotografie jsou příliš velké. Zkuste jich prosím poslat méně.",
          code: "ATTACHMENTS_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    if (error instanceof ContactDeliveryNotConfiguredError) {
      console.error("[contact] Email delivery is not configured.", { stored });
      return NextResponse.json(
        {
          error: "Contact form delivery is not configured.",
          code: "CONTACT_DELIVERY_NOT_CONFIGURED",
          stored,
        },
        { status: 503 }
      );
    }

    console.error("[contact] Error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error", detail },
      { status: 500 }
    );
  }
}
