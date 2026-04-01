import requests
import json
import os
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
# Descobre a pasta atual (scripts) e define a raiz (Bus Resenha)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Carrega o .env que está na raiz
load_dotenv(os.path.join(BASE_DIR, ".env"))

# URL do Overpass vinda do .env
URL_OVERPASS = os.getenv("URL_OVERPASS")

# Caminho final onde o JSON será salvo dentro do App
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")

# ==========================================
# CONFIGURAÇÃO DA PESQUISA (QUERY)
# ==========================================
# BBox de exemplo (Região de Belém/Ananindeua)
# Você pode alterar essas coordenadas conforme a necessidade
QUERY_OVERPASS = """
[out:json][timeout:25];
(
  node["highway"="bus_stop"](-1.4650,-48.4980,-1.4350,-48.4700);
);
out body;
"""

print("🚀 Buscando pontos de ônibus no OpenStreetMap...")
print("📍 Região selecionada via BBox...")

try:
    # 1. FAZENDO A REQUISIÇÃO
    cabecalho = {'User-Agent': 'BusResenhaApp/1.0'}
    resposta = requests.post(URL_OVERPASS, data={'data': QUERY_OVERPASS}, headers=cabecalho)
    
    if resposta.status_code != 200:
        print(f"❌ O servidor do mapa recusou o acesso (Código {resposta.status_code}).")
        print("Motivo:", resposta.text)
        sys.exit()

    dados = resposta.json()
    paradas_limpas = []

    # 2. PROCESSANDO OS DADOS
    for elemento in dados.get('elements', []):
        id_parada = elemento.get('id')
        lat = elemento.get('lat')
        lon = elemento.get('lon')
        
        tags = elemento.get('tags', {})
        nome = tags.get('name', 'Ponto de Ônibus (Sem nome)')
        
        # Mantendo o padrão que o seu App e os outros scripts esperam
        parada = {
            "id": id_parada,
            "nome": nome,
            "latitude": lat,
            "longitude": lon,
            "status_clima": "desconhecido", 
            "status_lotacao": "verde",      
            "foto_url": f"fotos/parada_{id_parada}.jpg" # Padrão que você definiu para o banco
        }
        paradas_limpas.append(parada)

    # 3. GARANTINDO QUE A PASTA EXISTE
    os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)

    # 4. SALVANDO NO LOCAL CORRETO
    with open(ARQUIVO_JSON, 'w', encoding='utf-8') as arquivo:
        json.dump(paradas_limpas, arquivo, ensure_ascii=False, indent=4)

    print(f"\n✅ SUCESSO! Encontradas {len(paradas_limpas)} paradas.")
    print(f"📂 Banco atualizado em: assets/dados/banco_de_paradas.json")

except Exception as e:
    print(f"❌ Ocorreu um erro inesperado: {e}")