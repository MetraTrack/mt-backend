import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { S3StorageService } from '../../common/s3/s3-storage.service';
import { LoggingService } from '../../common/logging/logging.service';

export interface ProcessedImage {
  photoId: string;
  buffer: Buffer;
  mimeType: 'image/jpeg';
}

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

@Injectable()
export class FoodImageService {
  private readonly maxSizeBytes: number;
  private readonly maxWidth: number;
  private readonly jpegQuality: number;

  constructor(
    private readonly s3: S3StorageService,
    private readonly logger: LoggingService,
  ) {
    this.maxSizeBytes = parseInt(process.env.FOOD_PHOTO_MAX_SIZE_BYTES || '10485760', 10); // 10 MB
    this.maxWidth = parseInt(process.env.FOOD_PHOTO_MAX_WIDTH || '1280', 10);
    this.jpegQuality = parseInt(process.env.FOOD_PHOTO_JPEG_QUALITY || '85', 10);
  }

  async processAndUpload(file: Express.Multer.File): Promise<ProcessedImage> {
    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(`Photo exceeds the maximum allowed size of ${this.maxSizeBytes} bytes.`);
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException('Unable to read image metadata. Make sure the file is a valid image.');
    }

    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException(
        `Unsupported image format: ${metadata.format ?? 'unknown'}. Allowed: JPEG, PNG, WebP.`,
      );
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Unable to determine image dimensions.');
    }

    // Resize to maxWidth if needed, preserving aspect ratio
    let image = sharp(file.buffer);
    if (metadata.width > this.maxWidth) {
      image = image.resize(this.maxWidth, undefined, { fit: 'inside', withoutEnlargement: true });
    }

    let jpegBuffer: Buffer;
    try {
      jpegBuffer = await image.jpeg({ quality: this.jpegQuality }).toBuffer();
    } catch (error) {
      this.logger.error('Image processing failed', error);
      throw new InternalServerErrorException('Image processing failed.');
    }

    const photoId = uuidv4();
    const s3Key = `food-photos/${photoId}.jpg`;

    await this.s3.uploadFile({
      key: s3Key,
      body: jpegBuffer,
      contentType: 'image/jpeg',
      metadata: { originalName: file.originalname },
    });

    this.logger.info('Food photo uploaded to S3', { photoId, s3Key, size: jpegBuffer.length });

    return { photoId, buffer: jpegBuffer, mimeType: 'image/jpeg' };
  }
}