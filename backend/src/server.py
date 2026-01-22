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
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Your existing OCR preprocessing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        # OCR
        text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 6")
        
        # Parse receipt items from OCR text
        items = []
        subtotal = 0.0
        
        lines = text.strip().split('\n')
        for line in lines:
            # Look for price patterns (e.g., "12.99", "$12.99")
            price_match = re.search(r'\$?(\d+\.\d{2})', line)
            if price_match:
                price = float(price_match.group(1))
                # Extract item name (everything before price)
                name = line[:price_match.start()].strip()
                if name and price > 0 and not any(keyword in line.lower() for keyword in ['total', 'tax', 'subtotal']):
                    items.append({
                        "id": str(uuid.uuid4()),
                        "name": name,
                        "price": price,
                        "quantity": 1
                    })
                    subtotal += price
        
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
        
        return {
            "id": str(uuid.uuid4()),
            "items": items,
            "subtotal": subtotal,
            "tax": tax,
            "tip": 0.0,
            "total": total,
            "created_at": datetime.now().isoformat(),
            "raw_text": text  # Include raw OCR text for debugging
        }
    except Exception as e:
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "ocr_available": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)