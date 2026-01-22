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
        
        # Enhanced OCR preprocessing with multiple techniques
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize for better OCR (scale up)
        height, width = gray.shape
        new_width = int(width * 2)
        new_height = int(height * 2)
        gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Apply multiple preprocessing techniques
        processed_images = []
        
        # Method 1: Bilateral filter + Otsu
        bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
        otsu = cv2.threshold(bilateral, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        processed_images.append(otsu)
        
        # Method 2: Adaptive threshold
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        processed_images.append(adaptive)
        
        # Method 3: Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
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
        print(f"OCR extracted text: {text[:200]}...")
        print(f"Found {max_items} potential items")
        
        # Parse receipt items from OCR text
        items = []
        subtotal = 0.0
        
        lines = text.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
                
            # Skip common non-item lines
            skip_keywords = [
                'total', 'tax', 'subtotal', 'balance', 'cash', 'credit', 'debit',
                'change', 'thank', 'receipt', 'restaurant', 'menu', 'order',
                'server', 'table', 'date', 'time', 'phone', 'address', 'www',
                'com', 'inc', 'ltd', 'corp', 'gst', 'hst', 'vat', 'tip',
                'payment', 'method', 'card', 'visa', 'mastercard', 'amex'
            ]
            
            if any(keyword in line.lower() for keyword in skip_keywords):
                continue
            
            # Look for price patterns at the end of line (more precise)
            price_match = re.search(r'(\d+\.\d{2})\s*$', line)
            if not price_match:
                # Try to find price with currency symbol
                price_match = re.search(r'[\$£€]\s*(\d+\.\d{2})\s*$', line)
            
            if price_match:
                price = float(price_match.group(1))
                
                # Only include reasonable prices (between $0.50 and $200)
                if price < 0.5 or price > 200:
                    continue
                
                # Extract item name (everything before price)
                name_part = line[:price_match.start()].strip()
                
                # Clean up the name - remove common patterns
                name = re.sub(r'^\d+\s*', '', name_part)  # Remove leading numbers
                name = re.sub(r'\s*\d+$', '', name)     # Remove trailing numbers
                name = re.sub(r'[^\w\s\-]', '', name)   # Remove special chars except hyphens
                name = name.strip()
                
                # Ensure name has reasonable length and contains letters
                if len(name) >= 2 and any(c.isalpha() for c in name):
                    items.append({
                        "id": str(uuid.uuid4()),
                        "name": name,
                        "price": price,
                        "quantity": 1
                    })
                    subtotal += price
                    print(f"Found item: {name} - ${price}")
        
        print(f"Total items found: {len(items)}")
        print(f"Items: {[item['name'] + ' $' + str(item['price']) for item in items]}")
        
        # Calculate tax (look for tax line or use default 8.25%)
        tax_match = re.search(r'tax.*?\$?(\d+\.\d{2})', text, re.IGNORECASE)
        if tax_match:
            tax = float(tax_match.group(1))
        else:
            tax = subtotal * 0.0825
        
        # Look for total
        total_match = re.search(r'total.*?\$?(\d+\.\d{2})', text, re.IGNORECASE)
        if total_match:
            total = float(total_match.group(1))
        else:
            total = subtotal + tax
        
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