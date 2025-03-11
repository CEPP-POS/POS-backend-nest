import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrinterService {
  private async printOnWindows(tempFile: string): Promise<void> {
    await execAsync(`notepad /p "${tempFile}"`);
  }

  private async printOnLinux(tempFile: string): Promise<void> {
    // Using lp command which is part of CUPS
    await execAsync(`lp "${tempFile}"`);
  }

  async printText(text: string): Promise<void> {
    try {
      const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.txt`);

      // Create a temporary text file to print
      await fs.promises.writeFile(tempFile, text);

      try {
        const platform = os.platform();
        if (platform === 'win32') {
          await this.printOnWindows(tempFile);
        } else if (platform === 'linux') {
          await this.printOnLinux(tempFile);
        } else {
          throw new Error(`Unsupported platform: ${platform}`);
        }
        console.log('Print job sent successfully');
      } finally {
        // Clean up the temporary file
        await fs.promises.unlink(tempFile);
      }
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }
}
