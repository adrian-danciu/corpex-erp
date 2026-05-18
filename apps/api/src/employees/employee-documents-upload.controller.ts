import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const UPLOAD_DIR = 'uploads/employee-documents';

mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('uploads')
export class EmployeeDocumentsUploadController {
  @Post('employee-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${randomUUID()}-${safeBase}`);
        },
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          cb(new BadRequestException('Invalid file type'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadEmployeeDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      url: `/uploads/employee-documents/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      mime: file.mimetype,
    };
  }
}
