# Dockerfile - VERSÃO PARA RAILWAY
FROM python:3.10-slim

# ⭐ DEPENDÊNCIAS MÍNIMAS PARA YOLO + OPENCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ⭐ INSTALAR DEPENDÊNCIAS PYTHON
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# ⭐ COPIAR CÓDIGO
COPY . .

# ⭐ CRIAR PASTA MODELS
RUN mkdir -p models-ia

# ⭐ CONFIGURAR AMBIENTE HEADLESS
ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT