# Dockerfile - VERSÃO CORRIGIDA
FROM python:3.10-slim

# ⭐ DEPENDÊNCIAS SISTEMA + OPENCV/YOLO
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ⭐ INSTALAR PYTORCH CPU PRIMEIRO
RUN pip install --no-cache-dir --upgrade pip
RUN pip install torch==2.1.0+cpu torchvision==0.16.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# ⭐ INSTALAR TENSORFLOW CPU
RUN pip install tensorflow-cpu==2.15.0

# ⭐ INSTALAR ULTRALYTICS/YOLO
RUN pip install ultralytics==8.0.196

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p models

# ⭐ CONFIGURAR VARIÁVEIS DE AMBIENTE PARA HEADLESS
ENV DISPLAY=:99
ENV QT_QPA_PLATFORM=offscreen

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT