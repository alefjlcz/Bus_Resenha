import requests
import json
import os
import time
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
# Descobre a pasta atual (scripts) e define a raiz (Bus Resenha)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Carrega o .env que está na raiz
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Configurações vindas do .env e Caminhos
URL_CLIMA = os.getenv("URL_OPEN_METEO")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")

# ==========================================
# FUNÇÃO PARA TRADUZIR CÓDIGOS DE CLIMA (WMO)
# ==========================================
def traduzir_clima(codigo):
    """
    Traduz os códigos da Open-Meteo para o linguajar do Bus Resenha.
    """
    if codigo == 0: return "☀️ Limpo"
    if codigo in [1, 2, 3]: return "⛅ Parcial. Nublado"
    if codigo in [45, 48]: return "🌫️ Nevoeiro"
    if codigo in [51, 53, 55]: return "🌧️ Chuva Leve"
    if codigo in [61, 63, 65]: return "🌧️ Chuvoso"
    if codigo in [80, 81, 82]: return "🌦️ Pancadas de Chuva"
    if codigo in [95, 96, 99]: return "⚡ Tempestade"
    return "☁️ Nublado"

# ==========================================
#             LÓGICA PRINCIPAL
# ==========================================
def atualizar_monitoramento_clima():
    if not os.path.exists(ARQUIVO_JSON):
        print(f"❌ Erro: Banco de dados não encontrado em {ARQUIVO_JSON}")
        return

    print("📖 Lendo banco de paradas para atualização climática...")
    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        paradas = json.load(f)

    print(f"🌡️ Verificando clima para {len(paradas)} paradas. Aguarde...\n")
    
    contador = 0
    for parada in paradas:
        lat = parada["latitude"]
        lon = parada["longitude"]

        # Monta a URL de consulta (Current Weather)
        # Usamos a base do .env e adicionamos os parâmetros de lat/lon
        url_final = f"{URL_CLIMA}?latitude={lat}&longitude={lon}&current_weather=true"

        try:
            resposta = requests.get(url_final)
            if resposta.status_code == 200:
                dados_clima = resposta.json()
                codigo_wmo = dados_clima["current_weather"]["weathercode"]
                temperatura = dados_clima["current_weather"]["temperature"]
                
                # Traduz e atualiza o campo no banco
                clima_texto = traduzir_clima(codigo_wmo)
                parada["status_clima"] = f"{clima_texto} ({temperatura}°C)"
                
                contador += 1
                print(f"✅ [{contador}] {parada['nome']}: {clima_texto} {temperatura}°C")
            else:
                print(f"⚠️ Erro ao buscar clima para ID {parada['id']}: Status {resposta.status_code}")

        except Exception as e:
            print(f"❌ Falha na conexão para ID {parada['id']}: {e}")

        # Pausa rápida para não sobrecarregar a API gratuita
        time.sleep(0.2)

    # Salvando os dados atualizados
    with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(paradas, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Sucesso! O clima de {contador} paradas foi atualizado em tempo real.")

if __name__ == "__main__":
    atualizar_monitoramento_clima()