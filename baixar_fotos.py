import requests
import json
import os
import time

# 1. Configurações Iniciais
API_KEY = "AIzaSyBJSM8NS_YU3qHBKdWwmwDf7F-NgTsPDvg"
ARQUIVO_JSON = "banco_de_paradas.json"
PASTA_FOTOS = "fotos"

# Criar a pasta "fotos" caso ela ainda não exista
if not os.path.exists(PASTA_FOTOS):
    os.makedirs(PASTA_FOTOS)
    print(f"Pasta '{PASTA_FOTOS}' criada com sucesso.")

# 2. Carregar o banco de dados atual
print("A carregar o ficheiro de paragens...")
with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print(f"Encontradas {len(paradas)} paragens. A iniciar a descarga das imagens do Google Street View...\n")

# 3. O Loop de Automação
contador = 0
for parada in paradas:
    # Se a paragem já tiver uma foto guardada, o script salta para a próxima
    if parada.get("foto_url") and parada["foto_url"].startswith(PASTA_FOTOS):
        continue

    id_parada = parada["id"]
    lat = parada["latitude"]
    lon = parada["longitude"]
    
    # URL da API do Google Street View Static
    # O tamanho (size) é 600x400, ideal para ecrãs de telemóvel
    url = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY}"
    
    try:
        # Fazer o pedido à Google
        resposta = requests.get(url)
        
        if resposta.status_code == 200:
            # Onde a imagem será guardada
            caminho_foto = f"{PASTA_FOTOS}/parada_{id_parada}.jpg"
            
            # Guardar a imagem na pasta local
            with open(caminho_foto, 'wb') as img:
                img.write(resposta.content)
            
            # Atualizar o caminho da foto no dicionário (na memória)
            parada["foto_url"] = caminho_foto
            contador += 1
            print(f"✅ Foto {contador} descarregada: Paragem ID {id_parada}")
        else:
            print(f"❌ Erro na paragem {id_parada}: Código HTTP {resposta.status_code}")
            
    except Exception as e:
        print(f"Erro de conexão: {e}")
    
    # Uma pequena pausa de meio segundo para não sobrecarregar os servidores da Google
    time.sleep(0.5)

# 4. Guardar as atualizações no ficheiro JSON
print("\nA atualizar o banco de dados (ficheiro JSON)...")
with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print("🎉 Processo concluído! O seu mapa agora tem fotos reais.")