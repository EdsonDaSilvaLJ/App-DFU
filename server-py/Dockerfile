# Dockerfile - VERSÃO OTIMIZADA PARA RAILWAY
FROM python:3.10-slim

# Instala dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    libgl1-mesa-dev \
    libglib2.0-0 \
    libgomp1 \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Atualiza pip
RUN pip install --no-cache-dir --upgrade pip

# Instala dependências básicas primeiro
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    python-multipart==0.0.6

# Instala dependências de processamento de imagem
RUN pip install --no-cache-dir \
    pillow==10.1.0 \
    numpy==1.24.3 \
    opencv-python-headless==4.8.1.78

# Instala PyTorch CPU (mais leve)
RUN pip install --no-cache-dir \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Instala TensorFlow CPU
RUN pip install --no-cache-dir tensorflow-cpu==2.15.0

# Instala outras dependências
RUN pip install --no-cache-dir \
    aiofiles==23.2.1 \
    pydantic==2.5.0 \
    requests==2.31.0 \
    gdown==4.7.1 \
    matplotlib==3.7.2 \
    scipy==1.11.3

# Instala YOLOv5 usando torch.hub (mais confiável)
RUN python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)"

# Copia os arquivos da aplicação
COPY . .

# Cria diretório para modelos
RUN mkdir -p models

# Configurações de ambiente
ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/tmp/.torch

# Exposição da porta
EXPOSE $PORT

# Comando de inicialização
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT