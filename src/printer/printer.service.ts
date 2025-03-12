import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { createCanvas, registerFont } from 'canvas';

const execAsync = promisify(exec);

@Injectable()
export class PrinterService {
  private readonly PAPER_WIDTH = 384; // 48mm = 384px at 203dpi
  private readonly LINE_HEIGHT = 24;
  private readonly MARGIN = 10;

  constructor() {
    // Register fonts (ต้องติดตั้งฟอนต์ในระบบก่อน)
    try {
      registerFont('path/to/THSarabunNew.ttf', { family: 'THSarabun' });
    } catch (error) {
      console.warn('Warning: Could not register font:', error);
    }
  }

  private createReceiptImage(
    content: {
      text: string;
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: number;
    }[],
  ): Buffer {
    // คำนวณความสูงของใบเสร็จ
    const height = content.length * this.LINE_HEIGHT + this.MARGIN * 2;

    // สร้าง canvas
    const canvas = createCanvas(this.PAPER_WIDTH, height);
    const ctx = canvas.getContext('2d');

    // เซ็ตพื้นหลังเป็นสีขาว
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.PAPER_WIDTH, height);

    // เซ็ตสีข้อความเป็นสีดำ
    ctx.fillStyle = 'black';

    // วาดข้อความแต่ละบรรทัด
    content.forEach((item, index) => {
      // เซ็ตฟอนต์
      const fontSize = item.size || 16;
      ctx.font = `${item.bold ? 'bold' : ''} ${fontSize}px 'THSarabun'`;

      // คำนวณตำแหน่ง Y
      const y = this.MARGIN + (index + 1) * this.LINE_HEIGHT;

      // วัดความกว้างข้อความ
      const textWidth = ctx.measureText(item.text).width;

      // คำนวณตำแหน่ง X ตาม alignment
      let x;
      switch (item.align) {
        case 'right':
          x = this.PAPER_WIDTH - textWidth - this.MARGIN;
          break;
        case 'center':
          x = (this.PAPER_WIDTH - textWidth) / 2;
          break;
        default: // left
          x = this.MARGIN;
      }

      // วาดข้อความ
      ctx.fillText(item.text, x, y);
    });

    // แปลง canvas เป็น buffer
    return canvas.toBuffer('image/png');
  }

  async print(
    content: {
      text: string;
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: number;
    }[],
  ): Promise<void> {
    try {
      // สร้างรูปภาพจาก content
      const imageBuffer = this.createReceiptImage(content);

      // บันทึกไฟล์
      const outputFile = path.join(
        __dirname,
        'output',
        `receipt_${Date.now()}.png`,
      );
      const dir = path.dirname(outputFile);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(outputFile, imageBuffer);
      console.log('Receipt image saved at:', outputFile);

      // สั่งพิมพ์
      if (os.platform() === 'win32') {
        await execAsync(`mspaint /p "${outputFile}"`);
      } else {
        await execAsync(`lp "${outputFile}"`);
      }
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }
}
