import requests
import json

# URL da Overpass API (Usando o servidor da França que é mais rápido e seguro)
url = "https://overpass.openstreetmap.fr/api/interpreter"

# Coordenadas do "quadrado" (Nazaré, Batista Campos e Umarizal)
# ATENÇÃO: Os números devem ser grudados pela vírgula, sem espaços!
query = """
[out:json][timeout:25];
(
  node["highway"="bus_stop"](-1.4650,-48.4980,-1.4350,-48.4700);
);
out body;
"""

print("Iniciando a varredura em Nazaré, Batista Campos e Umarizal...")
print("Buscando pontos de ônibus no OpenStreetMap. Aguarde...")

try:
    # O Python envia a nossa pesquisa com o nosso "crachá" para não ser bloqueado
    cabecalho = {'User-Agent': 'BusResenhaApp/1.0'}
    resposta = requests.post(url, data={'data': query}, headers=cabecalho)
    
    if resposta.status_code != 200:
        print(f"❌ O servidor recusou o acesso (Código {resposta.status_code}).")
        print("Motivo:", resposta.text)
        exit()

    dados = resposta.json()
    paradas_limpas = []

    for elemento in dados.get('elements', []):
        id_parada = elemento.get('id')
        lat = elemento.get('lat')
        lon = elemento.get('lon')
        
        tags = elemento.get('tags', {})
        nome = tags.get('name', 'Ponto de Ônibus (Sem nome)')
        
        parada = {
            "id": id_parada,
            "nome": nome,
            "latitude": lat,
            "longitude": lon,
            "status_clima": "desconhecido", 
            "status_lotacao": "verde",      
            "foto_url": ""                  
        }
        paradas_limpas.append(parada)

    # ⚠️ A MÁGICA DO DIRETÓRIO AQUI: O '../' manda ele salvar na raiz do projeto!
    caminho_arquivo = '../banco_de_paradas.json'
    
    with open(caminho_arquivo, 'w', encoding='utf-8') as arquivo:
        json.dump(paradas_limpas, arquivo, ensure_ascii=False, indent=4)

    print(f"\n✅ Sucesso! O Python encontrou {len(paradas_limpas)} pontos de ônibus nessa região.")
    print(f"Os dados foram salvos atualizados no arquivo '{caminho_arquivo}'.")

except Exception as e:
    print(f"❌ Ocorreu um erro: {e}")