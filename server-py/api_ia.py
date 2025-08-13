import os
import torch
import pathlib
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import io
from PIL import Image
import base64
import json
from typing import Dict, List
import sys
import logging
import asyncio
import gdown
from pathlib import Path
import requests
import zipfile
import re

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CONFIGURAR AMBIENTE HEADLESS 
os.environ['DISPLAY'] = ':99'
os.environ['QT_QPA_PLATFORM'] = 'offscreen'
os.environ['YOLO_VERBOSE'] = 'False'

# ========================================
# FIX CRÍTICO PARA DEPLOYMENT - PosixPath
# ========================================
def fix_yolo_deployment():
    """Fix para o erro PosixPath em diferentes sistemas"""
    import pathlib
    
    # Para sistemas que não têm PosixPath
    if not hasattr(pathlib, 'PosixPath'):
        pathlib.PosixPath = pathlib.Path
    
    # Para Windows que não tem PosixPath
    if os.name == 'nt' and hasattr(pathlib, 'WindowsPath'):
        pathlib.PosixPath = pathlib.WindowsPath
    
    logger.info("✅ Fix PosixPath aplicado para deployment")

# Aplica o fix ANTES de qualquer coisa do YOLOv5
fix_yolo_deployment()

app = FastAPI(title="Medical AI Classification API", version="1.0.0")

# Configuração CORS para permitir requests do Node.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variáveis globais para os modelos
modelo_classificacao = None
modelo_yolo = None
LABEL_COLS = ['none', 'infection', 'ischaemia', 'both']

# URLs dos modelos - AGORA USANDO DIRECT DOWNLOAD LINKS
MODELO_CLASSIFICACAO_URL = os.getenv("MODELO_CLASSIFICACAO_URL", "")
MODELO_YOLO_URL = os.getenv("MODELO_YOLO_URL", "")

# Diretório para modelos
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

async def baixar_google_drive_direto(file_id: str, destino: Path, descricao: str):
    """Estratégia melhorada para download do Google Drive"""
    
    # URLs de download direto do Google Drive
    urls_download = [
        f"https://drive.google.com/uc?export=download&id={file_id}",
        f"https://drive.google.com/uc?id={file_id}&export=download",
        f"https://drive.usercontent.google.com/download?id={file_id}&export=download"
    ]
    
    for i, url in enumerate(urls_download, 1):
        try:
            logger.info(f"🔄 Tentativa {i}: {url[:60]}...")
            
            session = requests.Session()
            response = session.get(url, stream=True, allow_redirects=True)
            
            # Verifica se há redirecionamento para confirmação
            if "confirm=" in response.url or "virus scan warning" in response.text.lower():
                # Busca token de confirmação
                for line in response.text.split('\n'):
                    if 'confirm=' in line:
                        token_match = re.search(r'confirm=([a-zA-Z0-9_-]+)', line)
                        if token_match:
                            confirm_token = token_match.group(1)
                            confirm_url = f"{url}&confirm={confirm_token}"
                            logger.info(f"🔄 Usando token de confirmação: {confirm_token[:10]}...")
                            response = session.get(confirm_url, stream=True)
                            break
            
            response.raise_for_status()
            
            # Verifica content-type
            content_type = response.headers.get('content-type', '')
            if 'text/html' in content_type and response.text and len(response.text) < 10000:
                logger.warning(f"⚠️ Recebido HTML (provável erro): {len(response.text)} bytes")
                continue
            
            # Salva o arquivo
            with open(destino, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            # Verifica se o arquivo foi baixado corretamente
            if destino.exists() and destino.stat().st_size > 10000:  # Pelo menos 10KB
                logger.info(f"✅ Download bem-sucedido: {destino.stat().st_size} bytes")
                return True
            else:
                logger.warning(f"⚠️ Arquivo muito pequeno: {destino.stat().st_size if destino.exists() else 0} bytes")
                if destino.exists():
                    destino.unlink()
                    
        except Exception as e:
            logger.warning(f"⚠️ Tentativa {i} falhou: {e}")
            if destino.exists():
                destino.unlink()
            continue
    
    return False

async def baixar_arquivo(url: str, destino: Path, descricao: str = "arquivo"):
    """Baixa um arquivo de uma URL com estratégias múltiplas"""
    if not url:
        raise ValueError(f"URL não configurada para {descricao}")
    
    if destino.exists():
        logger.info(f"✅ {descricao} já existe: {destino}")
        return
    
    logger.info(f"📥 Baixando {descricao} de {url}")
    
    try:
        # Extrai ID do Google Drive se necessário
        file_id = None
        if "drive.google.com" in url or "docs.google.com" in url:
            patterns = [
                r'/d/([a-zA-Z0-9-_]+)',
                r'id=([a-zA-Z0-9-_]+)',
                r'/file/d/([a-zA-Z0-9-_]+)'
            ]
            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    file_id = match.group(1)
                    break
        
        success = False
        if file_id:
            success = await baixar_google_drive_direto(file_id, destino, descricao)
        
        if not success:
            # Fallback para download direto
            response = requests.get(url, stream=True, allow_redirects=True)
            response.raise_for_status()
            
            with open(destino, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            if destino.exists() and destino.stat().st_size > 1000:
                success = True
        
        if success:
            logger.info(f"✅ {descricao} baixado com sucesso: {destino}")
        else:
            raise Exception(f"Falha em todas as estratégias de download")
        
    except Exception as e:
        logger.error(f"❌ Erro ao baixar {descricao}: {e}")
        if destino.exists():
            destino.unlink()  # Remove arquivo parcial
        raise

async def carregar_modelo_classificacao():
    """Carrega o modelo de classificação"""
    global modelo_classificacao
    
    if modelo_classificacao is not None:
        return
    
    modelo_path = MODELS_DIR / "modeloClassificacao.h5"
    
    try:
        # Baixa o modelo se necessário
        if MODELO_CLASSIFICACAO_URL:
            await baixar_arquivo(MODELO_CLASSIFICACAO_URL, modelo_path, "modelo de classificação")
        
        if not modelo_path.exists():
            logger.warning("⚠️ Modelo de classificação não encontrado. Usando modelo mockado.")
            # Cria um modelo simples para demonstração
            modelo_classificacao = tf.keras.Sequential([
                tf.keras.layers.Input(shape=(224, 224, 3)),
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dense(len(LABEL_COLS), activation='softmax')
            ])
            logger.info("✅ Modelo de classificação mockado criado")
            return
        
        logger.info("📚 Carregando modelo de classificação...")
        modelo_classificacao = tf.keras.models.load_model(str(modelo_path), compile=False)
        logger.info("✅ Modelo de classificação carregado com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo de classificação: {e}")
        # Fallback para modelo mockad
        modelo_classificacao = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(224, 224, 3)),
            tf.keras.layers.GlobalAveragePooling2D(),
            tf.keras.layers.Dense(len(LABEL_COLS), activation='softmax')
        ])
        logger.info("✅ Usando modelo de classificação mockado como fallback")

