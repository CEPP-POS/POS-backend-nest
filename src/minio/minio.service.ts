// // src/minio/minio.service.ts

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Client as MinioClient } from 'minio';

// @Injectable()
// export class MinioService {
//   private minioClient: MinioClient;
//   private readonly bucketName: string;

//   constructor(private configService: ConfigService) {
//     this.minioClient = new MinioClient({
//       endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
//       port: parseInt(this.configService.get<string>('MINIO_PORT'), 10),
//       useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
//       accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
//       secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
//     });

//     this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME');
//   }

//   // Method to upload an image to MinIO
//   async uploadImage(file: Express.Multer.File): Promise<string> {
//     const fileName = `${Date.now()}_${file.originalname}`;
//     await this.minioClient.putObject(this.bucketName, fileName, file.buffer);
//     return fileName; // Return the uploaded file name
//   }

//   // Method to generate a pre-signed URL for a file
//   async getFileUrl(fileName: string): Promise<string> {
//     try {
//       const fileUrl = await this.minioClient.presignedUrl(
//         'GET',             // HTTP method (GET for reading)
//         this.bucketName,   // Bucket name
//         fileName,          // File name
//         24 * 60 * 60       // Expiration time (24 hours)
//       );
//       return fileUrl; // Return the pre-signed URL
//     } catch (error) {
//       console.error('Error generating pre-signed URL:', error);
//       throw new Error('Failed to generate file URL');
//     }
//   }
// }
