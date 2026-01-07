import cv2, pytesseract

img = cv2.imread("../test2.jpeg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# increase contrast
gray = cv2.bilateralFilter(gray, 9, 75, 75)
    
# binarize
thresh = cv2.threshold(
    gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
)[1]

text = pytesseract.image_to_string(
    thresh,
    config="--oem 3 --psm 6"
)
print(text)