async def carregar_modelo_yolo():
    """Carrega o modelo YOLOv5 com estratégias múltiplas"""
    global modelo_yolo
    
    if modelo_yolo is not None:
        return
    
    logger.info("🎯 Iniciando carregamento do modelo YOLO...")
    
    # Lista de estratégias para carregar o YOLO
    estrategias = [
        # 1. Tentar modelo customizado se disponível
        lambda: carregar_yolo_customizado(),
        # 2. Usar YOLOv5s pré-treinado (fallback confiável)
        lambda: carregar_yolo_pretrained('yolov5s'),
        # 3. Usar YOLOv5n (mais leve)
        lambda: carregar_yolo_pretrained('yolov5n'),
        # 4. Último recurso: modelo mockado
        lambda: carregar_yolo_mock()
    ]
    
    for i, estrategia in enumerate(estrategias, 1):
        try:
            logger.info(f"🔄 Tentativa {i}: Carregando modelo YOLO...")
            resultado = estrategia()
            
            # Se a estratégia retorna uma coroutine, aguarda
            if hasattr(resultado, '__await__'):
                modelo_yolo = await resultado
            else:
                modelo_yolo = resultado
            
            if modelo_yolo is not None:
                # Configura parâmetros
                if hasattr(modelo_yolo, 'conf'):
                    modelo_yolo.conf = 0.25
                if hasattr(modelo_yolo, 'iou'):
                    modelo_yolo.iou = 0.45
                
                logger.info(f"✅ Modelo YOLO carregado com sucesso na tentativa {i}!")
                return
                
        except Exception as e:
            logger.warning(f"⚠️ Estratégia {i} falhou: {e}")
            continue
    
    # Se chegou aqui, todas as estratégias falharam
    logger.error("❌ Falha em todas as estratégias de carregamento do YOLO")
    # Cria modelo mockado para não quebrar a API
    modelo_yolo = carregar_yolo_mock()

async def carregar_yolo_customizado():
    """Tenta carregar modelo YOLO customizado"""
    if not MODELO_YOLO_URL:
        raise ValueError("URL do modelo customizado não configurada")
    
    modelo_path = MODELS_DIR / "bestYolov5_test.pt"
    await baixar_arquivo(MODELO_YOLO_URL, modelo_path, "modelo YOLO customizado")
    
    # Múltiplas tentativas de carregamento
    tentativas = [
        lambda: torch.hub.load('ultralytics/yolov5', 'custom', path=str(modelo_path), trust_repo=True),
        lambda: torch.hub.load('ultralytics/yolov5', 'custom', path=str(modelo_path.resolve()), force_reload=True),
        lambda: carregar_yolo_torch_direto(modelo_path)
    ]
    
    for i, tentativa in enumerate(tentativas, 1):
        try:
            logger.info(f"🔧 Tentativa de carregamento customizado {i}/3...")
            return tentativa()
        except Exception as e:
            logger.warning(f"Tentativa de carregamento customizado {i} falhou: {e}")
            continue
    
    raise Exception("Falha em todas as tentativas de carregamento customizado")

