# Use a lightweight python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data needed for preprocessing
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# Copy project files
COPY . .

# Create outputs and models directory (ensure permissions)
RUN mkdir -p outputs models/abstractive models/extractive && chmod -R 777 outputs models

# Expose port
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["sh", "-c", "uvicorn backend.api:app --host 0.0.0.0 --port ${PORT}"]
