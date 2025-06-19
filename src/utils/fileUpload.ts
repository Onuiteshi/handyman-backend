import { Request } from 'express';
import multer, { FileFilterCallback, diskStorage, Options as MulterOptions } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  user?: {
    id: string;
    role: string;
  };
}

// Configure storage
const storage = diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.') as any;
    error.status = 400;
    cb(error);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
} as MulterOptions);

export default upload;
