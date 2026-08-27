FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for PyMuPDF / OpenCV / PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Warm up EasyOCR cache by importing and instantiating the model
# so it doesn't cause a delay on the first user upload request.
RUN python -c "import easyocr; reader = easyocr.Reader(['en'], gpu=False)"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
