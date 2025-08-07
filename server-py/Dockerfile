FROM python:3.10-slim

# Dependências sistema
RUN apt-get update && apt-get install -y \
    gcc g++ make curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ⭐ INSTALAR PYTORCH CPU PRIMEIRO (mais estável)
RUN pip install --no-cache-dir --upgrade pip
RUN pip install torch==2.1.0+cpu torchvision==0.16.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# ⭐ INSTALAR TENSORFLOW CPU
RUN pip install tensorflow-cpu==2.15.0


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p models

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT