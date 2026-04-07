/**
 * Upload Service — File Storage with Multer
 *
 * TODO: Configure multer with:
 *
 * 1. diskStorage — save files to UPLOAD_DIR
 *    - Generate safe filenames: timestamp-randomhex.ext
 *    - Never use the original filename (security risk!)
 *
 * 2. fileFilter — only allow image/jpeg, image/png, image/webp
 *
 * 3. limits — max file size 5MB
 *
 * 4. getFileUrl() — return the public URL path for a filename
 */
import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// TODO: Configure multer storage, fileFilter, and limits
export const upload = multer({
  dest: UPLOAD_DIR, // Replace with diskStorage for custom filenames
});

export function getFileUrl(filename: string): string {
  // TODO: Return the public URL path
  return `/uploads/${filename}`;
}
