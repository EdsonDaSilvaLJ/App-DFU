# Dockerfile - VERSÃO CORRIGIDA PARA RAILWAY
FROM python:3.10-slim

# Instala apenas dependências essenciais + git para ultralytics
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libglib2.0-dev \
    git \
    wget \
    libgl1-mesa-glx \
    libgthread-2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Atualiza pip
RUN pip install --no-cache-dir --upgrade pip

# Instala dependências básicas primeiro
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    python-multipart==0.0.6 \
    pillow==10.1.0 \
    numpy==1.24.3

# Instala PyTorch CPU (mais leve)
RUN pip install --no-cache-dir \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Instala TensorFlow CPU
RUN pip install --no-cache-dir tensorflow-cpu==2.15.0

# ADICIONADO: Instala Ultralytics e dependências do YOLO
RUN pip install --no-cache-dir \
    ultralytics==8.0.196 \
    PyYAML>=5.3.1 \
    tqdm>=4.64.0 \
    psutil

# Instala outras dependências
RUN pip install --no-cache-dir \
    aiofiles==23.2.1 \
    pydantic==2.5.0 \
    requests==2.31.0 \
    gdown==4.7.1 \
    matplotlib==3.7.2 \
    scipy==1.11.3

# Pré-carrega modelo YOLOv5 durante o build
RUN python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)" || echo "YOLOv5 pre-load failed, will load at runtime"

# Copia os arquivos da aplicação
COPY . .

# Cria diretório para modelos
RUN mkdir -p models

# Configurações de ambiente
ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/tmp/.torch
ENV YOLO_VERBOSE=False

# Exposição da porta
EXPOSE $PORT

# Comando de inicialização
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT