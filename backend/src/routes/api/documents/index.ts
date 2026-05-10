import { Router } from 'express';
import multer from 'multer';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { ApiError, asyncHandler } from '../../../middleware/api-error-handler.js';
import {
  MAX_DOCUMENT_BYTES,
  createDocument,
  deleteDocument,
  getDocumentForOwner,
  listDocuments,
} from '../../../services/documents.js';
import { storage } from '../../../lib/storage.js';
import { syncLocalUserFromClerk } from '../../../services/users.js';

export const documentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES },
});

const resolveStringParam = (value: unknown): string => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
};

documentsRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    response.json({ documents: await listDocuments(user.id) });
  }),
);

documentsRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const file = request.file;

    if (!file) {
      throw new ApiError({
        code: 'document_file_missing',
        message: 'A file upload is required under the "file" field.',
        statusCode: 400,
      });
    }

    const document = await createDocument({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      userId: user.id,
    });

    response.status(201).json({ document });
  }),
);

documentsRouter.delete(
  '/:documentId',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const documentId = resolveStringParam(request.params.documentId);
    await deleteDocument({ documentId, userId: user.id });
    response.status(204).end();
  }),
);

documentsRouter.get(
  '/:documentId/raw',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const documentId = resolveStringParam(request.params.documentId);
    const document = await getDocumentForOwner({ documentId, userId: user.id });

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.originalName.replace(/"/g, '')}"`,
    );
    storage.createReadStream(document.storageKey).pipe(response);
  }),
);
