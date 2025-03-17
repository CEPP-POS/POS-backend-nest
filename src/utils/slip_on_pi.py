import os
import platform
from PIL import Image
import tempfile

if platform.system() == "Linux":
    import cups

def print_image(image_path):
    try:
        # Open the image
        image = Image.open(image_path)
        
        # Convert the image to monochrome (1-bit)
        image = image.convert('1')
        
        # Resize image if needed (adjust width according to your printer's specs)
        MAX_WIDTH = 384  # Standard width for many thermal printers
        if image.size[0] > MAX_WIDTH:
            ratio = MAX_WIDTH / float(image.size[0])
            height = int(float(image.size[1]) * ratio)
            image = image.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)

        system_name = platform.system()

        if system_name == "Windows":
            # Windows printing using win32print (unchanged)
            pass

        elif system_name == "Linux":
            # Directly send ESC/POS commands to the printer
            printer_device = "/dev/usb/lp0"  # Check with `ls /dev/usb/`
            if not os.path.exists(printer_device):
                raise Exception("Printer device not found at /dev/usb/lp0. Check `ls /dev/usb/`.")

            with open(printer_device, "wb") as printer:
                # Initialize printer
                printer.write(bytes([0x1B, 0x40]))  # ESC @

                # Convert image to bytes
                pixels = list(image.getdata())
                width, height = image.size
                bytes_per_line = (width + 7) // 8
                raster_mode = bytes([0x1D, 0x76, 0x30, 0x00])
                header = raster_mode + bytes([bytes_per_line & 0xFF, bytes_per_line >> 8, height & 0xFF, height >> 8])
                printer.write(header)

                # Convert to byte data
                bytes_data = bytearray()
                for y in range(height):
                    for x in range(0, width, 8):
                        byte = 0
                        for bit in range(8):
                            if x + bit < width:
                                if pixels[y * width + x + bit] == 0:
                                    byte |= (1 << (7 - bit))
                        bytes_data.append(byte)
                
                printer.write(bytes(bytes_data))

                # Feed and cut paper
                printer.write(bytes([0x1B, 0x64, 0x05]))  # Feed 5 lines

            print(f"Successfully sent {image_path} to printer at {printer_device}")

    except Exception as e:
        print(f"Error printing image: {str(e)}")

if __name__ == "__main__":
    print_image("receipt.png")

