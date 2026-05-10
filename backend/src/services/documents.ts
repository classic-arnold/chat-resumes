import type { Document } from '@prisma/client';

import { ApiError } from '../middleware/api-error-handler.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { storage } from '../lib/storage.js';

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_EXTRACTED_CHARS_PER_DOC = 50_000;
export const MAX_EXTRACTED_CHARS_TOTAL = 200_000;

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
]);

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type DocumentSummary = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: Document['status'];
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapDocumentSummary = (document: Document): DocumentSummary => {
  return {
    id: document.id,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    error: document.error,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
};

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
};

const collapseWhitespace = (value: string) => {
  return value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
};

const extractTextFromBuffer = async ({
  buffer,
  mimeType,
}: {
  buffer: Buffer;
  mimeType: string;
}): Promise<string> => {
  if (mimeType === PDF_MIME) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return collapseWhitespace(result.text ?? '');
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  if (mimeType === DOCX_MIME) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return collapseWhitespace(result.value ?? '');
  }

  // text/plain or markdown
  return collapseWhitespace(buffer.toString('utf8'));
};

export const listDocuments = async (userId: string): Promise<DocumentSummary[]> => {
  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return documents.map(mapDocumentSummary);
};

export const createDocument = async ({
  buffer,
  mimeType,
  originalName,
  userId,
}: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  userId: string;
}): Promise<DocumentSummary> => {
  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    throw new ApiError({
      code: 'document_unsupported_type',
      message: 'Only PDF, DOCX, plain text, and markdown files are supported.',
      statusCode: 415,
    });
  }

  if (buffer.length === 0) {
    throw new ApiError({
      code: 'document_empty',
      message: 'The uploaded file is empty.',
      statusCode: 400,
    });
  }

  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new ApiError({
      code: 'document_too_large',
      message: 'Files must be 10 MB or smaller.',
      statusCode: 413,
    });
  }

  const { storageKey } = await storage.put({ buffer, originalName, userId });

  const document = await prisma.document.create({
    data: {
      mimeType,
      originalName: originalName.slice(0, 240),
      sizeBytes: buffer.length,
      status: 'processing',
      storageKey,
      userId,
    },
  });

  try {
    const extractedText = truncate(
      await extractTextFromBuffer({ buffer, mimeType }),
      MAX_EXTRACTED_CHARS_PER_DOC,
    );

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        extractedText,
        error: null,
        status: 'ready',
      },
    });
    return mapDocumentSummary(updated);
  } catch (error) {
    logger.error('document.parse_failed', {
      documentId: document.id,
      error: error instanceof Error ? error.message : String(error),
      mimeType,
    });
    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        error: error instanceof Error ? error.message.slice(0, 240) : 'Parse failed',
        status: 'failed',
      },
    });
    return mapDocumentSummary(updated);
  }
};

export const deleteDocument = async ({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}): Promise<void> => {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new ApiError({
      code: 'document_not_found',
      message: 'Document not found.',
      statusCode: 404,
    });
  }

  await storage.remove(document.storageKey).catch((error: unknown) => {
    logger.warn('document.storage_remove_failed', {
      documentId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  await prisma.document.delete({ where: { id: document.id } });
};

export const getDocumentForOwner = async ({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}) => {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new ApiError({
      code: 'document_not_found',
      message: 'Document not found.',
      statusCode: 404,
    });
  }

  return document;
};

export const buildDocumentContextForUser = async (userId: string): Promise<string> => {
  const documents = await prisma.document.findMany({
    where: { userId, status: 'ready' },
    orderBy: { createdAt: 'asc' },
    select: {
      originalName: true,
      extractedText: true,
    },
  });

  if (documents.length === 0) {
    return '';
  }

  let totalChars = 0;
  const sections: string[] = [];

  for (const document of documents) {
    if (totalChars >= MAX_EXTRACTED_CHARS_TOTAL) {
      break;
    }
    const remaining = MAX_EXTRACTED_CHARS_TOTAL - totalChars;
    const slice = document.extractedText.slice(0, remaining);
    sections.push(`--- ${document.originalName} ---\n${slice}`);
    totalChars += slice.length;
  }

  return sections.join('\n\n');
};
