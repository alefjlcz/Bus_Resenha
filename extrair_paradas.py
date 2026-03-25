import requests
import json

# URL da Overpass API (O motor de busca do OpenStreetMap)
url = "http://overpass-api.de/api/interpreter"

# Coordenadas do "quadrado" que engloba Batista Campos, Nazaré e Umarizal
# Formato: [Sul, Oeste, Norte, Leste]
# Peguei uma margem segura para garantir que pegue as faculdades e as principais avenidas
query = """
[out:json];
(
  node["highway"="bus_stop"](-1.4650, -48.4980, -1.4350, -48.4700);
);
out body;
"""

print("Iniciando a varredura em Nazaré, Batista Campos e Umarizal...")
print("Buscando pontos de ônibus no OpenStreetMap. Aguarde...")

try:
    # O Python envia a nossa pesquisa para a API
    resposta = requests.post(url, data={'data': query})
    dados = resposta.json()
    
    # Criando uma lista vazia para guardar as paradas limpas
    paradas_limpas = []

    # O OpenStreetMap devolve muita sujeira. Vamos pegar só o que importa!
    for elemento in dados.get('elements', []):
        id_parada = elemento.get('id')
        lat = elemento.get('lat')
        lon = elemento.get('lon')
        
        # Algumas paradas têm nome no mapa, outras não. O Python lida com isso:
        tags = elemento.get('tags', {})
        nome = tags.get('name', 'Ponto de Ônibus (Sem nome)')
        
        # Montando o formato perfeito para o nosso Aplicativo / Firebase
        parada = {
            "id": id_parada,
            "nome": nome,
            "latitude": lat,
            "longitude": lon,
            "status_clima": "desconhecido", # O outro script vai atualizar isso depois
            "status_lotacao": "verde",      # Padrão inicial do Bus Resenha
            "foto_url": ""                  # Espaço pronto para você colocar o link da sua foto!
        }
        paradas_limpas.append(parada)

    # Salvando tudo em um arquivo JSON (O formato universal de Banco de Dados)
    with open('banco_de_paradas.json', 'w', encoding='utf-8') as arquivo:
        json.dump(paradas_limpas, arquivo, ensure_ascii=False, indent=4)

    print(f"✅ Sucesso! O Python encontrou {len(paradas_limpas)} pontos de ônibus nessa região.")
    print("Os dados foram salvos no arquivo 'banco_de_paradas.json'.")

except Exception as e:
    print(f"Ocorreu um erro: {e}")