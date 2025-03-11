import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrinterService {
  async printText(text: string): Promise<void> {
    try {
      const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.txt`);

      // Create a temporary text file to print
      await fs.promises.writeFile(tempFile, text);

      try {
        // Use notepad's print command for Windows
        await execAsync(`notepad /p "${tempFile}"`);
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
