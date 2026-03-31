import json
import requests
import time
import os
from dotenv import load_dotenv

load_dotenv() 

ARQUIVO = "../banco_de_paradas.json"
URL_BASE_NOMINATIM = os.getenv("URL_NOMINATIM")

with open(ARQUIVO, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print("Iniciando o Radar de Endereços...")
print("Buscando o nome das ruas. Isso leva um tempinho para não sobrecarregar o servidor gratuito.\n")

contador = 0
for parada in paradas:
    if parada.get("nome") == "Ponto de Ônibus (Sem nome)" or parada.get("nome") == "Parada de Ônibus":
        lat = parada["latitude"]
        lon = parada["longitude"]
        
        
        url = f"{URL_BASE_NOMINATIM}?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        headers = {'User-Agent': 'BusResenhaApp/1.0'}
        
        try:
            resposta = requests.get(url, headers=headers)
            if resposta.status_code == 200:
                dados_endereco = resposta.json()
                endereco = dados_endereco.get("address", {})
                
                rua = endereco.get("road", "")
                numero = endereco.get("house_number", "S/N")
                
                if rua:
                    novo_nome = f"Parada: {rua}, {numero}"
                    parada["nome"] = novo_nome
                    contador += 1
                    print(f"✅ Atualizado: {novo_nome}")
                else:
                    print(f"⚠️ Rua não encontrada para a coordenada {lat}, {lon}")
            
        except Exception as e:
            print(f"Erro na conexão: {e}")
        
        time.sleep(1.5)

with open(ARQUIVO, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print(f"\n🎉 Sucesso! {contador} paradas foram atualizadas com os nomes reais das ruas.")