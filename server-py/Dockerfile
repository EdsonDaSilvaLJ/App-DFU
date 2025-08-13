# Dockerfile - VERSÃO ULTRA SIMPLES
FROM python:3.10-slim

# ⭐ SÓ O ESSENCIAL (sem git, wget, dev packages)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

# ⭐ COPIAR REQUIREMENTS E INSTALAR
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p models-ia

ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT