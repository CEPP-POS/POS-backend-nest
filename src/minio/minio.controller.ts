// src/minio/minio.controller.ts

import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio.service';

@Controller('image')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  // Endpoint to upload an image
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'image' is the form-data key
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<string> {
    return this.minioService.uploadImage(file);
  }

  // Endpoint to get the pre-signed URL for an image
  @Get('url/:fileName')
  async getImageUrl(@Param('fileName') fileName: string): Promise<string> {
    return this.minioService.getFileUrl(fileName); // Return the pre-signed URL
  }
}
