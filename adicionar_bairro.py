import requests
import json
import os
import time
import sys
from dotenv import load_dotenv

load_dotenv()

# 
# CONFIGURAÇÕES APIs
# 
API_KEY_GOOGLE = os.getenv("API_KEY_GOOGLE")
URL_OVERPASS = os.getenv("URL_OVERPASS")
URL_NOMINATIM = os.getenv("URL_NOMINATIM")

ARQUIVO_JSON = "banco_de_paradas.json"
PASTA_FOTOS = "fotos"

# CATÁLOGO DE BAIRROS 

CATALOGO_BAIRROS = {
#    --- BAIRROS DO CENTRO DE BELÉM ---
    "umarizal": "-1.4460,-48.4850,-1.4330,-48.4730",
    "nazare": "-1.4550,-48.4850,-1.4410,-48.4710",
    "batista_campos": "-1.4650,-48.4950,-1.4520,-48.4820",
    "reduto": "-1.4480,-48.4980,-1.4380,-48.4880",
    "campina": "-1.4580,-48.5050,-1.4480,-48.4940",
    "cidade_velha": "-1.4680,-48.5080,-1.4550,-48.4980",
    "sao_bras": "-1.4450,-48.4750,-1.4350,-48.4620",
    "pedreira": "-1.4350,-48.4850,-1.4150,-48.4650",
    "marco": "-1.4450,-48.4650,-1.4250,-48.4450",
    "guama": "-1.4850,-48.4750,-1.4550,-48.4450",
    "jurunas": "-1.4750,-48.5000,-1.4600,-48.4850",
    "cremacao": "-1.4650,-48.4850,-1.4500,-48.4650",
    "condor": "-1.4780,-48.4900,-1.4600,-48.4750",
    "sacramenta": "-1.4250,-48.4750,-1.4050,-48.4550",
    "telegrafo": "-1.4250,-48.4850,-1.4050,-48.4700",
}

# ==========================================
#             FUNÇÃO PRINCIPAL
# ==========================================
def adicionar_novo_bairro(bbox, nome_bairro):
    print(f"\n🚀 Iniciando a pesquisa sobre o bairro: {nome_bairro.upper()}...")
    novas_paradas = []
    
    # --- BUSCAR PARADAS ---
    print("📍 Procurando paradas no mapa...")
    
    # Criando a query do Overpass e o crachá de identificação 
    query = f'[out:json][timeout:25];(node["highway"="bus_stop"]({bbox}););out body;'
    cabecalho = {'User-Agent': 'BusResenhaApp/1.0'}
    
    try:
        # Usando a URL segura que veio do .env
        resp_overpass = requests.post(URL_OVERPASS, data={'data': query}, headers=cabecalho)
        
        # Se o servidor der problema vai mostrar o motivo
        if resp_overpass.status_code != 200:
            print(f"❌ O servidor do mapa recusou o acesso (Código {resp_overpass.status_code}).")
            print("Motivo:", resp_overpass.text)
            return

        elementos = resp_overpass.json().get('elements', [])
        print(f"Encontradas {len(elementos)} paradas nessa região.")
        
    except Exception as e:
        print(f"❌ Erro ao conectar no OpenStreetMap: {e}")
        return

    # --- CARREGAR BANCO DE DADOS  ---
    if os.path.exists(ARQUIVO_JSON):
        with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
            banco_atual = json.load(f)
    else:
        banco_atual = []
    
    # Criando uma lista rápida só com os IDs para não cadastrar a mesma parada duas vezes
    ids_existentes = {parada['id'] for parada in banco_atual}

    # --- PROCESSAR CADA PARADA ---
    contador = 0
    print("\n⚙️ Passo 2: Buscando nomes das ruas e fotos reais...")
    for el in elementos:
        id_parada = el.get('id')
        
        # Se a parada já estiver no banco, pula!
        if id_parada in ids_existentes:
            continue
            
        lat = el.get('lat')
        lon = el.get('lon')
        
        #  Buscar o Nome pela API Nominatim
        nome_rua = "Parada de Ônibus"
        # Montando a URL dinamicamente com a base do .env
        url_nome = f"{URL_NOMINATIM}?format=json&lat={lat}&lon={lon}&zoom=18"
        try:
            resp_nome = requests.get(url_nome, headers={'User-Agent': 'BusResenhaApp/1.0'})
            if resp_nome.status_code == 200:
                end = resp_nome.json().get("address", {})
                if "road" in end:
                    nome_rua = f"Parada: {end['road']}"
        except: 
            pass
        
        time.sleep(1.5) # Pausa obrigatória para não ser bloqueado pelo Nominatim
        
        #  Buscar a Foto pela API do Google Street View
        caminho_foto = ""
        url_foto = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY_GOOGLE}"
        try:
            resp_foto = requests.get(url_foto)
            if resp_foto.status_code == 200:
                caminho_foto = f"{PASTA_FOTOS}/parada_{id_parada}.jpg"
                with open(caminho_foto, 'wb') as img:
                    img.write(resp_foto.content)
        except: 
            pass
        
        #  Montar o Pacote no banco de dados
        parada_pronta = {
            "id": id_parada,
            "nome": nome_rua,
            "latitude": lat,
            "longitude": lon,
            "status_clima": "desconhecido",
            "status_lotacao": "verde",
            "foto_url": caminho_foto
        }
        
        novas_paradas.append(parada_pronta)
        contador += 1
        print(f"✅ Adicionada: {nome_rua}")

    # --- SALVAR TUDO NO BANCO ---
    if contador > 0:
        banco_atual.extend(novas_paradas)
        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(banco_atual, f, ensure_ascii=False, indent=4)
        print(f"\n🎉 SUCESSO! {contador} novas paradas do bairro {nome_bairro.upper()} foram salvas no sistema!")
    else:
        print(f"\n⚠️ Nenhuma parada nova foi encontrada (ou todas já estavam cadastradas).")

# ==========================================
#               PARTIDA
# ==========================================
if __name__ == "__main__":
    # Garante que a pasta de fotos existe
    if not os.path.exists(PASTA_FOTOS): 
        os.makedirs(PASTA_FOTOS)
    
    # Verifica se você digitou o bairro no terminal
    if len(sys.argv) < 2:
        print("\n💡 Exemplo de uso: python adicionar_bairro.py guama")
        print("👉 Bairros disponíveis no catálogo:", ", ".join(CATALOGO_BAIRROS.keys()))
        sys.exit() 
        
    # Pega a palavra que você digitou e transforma em minúscula
    bairro_digitado = sys.argv[1].lower()
    
    # Verifica se o bairro existe no catálogo 
    if bairro_digitado in CATALOGO_BAIRROS:
        bbox_do_bairro = CATALOGO_BAIRROS[bairro_digitado]
        adicionar_novo_bairro(bbox_do_bairro, bairro_digitado)
    else:
        print(f"\n❌ Erro: O bairro '{bairro_digitado}' ainda não está cadastrado no seu catálogo.")
        print("👉 Bairros disponíveis:", ", ".join(CATALOGO_BAIRROS.keys()))