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
API_KEY = os.getenv("API_KEY_GOOGLE")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")
PASTA_FOTOS = os.path.join(BASE_DIR, "fotos")

# ==========================================
# INÍCIO DO PROCESSO
# ==========================================

# Cria a pasta fotos na raiz 
if not os.path.exists(PASTA_FOTOS):
    os.makedirs(PASTA_FOTOS)
    print(f"✅ Pasta '{PASTA_FOTOS}' criada com sucesso.")

if not os.path.exists(ARQUIVO_JSON):
    print(f"❌ Erro crítico: O arquivo {ARQUIVO_JSON} não foi encontrado.")
    sys.exit()

print("📖 Carregando o banco de dados...")
with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print(f"🔍 Encontradas {len(paradas)} paradas. Verificando fotos pendentes...\n")

contador = 0
for parada in paradas:
    id_parada = parada["id"]
    nome_arquivo = f"parada_{id_parada}.jpg"
    
    # Caminho onde o Python vai salvar o arquivo no seu Windows
    caminho_completo_foto = os.path.join(PASTA_FOTOS, nome_arquivo)
    
    # Caminho que será escrito no JSON (exatamente como está no seu print)
    caminho_relativo_json = f"fotos/{nome_arquivo}"

    # Se a foto já existe na pasta fotos/, pula para economizar API
    if os.path.exists(caminho_completo_foto):
        # Garante que o JSON está com o texto certo, mesmo se já existir a foto
        parada["foto_url"] = caminho_relativo_json
        continue

    lat = parada["latitude"]
    lon = parada["longitude"]
    
    # URL oficial do Google Street View
    url = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY}"
    
    try:
        resposta = requests.get(url)
        if resposta.status_code == 200:
            # Grava o arquivo físico na pasta Bus Resenha/fotos
            with open(caminho_completo_foto, 'wb') as img:
                img.write(resposta.content)
            
            # Atualiza a string dentro do JSON
            parada["foto_url"] = caminho_relativo_json
            
            contador += 1
            print(f"✅ [{contador}] Foto baixada: ID {id_parada}")
        else:
            print(f"❌ Erro no ID {id_parada}: Status {resposta.status_code}")
            
    except Exception as e:
        print(f"⚠️ Erro de conexão no ID {id_parada}: {e}")
    
    # Pausa curta para não ser bloqueado por excesso de requisições
    time.sleep(0.5)

# ==========================================
# SALVANDO AS ATUALIZAÇÕES
# ==========================================
print("\n💾 Atualizando o banco de dados JSON em assets/dados...")
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

if contador > 0:
    print(f"🎉 Processo concluído! {contador} novas imagens foram salvas.")
else:
    print("✨ Todas as paradas já possuem fotos locais. Nada para baixar.")