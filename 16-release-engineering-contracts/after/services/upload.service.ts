/**
 * Upload Service — File Storage with Multer
 *
 * KEY CONCEPT: Never trust filenames from clients. A user could upload
 * "../../etc/passwd" as a filename. We generate our own safe names using
 * timestamps + random strings, and only allow specific file extensions.
 */
import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// KEY CONCEPT: Custom storage gives you control over the destination
// and filename. The default (memoryStorage) keeps files in RAM — fine
// for tiny files, dangerous for large ones (OOM crash).
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate a safe, unique filename: timestamp-randomhex.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

// KEY CONCEPT: fileFilter runs BEFORE the file is saved. If you reject
// it here, no disk space is wasted. Always validate MIME type — don't
// rely on file extension alone (it can be faked).
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
