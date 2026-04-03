import requests
import json
import os
import time
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Carrega o seu .env que está na raiz
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Configurações de API e Arquivos
API_KEY = os.getenv("GOOGLE_API_KEY")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")
PASTA_FOTOS = os.path.join(BASE_DIR, "fotos")

# ==========================================
# INÍCIO DO PROCESSO
# ==========================================

# Cria a pasta fotos na raiz se não existir
if not os.path.exists(PASTA_FOTOS):
    os.makedirs(PASTA_FOTOS)
    print(f"✅ Pasta '{PASTA_FOTOS}' criada com sucesso.")

if not os.path.exists(ARQUIVO_JSON):
    print(f"❌ Erro crítico: O arquivo {ARQUIVO_JSON} não foi encontrado.")
    sys.exit()

print("📖 Carregando o banco de dados...")
with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print(f"🔍 Encontradas {len(paradas)} paradas no banco. Iniciando o filtro inteligente de fotos...\n")

contador_baixadas = 0
contador_puladas = 0
contador_sem_foto = 0 # Adicionado contador para monitorar as falhas do Google

for parada in paradas:
    id_parada = parada["id"]
    nome_arquivo = f"parada_{id_parada}.jpg"
    
    # Caminho onde o Python vai salvar o arquivo no seu PC
    caminho_completo_foto = os.path.join(PASTA_FOTOS, nome_arquivo)
    
    # Caminho que será escrito no JSON para o app ler
    caminho_relativo_json = f"fotos/{nome_arquivo}"

    # --- O ESCUDO: Se a foto já existe na pasta fotos/, pula! ---
    if os.path.exists(caminho_completo_foto):
        # Garante que o JSON está com o texto certo, mesmo se já existir a foto
        parada["foto_url"] = caminho_relativo_json
        contador_puladas += 1
        print(f"⏭️ [Pulado] A foto {nome_arquivo} já existe. Economizando API.")
        continue

    lat = parada["latitude"]
    lon = parada["longitude"]
    
    # 🚨 URL BLINDADA: Adicionamos radius=100 e return_error_code=true
    url = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&radius=100&return_error_code=true&key={API_KEY}"
    
    try:
        resposta = requests.get(url)
        
        if resposta.status_code == 200:
            # Grava o arquivo físico na pasta Bus Resenha/fotos
            with open(caminho_completo_foto, 'wb') as img:
                img.write(resposta.content)
            
            # Atualiza a string dentro do JSON
            parada["foto_url"] = caminho_relativo_json
            contador_baixadas += 1
            print(f"✅ [Baixado] Foto inédita salva: ID {id_parada}")
            
        elif resposta.status_code == 404:
            # O Google assumiu que não tem foto para a coordenada
            parada["foto_url"] = None
            contador_sem_foto += 1
            print(f"⚠️ [Sem Foto] ID {id_parada}: O Google não tem Street View para este local. Limpando JSON.")
            
        else:
            # Aqui cai o temido Erro 500 do servidor. Anulamos a URL para não quebrar o Expo!
            parada["foto_url"] = None
            contador_sem_foto += 1
            print(f"❌ [Erro do Google] ID {id_parada}: Status {resposta.status_code}. Limpando JSON.")
            
    except Exception as e:
        # Se a sua internet cair no meio do processo, também anula a foto
        parada["foto_url"] = None
        contador_sem_foto += 1
        print(f"⚠️ [Falha] Erro de conexão no ID {id_parada}: {e}")
    
    # Pausa curta para não ser bloqueado por excesso de requisições
    time.sleep(0.5)

# ==========================================
# SALVANDO AS ATUALIZAÇÕES
# ==========================================
print("\n💾 Atualizando o banco de dados JSON em assets/dados...")
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print("\n📊 --- RESUMO DA OPERAÇÃO ---")
print(f"📸 Novas fotos baixadas do Google: {contador_baixadas}")
print(f"🛡️ Fotos locais reaproveitadas (poupadas): {contador_puladas}")
print(f"👻 Paradas sem foto (limpas no JSON para evitar crash): {contador_sem_foto}")
print("🎉 Processo concluído com sucesso!")