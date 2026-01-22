from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import pytesseract
import numpy as np
from PIL import Image
import io
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any

app = FastAPI(title="Evenly OCR API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_receipt_data(image_bytes: bytes) -> Dict[str, Any]:
    """Extract text and parse receipt data from image using your OCR code"""
    try:
        # Debug: check if we received data
        print(f"Received {len(image_bytes)} bytes")
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        print(f"Created numpy array with shape: {nparr.shape}")
        
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image - img is None")
            
        print(f"Decoded image shape: {img.shape}")
        
        # Enhanced OCR preprocessing for better text clarity
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize for better OCR (scale up more for clarity)
        height, width = gray.shape
        new_width = int(width * 2.5)  # Increased scaling
        new_height = int(height * 2.5)
        gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Apply denoising and sharpening
        gray = cv2.medianBlur(gray, 3)
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        gray = cv2.filter2D(gray, -1, kernel)
        
        # Multiple preprocessing methods for better results
        processed_images = []
        
        # Method 1: Bilateral filter + Otsu
        bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
        otsu = cv2.threshold(bilateral, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        processed_images.append(otsu)
        
        # Method 2: Adaptive threshold
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        processed_images.append(adaptive)
        
        # Method 3: Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        enhanced_otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        processed_images.append(enhanced_otsu)
        
        # Try OCR with multiple configurations and pick the best result
        all_texts = []
        configs = [
            r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.$%& ',
            r'--oem 3 --psm 4 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.$%& ',
            r'--oem 3 --psm 11 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.$%& '
        ]
        
        for processed_img in processed_images:
            for config in configs:
                try:
                    text = pytesseract.image_to_string(processed_img, config=config)
                    all_texts.append(text.strip())
                except:
                    continue
        
        # Combine results - use the text with the most item-like content
        best_text = ""
        max_items = 0
        
        for text in all_texts:
            if not text:
                continue
            item_count = len(re.findall(r'\d+\.\d{2}\s*$', text, re.MULTILINE))
            if item_count > max_items:
                max_items = item_count
                best_text = text
        
        text = best_text if best_text else all_texts[0] if all_texts else ""
        print(f"OCR extracted text: {text[:500]}...")
        print(f"Full OCR text lines:")
        for i, line in enumerate(text.strip().split('\n')):
            print(f"  {i}: '{line}'")
        
        # Parse receipt items from OCR text
        items = []
        subtotal = 0.0
        
        lines = text.strip().split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if not line or len(line) < 3:
                i += 1
                continue
                
            # Skip common non-item lines - more aggressive filtering
            skip_keywords = [
                'total', 'tax', 'subtotal', 'cash', 'credit', 'debit',
                'change', 'thank', 'receipt', 'restaurant', 'menu', 'order',
                'server', 'table', 'date', 'time', 'phone', 'address', 'www',
                'com', 'inc', 'ltd', 'corp', 'gst', 'hst', 'vat', 'tip',
                'payment', 'method', 'card', 'visa', 'mastercard', 'amex',
                'amount', 'due', 'grand', 'sve', 'sum', 'invoice',
                'bill', 'check', 'account', 'transaction', 'sale', 'purchase',
                'svc', 'trans', 'plan', 'jesta', 'pizza', 'staff', 'housing',
                'dining', 'university', 'texas', 'austin', 'kiosk', 'closed',
                'thankyou', 'stopping', 'today', 'hookem', 'horns',
                'item', 'items', 'quantity', 'qty', 'price', 'each', 'total'
            ]
            
            # Skip lines that look like totals/summaries - but be more careful
            if any(keyword in line.lower() for keyword in skip_keywords):
                print(f"Skipping keyword line: '{line}'")
                i += 1
                continue
            
            # Only skip very short lines that are clearly totals
            if len(line.split()) == 1 and re.search(r'\d+\.\d{2}\s*$', line):
                print(f"Skipping obvious total line: '{line}'")
                i += 1
                continue
            
            # NEW: Handle broken formatting - look for quantity lines followed by price lines
            if re.match(r'^\d+\s+\w+', line):  # Line starts with number and has text
                # Check if next line has a price
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    price_match = re.search(r'(\d+\.\d{2})', next_line)
                    if price_match:
                        price = float(price_match.group(1))
                        
                        # Only include reasonable prices
                        if 0.5 <= price <= 200:
                            # Extract item name from current line
                            name = re.sub(r'^\d+\s+', '', line)  # Remove leading number
                            name = re.sub(r'[^\w\s\-]', '', name)   # Remove special chars
                            name = name.strip()
                            
                            if len(name) >= 2:
                                items.append({
                                    "id": str(uuid.uuid4()),
                                    "name": name,
                                    "price": price,
                                    "quantity": 1
                                })
                                subtotal += price
                                print(f"Found item (broken format): '{name}' - ${price}")
                                i += 2  # Skip both lines
                                continue
            
            # Original logic for normal formatting
            # Look for price patterns at the end of line
            price_match = re.search(r'(\d+\.\d{2})\s*$', line)
            if not price_match:
                # Try to find price with currency symbol
                price_match = re.search(r'[\$£€]\s*(\d+\.\d{2})\s*$', line)
            if not price_match:
                # Try to find price patterns like "6.3" (single decimal)
                price_match = re.search(r'(\d+\.\d{1,2})\s*$', line)
            
            if price_match:
                price = float(price_match.group(1))
                
                # Only include reasonable prices (between $0.50 and $200)
                if price < 0.5 or price > 200:
                    print(f"Skipping unreasonable price: ${price} in line: '{line}'")
                    i += 1
                    continue
                
                # Extract item name (everything before price)
                name_part = line[:price_match.start()].strip()
                
                # Clean up the name - more aggressive cleaning
                name = re.sub(r'^\d+\s*', '', name_part)  # Remove leading numbers
                name = re.sub(r'\s*\d+$', '', name)     # Remove trailing numbers
                name = re.sub(r'[^\w\s\-]', '', name)   # Remove special chars except hyphens
                name = name.strip()
                
                # More lenient name validation
                if len(name) >= 2 and (any(c.isalpha() for c in name) or len(name) >= 3):
                    items.append({
                        "id": str(uuid.uuid4()),
                        "name": name,
                        "price": price,
                        "quantity": 1
                    })
                    subtotal += price
                    print(f"Found item: '{name}' - ${price}")
                else:
                    print(f"Skipping line with invalid name: '{name}' from line: '{line}'")
            else:
                # Debug: show lines that don't match price patterns
                if len(line) > 5:  # Only show potentially interesting lines
                    print(f"No price found in: '{line}'")
            
            i += 1
        
        print(f"Total items found: {len(items)}")
        print(f"Items: {[item['name'] + ' $' + str(item['price']) for item in items]}")
        
        # Calculate tax and total from the OCR text
        tax = 0.0
        total = 0.0
        
        # Look for tax with multiple patterns
        tax_patterns = [
            r'tax.*?[\$£€]?\s*(\d+\.\d{2})',
            r'gst.*?[\$£€]?\s*(\d+\.\d{2})',
            r'hst.*?[\$£€]?\s*(\d+\.\d{2})',
            r'vat.*?[\$£€]?\s*(\d+\.\d{2})',
            r'sales\s+tax.*?[\$£€]?\s*(\d+\.\d{2})'
        ]
        
        for pattern in tax_patterns:
            tax_match = re.search(pattern, text, re.IGNORECASE)
            if tax_match:
                tax = float(tax_match.group(1))
                print(f"Found tax: ${tax}")
                break
        
        # Look for total with multiple patterns - prioritize TotalPaid, use SVC only as fallback
        total_patterns = [
            r'total\s+paid.*?(\d+\.\d{2})',  
            r'total.*?(\d+\.\d{2})',
            r'amount.*?(\d+\.\d{2})',
            r'balance.*?(\d+\.\d{2})',
            r'due.*?(\d+\.\d{2})',
            r'grand\s+total.*?(\d+\.\d{2})'
        ]
        
        # First try to find TotalPaid or other total patterns
        for pattern in total_patterns:
            total_match = re.search(pattern, text, re.IGNORECASE)
            if total_match:
                total = float(total_match.group(1))
                print(f"Found total: ${total} using pattern: {pattern}")
                break
        
        # Only use SVC as fallback if no total was found
        if total == 0:
            svc_match = re.search(r'svc.*?(\d+\.\d{2})', text, re.IGNORECASE)
            if svc_match:
                total = float(svc_match.group(1))
                print(f"Using SVC as fallback total: ${total}")
        
        # Also try Balance as last resort
        if total == 0:
            balance_match = re.search(r'balance.*?(\d+\.\d{2})', text, re.IGNORECASE)
            if balance_match:
                total = float(balance_match.group(1))
                print(f"Using Balance as fallback total: ${total}")
        
        # NEW RULE: If we have tax but no total, calculate total as subtotal + tax
        if total == 0 and tax > 0 and subtotal > 0:
            total = subtotal + tax
            print(f"Calculated total as subtotal + tax: ${subtotal} + ${tax} = ${total}")
        # If we have tax but total is wrong (equal to subtotal), recalculate
        elif total > 0 and tax > 0 and abs(total - subtotal) < 0.01:
            total = subtotal + tax
            print(f"Total was equal to subtotal, recalculated as: ${subtotal} + ${tax} = ${total}")
        
        # If no tax found, calculate it proportionally
        if tax == 0 and subtotal > 0:
            # Common tax rates (you can adjust these)
            tax_rates = [0.08, 0.0825, 0.09, 0.095, 0.1, 0.12, 0.13]
            
            for rate in tax_rates:
                calculated_tax = subtotal * rate
                # Check if this tax rate makes the total match
                if abs((subtotal + calculated_tax) - total) < 0.01:
                    tax = calculated_tax
                    print(f"Calculated tax at {rate*100}%: ${tax}")
                    break
            
            # If still no tax found, use default 8.25%
            if tax == 0:
                tax = subtotal * 0.0825
                print(f"Using default tax rate: ${tax}")
        
        # If no total found, calculate it
        if total == 0:
            total = subtotal + tax
            print(f"Calculated total: ${total}")
        
        # Validate the totals with smart logic
        if total < subtotal:
            print(f"Warning: Total (${total}) is less than subtotal (${subtotal})")
            # Recalculate total
            total = subtotal + tax
        # NEW: Validate total is reasonable compared to subtotal
        elif subtotal > 0 and total > 0:
            # If total is more than 10x subtotal, it's probably wrong (like Balance amount)
            if total > subtotal * 10:
                print(f"Warning: Total (${total}) is way too high compared to subtotal (${subtotal})")
                total = subtotal + tax
                print(f"Using calculated total instead: ${total}")
            # If total is very close to subtotal but we have tax, recalculate
            elif tax > 0 and abs(total - subtotal) < 1.0:
                total = subtotal + tax
                print(f"Total was too close to subtotal, recalculated as: ${subtotal} + ${tax} = ${total}")
            # If total seems reasonable but doesn't match subtotal + tax, still use calculated total
            elif tax > 0 and abs(total - (subtotal + tax)) > 0.5:
                calculated_total = subtotal + tax
                print(f"Total (${total}) doesn't match calculated total (${calculated_total}), using calculated")
                total = calculated_total
        # NEW: Handle case where no items found but we have tax and a suspicious total
        elif subtotal == 0 and tax > 0 and total > 0:
            # If total is very high (like balance amount) but we have tax, it's probably wrong
            if total > 50:  # Arbitrary threshold for suspiciously high totals
                print(f"Warning: No items found but total (${total}) is very high with tax (${tax})")
                # Try to find a more reasonable total from the text
                reasonable_totals = []
                for line in text.strip().split('\n'):
                    # Look for smaller amounts that could be the real total
                    small_match = re.search(r'(\d+\.\d{2})', line)
                    if small_match:
                        amount = float(small_match.group(1))
                        if 5 <= amount <= 50:  # Reasonable receipt total range
                            reasonable_totals.append(amount)
                
                if reasonable_totals:
                    # Use the largest reasonable amount (likely the real total)
                    reasonable_total = max(reasonable_totals)
                    print(f"Found reasonable total: ${reasonable_total}")
                    total = reasonable_total
                else:
                    # Fallback: just use tax as a minimal total
                    total = tax
                    print(f"No reasonable total found, using tax as total: ${total}")
        
        print(f"Final breakdown: Subtotal: ${subtotal}, Tax: ${tax}, Total: ${total}")
        
        result = {
            "id": str(uuid.uuid4()),
            "items": items,
            "subtotal": subtotal,
            "tax": tax,
            "tip": 0.0,
            "total": total,
            "created_at": datetime.now().isoformat(),
            "raw_text": text  # Include raw OCR text for debugging
        }
        
        print(f"OCR result: {result}")
        return result
        
    except Exception as e:
        print(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    """Upload and process receipt image using OCR"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_bytes = await file.read()
    receipt_data = extract_receipt_data(image_bytes)
    
    return receipt_data

@app.get("/")
async def root():
    return {"message": "Evenly OCR API is running", "status": "ready"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working", "timestamp": datetime.now().isoformat()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "ocr_available": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="debug")