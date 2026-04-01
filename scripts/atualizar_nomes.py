import json
import requests
import time
import os
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
DIRETORIO_RAIZ = os.path.dirname(DIRETORIO_SCRIPT)

# Carrega o .env da raiz do projeto
load_dotenv(os.path.join(DIRETORIO_RAIZ, '.env'))

# Caminho para o banco de dados oficial do app
ARQUIVO_JSON = os.path.join(DIRETORIO_RAIZ, 'assets', 'dados', 'banco_de_paradas.json')
URL_BASE_NOMINATIM = os.getenv("URL_NOMINATIM")

# ==========================================
#             LÓGICA DE ATUALIZAÇÃO
# ==========================================

if not os.path.exists(ARQUIVO_JSON):
    print(f"❌ Erro: Banco de dados não encontrado em {ARQUIVO_JSON}")
    sys.exit()

with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print("🚀 Buscando o nome das ruas no Nominatim...")
print("⚠️ Nota: Isso leva um tempinho devido ao limite de requisições do servidor.\n")

contador = 0
for parada in paradas:
    # Só tenta atualizar se o nome for genérico ou estiver vazio
    nome_atual = parada.get("nome", "")
    if nome_atual in ["Ponto de Ônibus (Sem nome)", "Parada de Ônibus", ""]:
        lat = parada["latitude"]
        lon = parada["longitude"]
        
        # Monta a URL para o reverse geocoding
        url = f"{URL_BASE_NOMINATIM}?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        headers = {'User-Agent': 'BusResenhaApp/1.0'}
        
        try:
            resposta = requests.get(url, headers=headers)
            if resposta.status_code == 200:
                dados_endereco = resposta.json()
                endereco = dados_endereco.get("address", {})
                
                rua = endereco.get("road") or endereco.get("pedestrian") or endereco.get("suburb", "Rua Desconhecida")
                numero = endereco.get("house_number", "S/N")
                
                novo_nome = f"Parada: {rua}, {numero}"
                parada["nome"] = novo_nome
                contador += 1
                print(f"✅ [{contador}] Atualizado: {novo_nome}")
            else:
                print(f"⚠️ Servidor retornou erro {resposta.status_code} para {lat}, {lon}")
            
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
        
        # Pausa obrigatória de 1.5s para respeitar as regras do Nominatim (OpenStreetMap)
        time.sleep(1.5)

# Salva as alterações de volta no arquivo oficial
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print(f"\n🎉 Tudo pronto! {contador} paradas agora têm nomes reais.")