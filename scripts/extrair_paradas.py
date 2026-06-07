import requests
import json
import os
import sys
import time
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

API_KEY = os.getenv("GOOGLE_API_KEY")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")

LAT_SUL,  LON_OESTE  = -1.4050, -48.4900
LAT_NORTE, LON_LESTE = -1.3750, -48.4650
PASSO = 0.006

def buscar_todas_as_paradas():
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    novas_paradas = {}

    print("🛰️ Iniciando varredura profunda...")

    lat_atual = LAT_SUL
    while lat_atual <= LAT_NORTE:
        lon_atual = LON_OESTE
        while lon_atual <= LON_LESTE:
            print(f"🔍 Escaneando: Lat {lat_atual:.4f} | Lon {lon_atual:.4f}")

            params = {
                "location": f"{lat_atual},{lon_atual}",
                "radius": 500,
                "keyword": "ponto de onibus",
                "key": API_KEY
            }

            try:
                res = requests.get(url, params=params)
                dados = res.json()

                if dados.get("status") == "OK":
                    for item in dados.get("results", []):
                        pid = item["place_id"]
                        if pid not in novas_paradas:
                            coords = item["geometry"]["location"]
                            novas_paradas[pid] = {
                                "id": pid,
                                "nome": item.get("name", "Ponto de Ônibus"),
                                "latitude": coords["lat"],
                                "longitude": coords["lng"],
                                "status_clima": "desconhecido",
                                "status_lotacao": "verde",
                                "foto_url": f"fotos/parada_{pid}.jpg"
                            }
                elif dados.get("status") == "REQUEST_DENIED":
                    print("❌ Chave de API inválida ou sem permissão. Verifique o .env")
                    sys.exit(1)

                time.sleep(0.2)

            except Exception as e:
                print(f"⚠️ Falha no ponto: {e}")

            lon_atual += PASSO
        lat_atual += PASSO

    return novas_paradas

# --- EXECUÇÃO ---
novas = buscar_todas_as_paradas()

if not novas:
    print("❌ Nenhuma parada encontrada. Verifique sua chave no .env.")
    sys.exit(1)

# ✅ CORREÇÃO PRINCIPAL: mescla com o banco existente em vez de sobrescrever
banco_atual = []
ids_existentes = set()

if os.path.exists(ARQUIVO_JSON):
    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        banco_atual = json.load(f)
    ids_existentes = {p["id"] for p in banco_atual}
    print(f"📂 Banco existente carregado: {len(banco_atual)} paradas")

paradas_novas = [p for pid, p in novas.items() if pid not in ids_existentes]
banco_final = banco_atual + paradas_novas

os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(banco_final, f, ensure_ascii=False, indent=4)

print(f"\n✅ SUCESSO!")
print(f"   Paradas já existentes mantidas: {len(banco_atual)}")
print(f"   Paradas novas adicionadas:      {len(paradas_novas)}")
print(f"   Total no banco:                 {len(banco_final)}")