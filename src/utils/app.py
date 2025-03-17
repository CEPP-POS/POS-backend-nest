import os
import platform
from PIL import Image
import tempfile

# Windows-specific import
if platform.system() == "Windows":
    import win32print

# Linux-specific import
elif platform.system() == "Linux":
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
            # Windows printing using win32print
            printer_name = win32print.GetDefaultPrinter()
            printer_handle = win32print.OpenPrinter(printer_name)
            try:
                job_info = win32print.StartDocPrinter(printer_handle, 1, ("Image", None, "RAW"))
                try:
                    win32print.StartPagePrinter(printer_handle)
                    
                    # Initialize printer
                    init_commands = bytes([0x1B, 0x40])  # ESC @ - Initialize printer
                    win32print.WritePrinter(printer_handle, init_commands)

                    # Convert image to bytes
                    pixels = list(image.getdata())
                    width, height = image.size
                    bytes_per_line = (width + 7) // 8
                    raster_mode = bytes([0x1D, 0x76, 0x30, 0x00])
                    header = raster_mode + bytes([bytes_per_line & 0xFF, bytes_per_line >> 8, height & 0xFF, height >> 8])
                    win32print.WritePrinter(printer_handle, header)

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
                    
                    win32print.WritePrinter(printer_handle, bytes(bytes_data))

                    # Feed and cut paper
                    end_commands = bytes([0x1B, 0x64, 0x05])  # Feed 5 lines
                    win32print.WritePrinter(printer_handle, end_commands)

                    win32print.EndPagePrinter(printer_handle)
                finally:
                    win32print.EndDocPrinter(printer_handle)
            finally:
                win32print.ClosePrinter(printer_handle)

            print(f"Successfully sent {image_path} to printer {printer_name}")

        elif system_name == "Linux":
            # Linux printing using CUPS
            conn = cups.Connection()
            printers = conn.getPrinters()
            if not printers:
                print("No printers found!")
                return
            
            printer_name = list(printers.keys())[0]  # Select first available printer
            
            # Save processed image to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_image:
                image.save(temp_image.name, format="PNG")
                temp_filename = temp_image.name
            
            # Print using CUPS
            conn.printFile(printer_name, temp_filename, "Image Print", {})

            # Remove temporary file
            os.remove(temp_filename)

            print(f"Successfully sent {image_path} to printer {printer_name}")

    except Exception as e:
        print(f"Error printing image: {str(e)}")

if __name__ == "__main__":
    print_image("receipt.png")
