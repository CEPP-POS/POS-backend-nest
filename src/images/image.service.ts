import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './image.entity';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ImageService {
  private s3: S3Client;
  private bucketName = process.env.MINIO_BUCKET_NAME;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {
    this.s3 = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<Image> {
    const params = {
      Bucket: this.bucketName,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(params));

    const fileUrl = `${process.env.MINIO_ENDPOINT}/${this.bucketName}/${file.originalname}`;

    const image = this.imageRepository.create({
      filename: file.originalname,
      url: fileUrl,
    });
    return this.imageRepository.save(image);
  }

  async getAllImages(): Promise<Image[]> {
    return this.imageRepository.find();
  }
}
