FROM python:3.10-slim

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /app

# Copia requirements primeiro (para cache do Docker)
COPY requirements.txt .

# Instala dependências Python
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Cria diretório para modelos
RUN mkdir -p /app/models

# Copia o código da aplicação
COPY . .

# Expõe a porta
EXPOSE $PORT

# Comando para iniciar a aplicação
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT