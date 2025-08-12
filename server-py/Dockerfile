# Dockerfile - TESTE SEM YOLO
FROM python:3.10-slim

RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir fastapi==0.104.1 uvicorn[standard]==0.24.0 python-multipart==0.0.6
RUN pip install --no-cache-dir numpy==1.24.3 pillow==10.1.0
RUN pip install --no-cache-dir opencv-python-headless==4.8.1.78
RUN pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir tensorflow-cpu==2.15.0
RUN pip install --no-cache-dir aiofiles==23.2.1 pydantic==2.5.0 requests==2.31.0

COPY . .
RUN mkdir -p models-ia

ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT