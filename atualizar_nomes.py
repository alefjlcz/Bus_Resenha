import json
import requests
import time

ARQUIVO = "banco_de_paradas.json"

# Lendo o seu banco de dados atual
with open(ARQUIVO, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

print("Iniciando o Radar de Endereços...")
print("Buscando o nome das ruas. Isso leva um tempinho para não sobrecarregar o servidor gratuito.\n")

contador = 0
for parada in paradas:
    # Só vai buscar o endereço se a parada estiver com o nome padrão/vazio
    if parada.get("nome") == "Ponto de Ônibus (Sem nome)" or parada.get("nome") == "Parada de Ônibus":
        lat = parada["latitude"]
        lon = parada["longitude"]
        
        # URL da API gratuita do Nominatim (OpenStreetMap)
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        
        # A API gratuita pede que a gente se identifique
        headers = {'User-Agent': 'BusResenhaApp/1.0'}
        
        try:
            resposta = requests.get(url, headers=headers)
            
            if resposta.status_code == 200:
                dados_endereco = resposta.json()
                endereco = dados_endereco.get("address", {})
                
                # Pegando a rua, número e bairro
                rua = endereco.get("road", "")
                numero = endereco.get("house_number", "S/N")
                
                if rua:
                    # Montando o nome bonitão igual ao do Google Maps
                    novo_nome = f"Parada: {rua}, {numero}"
                    
                    parada["nome"] = novo_nome
                    contador += 1
                    print(f"✅ Atualizado: {novo_nome}")
                else:
                    print(f"⚠️ Rua não encontrada para a coordenada {lat}, {lon}")
            
        except Exception as e:
            print(f"Erro na conexão: {e}")
        
        # ⚠️ PAUSA OBRIGATÓRIA: A API gratuita exige 1.5s entre cada busca
        time.sleep(1.5)

# Salvando tudo de volta no seu JSON
with open(ARQUIVO, 'w', encoding='utf-8') as f:
    json.dump(paradas, f, ensure_ascii=False, indent=4)

print(f"\n🎉 Sucesso! {contador} paradas foram atualizadas com os nomes reais das ruas.")