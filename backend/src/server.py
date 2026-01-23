from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import pytesseract
import numpy as np
from PIL import Image
import io
import re
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

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
        def _log(event: str, **fields: Any) -> None:
            payload = {"ts": datetime.now().isoformat(), "event": event}
            payload.update(fields)
            print(json.dumps(payload, ensure_ascii=False))

        def _looks_like_noise(line_l: str) -> bool:
            if not line_l:
                return True
            if "http" in line_l or "www" in line_l:
                return True
            if "thank" in line_l:
                return True
            if re.search(r"\b(trans|transaction)\b", line_l):
                return True
            if re.search(r"\b\d{2}[:\.]\d{2}\b", line_l):
                return True
            if re.search(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", line_l):
                return True
            return False

        def _normalize_money_token(tok: str) -> str:
            t = tok.strip()
            t = t.replace(",", ".")
            t = re.sub(r"[^0-9\.OSIlB]", "", t)

            def _fix_char(m: re.Match) -> str:
                c = m.group(0)
                return {"O": "0", "S": "5", "I": "1", "l": "1", "B": "8"}.get(c, c)

            t = re.sub(r"[OSIlB]", _fix_char, t)
            t = re.sub(r"\.(?=\d$)", ".0", t)
            return t

        def _parse_money_from_str(s: str) -> Optional[float]:
            s = s.strip()
            if not s:
                return None

            s = _normalize_money_token(s)

            m = re.search(r"(\d{1,4}\.\d{2})", s)
            if m:
                try:
                    return float(m.group(1))
                except:
                    return None

            m = re.search(r"(\d{1,4})\s+(\d{2})", s)
            if m:
                try:
                    return float(f"{m.group(1)}.{m.group(2)}")
                except:
                    return None

            m = re.search(r"\.?(\d{2})$", s)
            if m and s.startswith("."):
                try:
                    return float(f"0.{m.group(1)}")
                except:
                    return None
            return None

        def _extract_money_at_end(line: str) -> Tuple[Optional[float], Optional[str]]:
            raw = line.strip()
            m = re.search(
                r"([\$£€]?\s*(?:[0-9OSIlB]{1,5}[\.,\s][0-9OSIlB]{2}|\.[0-9OSIlB]{2}))\s*$",
                raw,
            )
            if not m:
                return None, None
            tok = m.group(1)
            val = _parse_money_from_str(tok)
            return val, tok

        def _is_money_only(line: str) -> bool:
            v = _parse_money_from_str(line)
            if v is None:
                return False
            rest = re.sub(r"[0-9\s\.,\$£€OSIlB]", "", line)
            return rest.strip() == ""

        def _clean_item_name(name: str) -> str:
            n = name.strip()
            n = re.sub(r"\s+", " ", n)
            n = re.sub(r"^[^A-Za-z]+", "", n)
            n = re.sub(r"[^A-Za-z0-9\s\-]", "", n)
            n = n.strip()
            if re.search(r"\b(subtotal|tax|total|balance|amount\s+due|due)\b", n.lower()):
                return ""
            if not re.search(r"[A-Za-z]", n):
                return ""
            return n

        raw_lines = [ln.rstrip() for ln in text.replace("\r", "\n").split("\n")]
        lines = []
        for ln in raw_lines:
            s = ln.strip()
            if not s:
                continue
            s = re.sub(r"\s+", " ", s)
            lines.append(s)

        _log("ocr_text", raw_text=text, line_count=len(lines))

        totals_keywords = [
            "subtotal",
            "sub total",
            "tax",
            "tex",
            "tip",
            "gratuity",
            "total paid",
            "totalpaid",
            "total",
            "amount due",
            "due",
        ]
        excluded_total_keywords = [
            "balance",
            "account",
            "meal",
            "plan",
        ]

        candidate_total_idxs: List[int] = []
        for idx, ln in enumerate(lines):
            l = ln.lower()
            if not any(k in l for k in totals_keywords):
                continue
            v1, _ = _extract_money_at_end(ln)
            nxt = lines[idx + 1] if idx + 1 < len(lines) else None
            if v1 is not None or (nxt and _is_money_only(nxt)):
                candidate_total_idxs.append(idx)

        totals_start = min(candidate_total_idxs) if candidate_total_idxs else len(lines)
        totals_start = max(0, totals_start)
        item_end = totals_start

        items: List[Dict[str, Any]] = []
        item_candidates: List[Dict[str, Any]] = []

        pending_name: Optional[str] = None

        for idx in range(0, item_end):
            ln = lines[idx]
            l = ln.lower()

            if _looks_like_noise(l):
                _log("line_reject", kind="noise", line=ln, idx=idx)
                continue

            if _is_money_only(ln):
                if pending_name:
                    v = _parse_money_from_str(ln)
                    if v is not None:
                        item_candidates.append({"name": pending_name, "price": float(round(v, 2)), "quantity": 1, "raw_price": ln})
                        _log("item_accept", mode="next_line_price", name=pending_name, price=float(round(v, 2)), idx=idx)
                        pending_name = None
                        continue
                _log("line_reject", kind="money_only_no_pending", line=ln, idx=idx)
                continue

            price, price_tok = _extract_money_at_end(ln)
            if price is not None:
                name_part = ln[: len(ln) - len(price_tok)].strip()
                name_part = re.sub(r"^\d+\s*", "", name_part)
                clean_name = _clean_item_name(name_part)
                if not clean_name:
                    _log("line_reject", kind="bad_name_with_price", line=ln, idx=idx)
                    continue
                if any(x in l for x in ["subtotal", "sub total", "tax", "tex", "total", "amount due", "balance"]):
                    _log("line_reject", kind="total_line_as_item", line=ln, idx=idx)
                    continue
                if price <= 0 or price >= 500:
                    _log("line_reject", kind="bad_price_range", line=ln, idx=idx, price=price)
                    continue
                item_candidates.append({"name": clean_name, "price": float(round(price, 2)), "quantity": 1, "raw_price": price_tok})
                _log("item_accept", mode="same_line_price", name=clean_name, price=float(round(price, 2)), idx=idx)
                pending_name = None
                continue

            clean_name = _clean_item_name(ln)
            if clean_name:
                pending_name = clean_name
                _log("line_hold", kind="pending_item_name", line=ln, idx=idx)
            else:
                _log("line_reject", kind="no_price_no_name", line=ln, idx=idx)

        totals_found: Dict[str, float] = {"subtotal": 0.0, "tax": 0.0, "tip": 0.0, "total": 0.0}
        totals_source: Dict[str, str] = {"subtotal": "", "tax": "", "tip": "", "total": ""}

        def _label_matches(label: str, line_l: str) -> bool:
            if label == "tax":
                return bool(re.search(r"\b(tax|tex)\b", line_l))
            if label == "subtotal":
                return bool(re.search(r"\bsub\s*tot[a-z0-9]*\b", line_l))
            if label == "tip":
                return bool(re.search(r"\b(tip|gratuity)\b", line_l))
            if label == "total":
                return bool(re.search(r"\btotal\b", line_l))
            return label in line_l

        def _try_label_value(label: str, ln: str, nxt: Optional[str]) -> Optional[float]:
            l = ln.lower()
            if not _label_matches(label, l):
                return None
            v1, _ = _extract_money_at_end(ln)
            if v1 is not None:
                return v1
            if nxt and _is_money_only(nxt):
                return _parse_money_from_str(nxt)
            return None

        for idx in range(totals_start, len(lines)):
            ln = lines[idx]
            l = ln.lower()
            nxt: Optional[str] = lines[idx + 1] if idx + 1 < len(lines) else None

            if any(k in l for k in excluded_total_keywords):
                _log("totals_skip", reason="excluded_keyword", line=ln, idx=idx)
                continue

            v = _try_label_value("subtotal", ln, nxt)
            if v is not None:
                totals_found["subtotal"] = float(round(v, 2))
                totals_source["subtotal"] = ln
                _log("totals_pick", label="subtotal", value=totals_found["subtotal"], idx=idx, line=ln)
                continue

            v = _try_label_value("tax", ln, nxt)
            if v is not None:
                totals_found["tax"] = float(round(v, 2))
                totals_source["tax"] = ln
                _log("totals_pick", label="tax", value=totals_found["tax"], idx=idx, line=ln)
                continue

            v = _try_label_value("tip", ln, nxt)
            if v is not None:
                totals_found["tip"] = float(round(v, 2))
                totals_source["tip"] = ln
                _log("totals_pick", label="tip", value=totals_found["tip"], idx=idx, line=ln)
                continue

            if "totalpaid" in l or "total paid" in l:
                v1, _ = _extract_money_at_end(ln)
                if v1 is None and nxt and _is_money_only(nxt):
                    v1 = _parse_money_from_str(nxt)
                if v1 is not None:
                    totals_found["total"] = float(round(v1, 2))
                    totals_source["total"] = ln
                    _log("totals_pick", label="total", value=totals_found["total"], idx=idx, line=ln)
                    continue

            if _label_matches("total", l):
                v1, _ = _extract_money_at_end(ln)
                if v1 is None and nxt and _is_money_only(nxt):
                    v1 = _parse_money_from_str(nxt)
                if v1 is not None and totals_found["total"] == 0.0:
                    totals_found["total"] = float(round(v1, 2))
                    totals_source["total"] = ln
                    _log("totals_pick", label="total", value=totals_found["total"], idx=idx, line=ln)
                    continue

        for it in item_candidates:
            items.append({
                "id": str(uuid.uuid4()),
                "name": it["name"],
                "price": float(round(it["price"], 2)),
                "quantity": int(it.get("quantity", 1)),
            })

        items_sum = float(round(sum(float(i["price"]) for i in items), 2))
        subtotal = totals_found["subtotal"] if totals_found["subtotal"] > 0 else items_sum
        tax = totals_found["tax"]
        tip = totals_found["tip"]
        total = totals_found["total"]

        if totals_found["subtotal"] > 0 and items_sum > 0:
            diff = float(round(totals_found["subtotal"] - items_sum, 2))
            if abs(diff) > 0.5 and len(items) >= 1:
                low_items = [i for i, it in enumerate(item_candidates) if float(it["price"]) < 1.0 and str(it.get("raw_price", "")).strip().startswith(".")]
                if len(low_items) == 1:
                    j = low_items[0]
                    others = float(round(items_sum - float(item_candidates[j]["price"]), 2))
                    candidate_price = float(round(totals_found["subtotal"] - others, 2))
                    if 1.0 <= candidate_price <= 200.0:
                        items[j]["price"] = candidate_price
                        items_sum = float(round(sum(float(i["price"]) for i in items), 2))
                        _log("item_price_adjust", idx=j, new_price=candidate_price, reason="subtotal_alignment")

        if totals_found["subtotal"] > 0:
            subtotal = totals_found["subtotal"]
        else:
            subtotal = items_sum

        if total == 0.0 and subtotal > 0:
            total = float(round(subtotal + tax + tip, 2))
            _log("total_infer", total=total, reason="subtotal_tax_tip")

        if totals_found["subtotal"] > 0 and totals_found["total"] > 0:
            expected = float(round(subtotal + tax + tip, 2))
            if abs(expected - totals_found["total"]) > 0.5:
                implied_tax = float(round(totals_found["total"] - subtotal - tip, 2))
                if 0 <= implied_tax <= max(0.01, float(round(subtotal * 0.3, 2))):
                    _log(
                        "tax_adjust",
                        old_tax=tax,
                        new_tax=implied_tax,
                        reason="subtotal_total_implied",
                        subtotal=subtotal,
                        total=totals_found["total"],
                    )
                    tax = implied_tax
                else:
                    _log(
                        "consistency_warn",
                        kind="subtotal_tax_tip_mismatch",
                        subtotal=subtotal,
                        tax=tax,
                        tip=tip,
                        total=totals_found["total"],
                        expected=expected,
                    )

        _log("parse_result", items_count=len(items), items_sum=items_sum, subtotal=subtotal, tax=tax, tip=tip, total=total)

        result = {
            "id": str(uuid.uuid4()),
            "items": items,
            "subtotal": subtotal,
            "tax": tax,
            "tip": tip,
            "total": total,
            "created_at": datetime.now().isoformat(),
            "raw_text": text
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