def carregar_yolo_pretrained(model_name):
    """Carrega modelo YOLO pré-treinado"""
    logger.info(f"📦 Carregando modelo pré-treinado: {model_name}")
    
    try:
        modelo = torch.hub.load('ultralytics/yolov5', model_name, pretrained=True, trust_repo=True)
        logger.info(f"✅ Modelo {model_name} carregado com sucesso")
        return modelo
    except Exception as e:
        logger.error(f"❌ Erro ao carregar {model_name}: {e}")
        raise

def carregar_yolo_mock():
    """Cria um modelo YOLO mockado para demonstração"""
    logger.warning("🔧 Criando modelo YOLO mockado...")
    
    class YOLOMock:
        def __init__(self):
            self.names = {0: 'object', 1: 'person', 2: 'vehicle'}
            self.conf = 0.25
            self.iou = 0.45
        
        def __call__(self, img):
            # Retorna detecções vazias mas com estrutura correta
            class MockResult:
                def __init__(self):
                    self.xyxy = [torch.tensor([])]
            return MockResult()
    
    return YOLOMock()

def carregar_yolo_torch_direto(modelo_path):
    """Estratégia alternativa: carregamento direto com torch"""
    logger.info("🔧 Tentando carregamento direto com torch...")
    
    checkpoint = torch.load(modelo_path, map_location='cpu')
    
    if 'model' in checkpoint:
        modelo = checkpoint['model'].float()
        modelo.eval()
        
        # Adiciona atributos necessários
        if not hasattr(modelo, 'names'):
            modelo.names = {i: f'class_{i}' for i in range(80)}
        if not hasattr(modelo, 'conf'):
            modelo.conf = 0.25
        if not hasattr(modelo, 'iou'):
            modelo.iou = 0.45
            
        return modelo
    else:
        raise Exception("Checkpoint não contém 'model'")

@app.on_event("startup")
async def startup_event():
    """Carrega os modelos na inicialização"""
    logger.info("🚀 Iniciando API de IA Médica...")
    
    try:
        # Carrega os modelos em paralelo
        results = await asyncio.gather(
            carregar_modelo_classificacao(),
            carregar_modelo_yolo(),
            return_exceptions=True
        )
        
        # Verifica se houve erros
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"❌ Erro ao carregar modelo {i}: {result}")
        
        logger.info("✅ API inicializada com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {e}")
        # API ainda pode funcionar com modelos mockados

def processar_deteccoes_yolo(results):
    """
    Processa os resultados do YOLOv5 e retorna uma lista de dicionários
    de detecções. Este é o formato ideal para o cliente.
    """
    deteccoes = []
    
    try:
        # Verifica se há resultados
        if not hasattr(results, 'xyxy') or len(results.xyxy[0]) == 0:
            return deteccoes
        
        # Pega as detecções
        deteccoes_tensor = results.xyxy[0].cpu().numpy()
        
        for i, (*box, conf, cls) in enumerate(deteccoes_tensor):
            x1, y1, x2, y2 = map(int, box)
            confidence = float(conf)
            class_id = int(cls)
            
            # Pega o nome da classe
            if hasattr(modelo_yolo, 'names') and class_id in modelo_yolo.names:
                class_name = modelo_yolo.names[class_id]
            else:
                class_name = f"class_{class_id}"
            
            deteccoes.append({
                "xmin": x1,
                "ymin": y1, 
                "xmax": x2,
                "ymax": y2,
                "classe": class_name,
                "confianca": confidence
            })
            
    except Exception as e:
        logger.error(f"Erro ao processar detecções: {e}")
        
    return deteccoes

def redimensionar_imagem(img, target_size=640):
    """Redimensiona a imagem mantendo a proporção"""
    w_original, h_original = img.size
    scale = min(target_size / w_original, target_size / h_original)
    
    new_w = int(w_original * scale)
    new_h = int(h_original * scale)
    
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    img_padded = Image.new('RGB', (target_size, target_size), (0, 0, 0))
    
    paste_x = (target_size - new_w) // 2
    paste_y = (target_size - new_h) // 2
    
    img_padded.paste(img_resized, (paste_x, paste_y))
    
    return img_padded, {
        "original_size": {"width": w_original, "height": h_original},
        "resized_size": {"width": new_w, "height": new_h},
        "final_size": {"width": target_size, "height": target_size},
        "padding": {"x": paste_x, "y": paste_y},
        "scale_factor": scale
    }

