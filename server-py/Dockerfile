FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/tmp/.torch
ENV DISPLAY=:99

# Instala dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Atualiza pip e instala PyTorch primeiro (melhora o cache)
# PyTorch raramente muda, então esta camada será reutilizada na maioria das vezes
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu \
       --index-url https://download.pytorch.org/whl/cpu

# Copia e instala as dependências da aplicação
# Se requirements.txt mudar, apenas esta camada será reconstruída
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Cria diretório para modelos (se não existir)
RUN mkdir -p models

# Expõe a porta
EXPOSE 8000

# Inicia a API
CMD ["uvicorn", "api_ia:app", "--host", "0.0.0.0", "--port", "8000"]