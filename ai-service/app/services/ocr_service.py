import fitz  # PyMuPDF
import easyocr
import numpy as np
from PIL import Image
import io
from app.config import settings

class OCRService:
    def __init__(self, languages: list[str]):
        # Load EasyOCR models on class initialization (reusable memory instance)
        self.reader = easyocr.Reader(languages, gpu=False)

    def extract_text(self, file_path: str) -> str:
        """
        Processes images and PDFs dynamically to extract textual representations.
        """
        if file_path.lower().endswith(".pdf"):
            return self._extract_from_pdf(file_path)
        else:
            return self._extract_from_image(file_path)

    def _extract_from_image(self, file_path: str) -> str:
        """
        Runs EasyOCR directly on an image file path.
        """
        results = self.reader.readtext(file_path, detail=0)
        return "\n".join(results)

    def _extract_from_pdf(self, file_path: str) -> str:
        """
        Attempts direct digital text extraction. If page text density is low,
        renders the page to a high-DPI image and extracts text using EasyOCR.
        """
        doc = fitz.open(file_path)
        extracted_pages = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            # Attempt to extract digital text (very fast)
            page_text = page.get_text().strip()

            # If characters extracted is less than 20, we assume it is a scanned document
            if len(page_text) < 20:
                # Render page at 2.0x zoom (144 DPI) for OCR clarity
                pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
                img_bytes = pix.tobytes("png")
                
                # Load rendered page into memory as NumPy array
                img = Image.open(io.BytesIO(img_bytes))
                img_np = np.array(img)
                
                # Perform neural OCR
                ocr_results = self.reader.readtext(img_np, detail=0)
                page_text = "\n".join(ocr_results)

            extracted_pages.append(page_text)

        doc.close()
        return "\n".join(extracted_pages)

# Instantiated OCR Singleton
ocr_service = OCRService(languages=settings.OCR_LANGUAGES)
