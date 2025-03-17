from PIL import Image, ImageDraw, ImageFont
import json
import sys
import os
from typing import List, Dict, Any

def create_receipt_image(data: Dict[str, Any]) -> str:
    print("Debug: Starting create_receipt_image")
    
    # Get absolute path for receipts folder
    current_dir = os.path.dirname(os.path.abspath(__file__))
    receipts_dir = os.path.join(current_dir, '..', '..', 'receipts')
    
    # Create receipts directory if it doesn't exist
    if not os.path.exists(receipts_dir):
        print(f"Debug: Creating receipts directory at {receipts_dir}")
        os.makedirs(receipts_dir)

    # Calculate dynamic height
    width = 400  # Fixed width
    base_height = 206  # Space for headers, queue number, and footer
    line_height = 26   # Height per order item
    detail_height = 16  # Additional height per extra detail
    
    # Calculate required height
    item_count = len(data['order'])
    extra_details = sum(1 for item in data['order'] if len(item) > 3)  # Count items with additional details
    content_height = item_count * line_height + extra_details * 3 * detail_height  # Assuming 3 extra details per item

    total_height = base_height + content_height
    
    # Create image with dynamic height
    image = Image.new('RGB', (width, total_height), 'white')
    draw = ImageDraw.Draw(image)
    
    try:
        # Load fonts
        font_path = os.path.join(current_dir, "tahoma.ttf")
        font_path_bold = os.path.join(current_dir, "tahomabd.ttf")
        print(f"Debug: Loading font from {font_path}")
        font = ImageFont.truetype(font_path, 18)
        small_font = ImageFont.truetype(font_path_bold, 18)
        normal_font = ImageFont.truetype(font_path, 18)
        detail_font = ImageFont.truetype(font_path, 16)
        queue_font = ImageFont.truetype(font_path_bold, 26)
    except Exception as e:
        print(f"Debug: Font loading failed - {str(e)}")
        # Use default font if custom font fails
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
        detail_font = ImageFont.load_default()
        queue_font = ImageFont.load_default()

    # Draw store name
    print(f"Debug: Drawing store info - {data['store_name']}")
    draw.text((width//2, 15), data['store_name'], font=font, fill='black', anchor='mm')

    # Draw queue number
    draw.text((width//2, 35), f"** คิวที่ {data['queue_number']} **", font=queue_font, fill='black', anchor='mm')

    # Draw order ID
    draw.text((width//2, 55), f"Order ID: {data['order_id']}", font=normal_font, fill='black', anchor='mm')

    # Draw separator line
    y_pos = 70
    draw.line([(0, y_pos), (width, y_pos)], fill='black', width=1)

    # Draw headers
    y_pos += 15
    draw.text((0, y_pos), "รายการสั่งซื้อ", font=small_font, fill='black', anchor='lm')
    draw.text((width-272, y_pos), "ราคาต่อหน่วย", font=small_font, fill='black', anchor='lm')
    draw.text((width-95, y_pos), "จำนวน", font=small_font, fill='black', anchor='rm')
    draw.text((width, y_pos), "ราคารวม", font=small_font, fill='black', anchor='rm')

    # Draw order items
    print("Debug: Drawing order items")
    y_pos += 20
    for item in data['order']:
        quantity, name, unit_price = item[:3]
        total = quantity * unit_price
        
        # Draw main item details
        draw.text((0, y_pos), name, font=font, fill='black', anchor='lm')
        draw.text((width-205, y_pos), f"{unit_price:.2f} ฿", font=font, fill='black', anchor='lm')
        draw.text((width-95, y_pos), f"x {quantity}", font=font, fill='black', anchor='rm')
        draw.text((width, y_pos), f"{total:.2f} ฿", font=font, fill='black', anchor='rm')
        # Draw additional details
        if len(item) > 3:
            if item[3]:  # Type
                y_pos += detail_height
                draw.text((20, y_pos), f"ประเภท: {item[3]}", font=detail_font, fill='black', anchor='lm')
                
            if len(item) > 4 and item[4]:  # Sweetness
                y_pos += detail_height
                draw.text((20, y_pos), f"ความหวาน: {item[4]}", font=detail_font, fill='black', anchor='lm')
                
            if len(item) > 5 and item[5]:  # Size
                y_pos += detail_height
                draw.text((20, y_pos), f"ขนาด: {item[5]}", font=detail_font, fill='black', anchor='lm')
                
            if len(item) > 6 and item[6] and item[6] != "-":  # Toppings
                y_pos += detail_height
                draw.text((20, y_pos), f"เพิ่มเติม: {item[6]}", font=detail_font, fill='black', anchor='lm')

        y_pos += line_height

    # Draw separator line
    y_pos += 5
    draw.line([(0, y_pos), (width, y_pos)], fill='black', width=1)

    # Calculate total
    y_pos += 20
    total = sum(item[0] * item[2] for item in data['order'])
    draw.text((width-110, y_pos), "ยอดรวม", font=font, fill='black', anchor='rm')
    draw.text((width-15, y_pos), f"{total:.2f} ฿", font=font, fill='black', anchor='rm')

    # Draw thank you message
    y_pos += 30
    draw.text((width//2, y_pos), "ขอบคุณที่ใช้บริการค่ะ", font=font, fill='black', anchor='mm')

    # Save the image
    output_path = os.path.join(receipts_dir, 'receipt.png')
    print(f"Debug: Saving image to {output_path}")
    image.save(output_path)
    return output_path

def transform_order_to_receipt_data(order_data: Dict[str, Any]) -> Dict[str, Any]:
    print("Debug: Starting transform_order_to_receipt_data")
    print(f"Debug: Input data - {json.dumps(order_data, indent=2)}")
    
    receipt_data = {
        "store_name": order_data["branch_name"],
        "order_id": order_data["order_id"],
        "queue_number": order_data["queue_number"],
        "order": []
    }
    
    for item in order_data["order_item"]:
        toppings = [topping["ingredient_name"] for topping in item["orderItem"]]
        toppings_str = ", ".join(toppings) if toppings else "-"
        
        # Create order line with price per unit (not total price)
        price_per_unit = round(float(item["price"]) / item["quantity"], 2)
        
        order_line = [
            item["quantity"],
            item["menu"]["menu_name"],
            price_per_unit,
            item["menuType"]["type_name"],
            item["sweetnessLevel"]["level_name"],
            item["size"]["size_name"].upper(),
            toppings_str
        ]
        receipt_data["order"].append(order_line)
    
    print(f"Debug: Transformed data - {json.dumps(receipt_data, indent=2)}")
    return receipt_data

if __name__ == "__main__":
    print("Debug: Script started")
    # Get order data from command line argument
    if len(sys.argv) > 1:
        print(f"Debug: Received argument length: {len(sys.argv[1])}")
        try:
            order_data = json.loads(sys.argv[1])
            print("Debug: Successfully parsed JSON input")
            receipt_data = transform_order_to_receipt_data(order_data)
            image_path = create_receipt_image(receipt_data)
            print(image_path)  # Return path to Node.js
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Error: No input data provided", file=sys.stderr)
        sys.exit(1)