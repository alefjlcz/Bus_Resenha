import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY_GOOGLE")
ARQUIVO_JSON = "../banco_de_paradas.json"
PASTA_FOTOS = "../fotos"

if not os.path.exists(PASTA_FOTOS):
    os.makedirs(PASTA_FOTOS)
    print(f"Pasta '{PASTA_FOTOS}' criada com sucesso.")

print("A carregar o ficheiro...")
with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print(f"Encontradas {len(paradas)} paradas. Baixando das imagens do Google Street View...\n")

contador = 0
for parada in paradas:
    if parada.get("foto_url") and parada["foto_url"].startswith(PASTA_FOTOS):
        continue

    id_parada = parada["id"]
    lat = parada["latitude"]
    lon = parada["longitude"]
    
    url = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY}"
    
    try:
        resposta = requests.get(url)
        if resposta.status_code == 200:
            caminho_foto = f"{PASTA_FOTOS}/parada_{id_parada}.jpg"
            with open(caminho_foto, 'wb') as img:
                img.write(resposta.content)
            
            parada["foto_url"] = caminho_foto
            contador += 1
            print(f"✅ Foto {contador} descarregada: Paragem ID {id_parada}")
        else:
            print(f"❌ Erro na paragem {id_parada}: Código HTTP {resposta.status_code}")
            
    except Exception as e:
        print(f"Erro de conexão: {e}")
    
    time.sleep(0.5)

print("\nAtualizando o banco de dados...")
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print("🎉 Processo concluído! O seu mapa agora está atualizado.")