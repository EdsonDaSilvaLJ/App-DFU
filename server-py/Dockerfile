# Dockerfile - VERSÃO STEP BY STEP
FROM python:3.10-slim

# Sistema
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pip upgrade
RUN pip install --no-cache-dir --upgrade pip

# FastAPI e básicos
RUN pip install --no-cache-dir fastapi==0.104.1 uvicorn[standard]==0.24.0 python-multipart==0.0.6

# Numpy e Pillow
RUN pip install --no-cache-dir numpy==1.24.3 pillow==10.1.0

# OpenCV
RUN pip install --no-cache-dir opencv-python-headless==4.8.1.78

# PyTorch CPU
RUN pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu --index-url https://download.pytorch.org/whl/cpu

# TensorFlow CPU
RUN pip install --no-cache-dir tensorflow-cpu==2.15.0

# Outras dependências
RUN pip install --no-cache-dir aiofiles==23.2.1 pydantic==2.5.0 requests==2.31.0 scipy==1.11.3 matplotlib==3.7.2

# YOLOv5
RUN pip install --no-cache-dir git+https://github.com/ultralytics/yolov5.git

COPY . .
RUN mkdir -p models-ia

ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT