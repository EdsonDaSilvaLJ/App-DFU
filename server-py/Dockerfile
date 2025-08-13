# Dockerfile - VERSÃO SEM DEPENDÊNCIAS SISTEMA
FROM python:3.10-slim

WORKDIR /app

# ⭐ UPGRADE PIP
RUN pip install --no-cache-dir --upgrade pip

# ⭐ COPIAR E INSTALAR REQUIREMENTS
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ⭐ COPIAR CÓDIGO
COPY . .

# ⭐ CRIAR PASTA MODELS
RUN mkdir -p models-ia

# ⭐ VARIÁVEIS DE AMBIENTE
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99
ENV QT_QPA_PLATFORM=offscreen

EXPOSE $PORT
CMD uvicorn api_ia:app --host 0.0.0.0 --port $PORT