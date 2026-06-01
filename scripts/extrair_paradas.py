import requests
import json
import os
import sys
import time
from dotenv import load_dotenv

# Configuração de Caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

API_KEY = os.getenv("GOOGLE_API_KEY")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")

# ==========================================
# CONFIGURAÇÃO DA VARREDURA (MARACANGALHA)
# ==========================================
# Definimos o "quadrado" que engloba o bairro Maracangalha e arredores (Marex, Júlio César)
LAT_SUL, LON_OESTE = -1.4050, -48.4900
LAT_NORTE, LON_LESTE = -1.3750, -48.4650

# Tamanho do "pulo" do scanner (aprox. 600 metros)
PASSO = 0.006 

def buscar_todas_as_paradas():
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    todas_paradas = {} # Dicionário para evitar duplicados pelo ID

    print("🛰️ Iniciando varredura profunda no bairro Maracangalha...")

    lat_atual = LAT_SUL
    while lat_atual <= LAT_NORTE:
        lon_atual = LON_OESTE
        while lon_atual <= LON_LESTE:
            print(f"🔍 Escaneando área: Lat {lat_atual:.4f} | Lon {lon_atual:.4f}")
            
            params = {
                "location": f"{lat_atual},{lon_atual}",
                "radius": 500, # Raio pequeno para pegar TUDO
                "keyword": "ponto de onibus",
                "key": API_KEY
            }

            try:
                res = requests.get(url, params=params)
                dados = res.json()
                
                if dados.get("status") == "OK":
                    for item in dados.get("results", []):
                        pid = item["place_id"]
                        if pid not in todas_paradas:
                            coords = item["geometry"]["location"]
                            todas_paradas[pid] = {
                                "id": pid,
                                "nome": item.get("name", "Ponto de Ônibus"),
                                "latitude": coords["lat"],
                                "longitude": coords["lng"],
                                "status_clima": "desconhecido",
                                "status_lotacao": "verde",
                                "foto_url": f"fotos/parada_{pid}.jpg"
                            }
                
                # O Google pede um descanso entre as buscas para não bloquear a chave
                time.sleep(0.2)
                
            except Exception as e:
                print(f"⚠️ Falha no ponto: {e}")
            
            lon_atual += PASSO
        lat_atual += PASSO

    return list(todas_paradas.values())

# --- EXECUÇÃO ---
resultado = buscar_todas_as_paradas()

if resultado:
    os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
    with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=4)
    print(f"\n✅ SUCESSO! Varredura concluída. {len(resultado)} paradas únicas salvas na Maracangalha.")
else:
    print("❌ Nenhuma parada encontrada. Verifique sua chave no .env.")
    sys.exit(1)