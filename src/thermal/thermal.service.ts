import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as canvas from 'canvas';
import { print } from 'pdf-to-printer';

@Injectable()
export class ThermalService {
  private readonly PAPER_WIDTH = 384; // 48mm = 384px at 203dpi
  private readonly shopName = 'ร้านอาหารตัวอย่าง';

  constructor() {
    // ลงทะเบียนฟอนต์ไทย
    canvas.registerFont(
      path.join(process.cwd(), 'src', 'thermal', 'fonts', 'THSarabunNew.ttf'),
      {
        family: 'THSarabun',
      },
    );
  }

  async generateAndPrint(items: Array<{ name: string; price: number }>) {
    try {
      // สร้างเนื้อหาใบเสร็จ
      const content = this.generateReceiptContent(items);

      // สร้างรูปภาพจาก content
      const imageBuffer = await this.createReceiptImage(content);

      // บันทึกไฟล์
      const outputFile = path.join(
        __dirname,
        'receipts',
        `thermal_receipt_${Date.now()}.png`,
      );

      // สร้างโฟลเดอร์ถ้ายังไม่มี
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(outputFile, imageBuffer);
      console.log('ใบเสร็จถูกบันทึกที่:', outputFile);

      // สั่งพิมพ์
      await print(outputFile, {
        printer: 'POS-58',
        scale: 'fit',
      });

      return {
        message: 'พิมพ์ใบเสร็จสำเร็จ',
        receiptPath: outputFile,
      };
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสร้างใบเสร็จ:', error);
      throw error;
    }
  }

  private generateReceiptContent(
    items: Array<{ name: string; price: number }>,
  ) {
    const content = [];

    // หัวใบเสร็จ
    content.push({
      text: this.shopName,
      align: 'center',
      bold: true,
      size: 16,
    });

    content.push({
      text: new Date().toLocaleString('th-TH'),
      align: 'center',
      size: 12,
    });

    content.push({
      text: '--------------------------------',
      align: 'center',
    });

    // รายการสินค้า
    items.forEach((item) => {
      content.push({
        text: `${item.name}`,
        align: 'left',
        size: 12,
      });
      content.push({
        text: `${item.price.toFixed(2)} บาท`,
        align: 'right',
        size: 12,
      });
    });

    content.push({
      text: '--------------------------------',
      align: 'center',
    });

    // ยอดรวม
    const total = items.reduce((sum, item) => sum + item.price, 0);
    content.push({
      text: `รวมทั้งสิ้น: ${total.toFixed(2)} บาท`,
      align: 'right',
      bold: true,
      size: 14,
    });

    return content;
  }

  private async createReceiptImage(content: any[]) {
    // คำนวณความสูงของใบเสร็จ
    const lineHeight = 30;
    const height = content.length * lineHeight;

    // สร้าง canvas
    const cnv = canvas.createCanvas(this.PAPER_WIDTH, height);
    const ctx = cnv.getContext('2d');

    // พื้นหลังสีขาว
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.PAPER_WIDTH, height);

    // วาดข้อความ
    ctx.fillStyle = 'black';
    content.forEach((item, index) => {
      ctx.font = `${item.bold ? 'bold ' : ''}${item.size || 12}px THSarabun`;
      ctx.textAlign = item.align || 'left';

      let x = 10;
      if (item.align === 'center') x = this.PAPER_WIDTH / 2;
      if (item.align === 'right') x = this.PAPER_WIDTH - 10;

      ctx.fillText(item.text, x, (index + 1) * lineHeight);
    });

    return cnv.toBuffer('image/png');
  }
}