def image_to_base64(img):
    """Converte PIL Image para base64"""
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=90)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str

@app.get("/")
async def root():
    return {
        "message": "API de IA Médica - Classificação e Detecção",
        "version": "1.0.0",
        "status": "online",
        "endpoints": [
            "/predict/detection",
            "/predict/classification",
            "/health",
            "/models/info"
        ]
    }

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde da API e modelos"""
    return {
        "status": "healthy",
        "models": {
            "classificacao": modelo_classificacao is not None,
            "yolo": modelo_yolo is not None
        },
        "timestamp": None
    }

@app.post("/predict/detection")
async def predict_detection(file: UploadFile = File(...)):
    """
    Endpoint para detecção de objetos.
    Recebe uma imagem e retorna uma lista de detecções (boxes, classes, confianças).
    """
    if modelo_yolo is None:
        raise HTTPException(status_code=503, detail="Modelo YOLO não carregado")
    
    try:
        contents = await file.read()
        img_original = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Redimensiona a imagem para a entrada do modelo, mantendo a proporção
        img_resized, resize_info = redimensionar_imagem(img_original, target_size=640)
        
        # Realiza a predição com o modelo YOLO
        results = modelo_yolo(img_resized)
        
        # Processa os resultados para obter a lista de detecções
        deteccoes = processar_deteccoes_yolo(results)
        
        # Retorna a lista de detecções e as informações de redimensionamento
        return JSONResponse(content={
            "deteccoes": deteccoes,
            "info_redimensionamento": resize_info
        })
    
    except Exception as e:
        logger.error(f"Erro na detecção: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )

@app.post("/predict/classification")
async def predict_classification(
    file: UploadFile = File(...), 
    deteccoes_json: str = Form(...)
):
    """
    Endpoint para classificação de imagens recortadas.
    Recebe a imagem original e um JSON com as bounding boxes detectadas.
    Retorna as classificações para cada box.
    """
    if modelo_classificacao is None:
        raise HTTPException(status_code=503, detail="Modelo de classificação não carregado")
    
    try:
        # Converte o JSON string para uma lista de dicionários
        deteccoes = json.loads(deteccoes_json)
        contents = await file.read()
        img_original = Image.open(io.BytesIO(contents)).convert("RGB")
        
        resultados_finais = []

        if not deteccoes:
            return JSONResponse(content={"resultados": resultados_finais})

        for det in deteccoes:
            xmin = det.get("xmin", 0)
            ymin = det.get("ymin", 0)
            xmax = det.get("xmax", 0)
            ymax = det.get("ymax", 0)
            
            # Recorta a imagem original usando as coordenadas da box
            cropped_img = img_original.crop((xmin, ymin, xmax, ymax))
            
            # Redimensiona a imagem recortada para a entrada do modelo de classificação
            img_resized = cropped_img.resize((224, 224))

            # Converte a imagem para um array e normaliza
            img_array = image.img_to_array(img_resized) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            # Realiza a predição
            pred = modelo_classificacao.predict(img_array, verbose=0)
            index = np.argmax(pred[0])
            classe_predita = LABEL_COLS[index]
            confianca_maxima = float(np.max(pred[0]))
            
            # Adiciona os resultados da classificação à detecção original
            resultados_finais.append({
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "classe_deteccao": det.get("classe"),
                "confianca_deteccao": det.get("confianca"),
                "classe_classificacao": classe_predita,
                "confianca_classificacao": confianca_maxima
            })

        return JSONResponse(content={"resultados": resultados_finais})
    
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {e}")
        raise HTTPException(status_code=400, detail="Formato JSON de detecções inválido.")
    except Exception as e:
        logger.error(f"Erro na classificação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/info")
async def models_info():
    """Retorna informações sobre os modelos carregados"""
    try:
        yolo_classes = []
        yolo_info = {}
        
        if modelo_yolo and hasattr(modelo_yolo, 'names'):
            yolo_classes = list(modelo_yolo.names.values())
            yolo_info = {
                "classes": yolo_classes,
                "total_classes": len(yolo_classes),
                "confidence_threshold": getattr(modelo_yolo, 'conf', 0.25),
                "iou_threshold": getattr(modelo_yolo, 'iou', 0.45),
                "input_size": "640x640"
            }
        
        return JSONResponse(content={
            "classificacao": {
                "classes": LABEL_COLS,
                "input_shape": "224x224x3",
                "loaded": modelo_classificacao is not None
            },
            "deteccao": {
                **yolo_info,
                "loaded": modelo_yolo is not None
            }
        })
    except Exception as e:
        logger.error(f"Erro ao obter info dos modelos: {e}")
        raise HTTPException(status_code=500, detail=str)