import requests
import json
import os
import time
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
# 1. Descobre a pasta atual onde este script está (pasta "scripts")
DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))

# 2. "Volta" uma pasta para chegar na raiz do projeto ("Bus Resenha")
DIRETORIO_RAIZ = os.path.dirname(DIRETORIO_SCRIPT)

# 3. Carrega o .env que agora está na raiz do projeto
load_dotenv(os.path.join(DIRETORIO_RAIZ, '.env'))

# 4. Define os caminhos exatos para o JSON e para as Fotos
ARQUIVO_JSON = os.path.join(DIRETORIO_RAIZ, 'assets', 'dados', 'banco_de_paradas.json')
# PASTA_FOTOS foi atualizada para refletir a sua estrutura real (na raiz)
PASTA_FOTOS = os.path.join(DIRETORIO_RAIZ, 'fotos') 

# ==========================================
# CONFIGURAÇÕES APIs
# ==========================================
API_KEY_GOOGLE = os.getenv("API_KEY_GOOGLE")
URL_OVERPASS = os.getenv("URL_OVERPASS")
URL_NOMINATIM = os.getenv("URL_NOMINATIM")

CATALOGO_BAIRROS = {
#           --- BAIRROS DO CENTRO DE BELÉM ---
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

#        --- BAIRROS DO CENTRO DE ANANINDEUA ---
    "cidade_nova": "-1.3900,-48.4050,-1.3450,-48.3600",
}

# ==========================================
#              PRINCIPAL
# ==========================================
def adicionar_novo_bairro(bbox, nome_bairro):
    print(f"\n🚀 Iniciando a pesquisa sobre o bairro: {nome_bairro.upper()}...")
    novas_paradas = []
    
    # --- BUSCAR PARADAS ---
    print("📍 Procurando paradas no mapa...")
    
    # Aumentei o timeout para 60 para evitar aquele erro de servidor ocupado
    query = f'[out:json][timeout:60];(node["highway"="bus_stop"]({bbox}););out body;'
    cabecalho = {'User-Agent': 'BusResenhaApp/1.0'}
    
    try:
        resp_overpass = requests.post(URL_OVERPASS, data={'data': query}, headers=cabecalho)
        
        if resp_overpass.status_code != 200:
            print(f"❌ O servidor do mapa recusou o acesso (Código {resp_overpass.status_code}).")
            print("Motivo:", resp_overpass.text)
            return

        elementos = resp_overpass.json().get('elements', [])
        
    except Exception as e:
        print(f"❌ Erro ao conectar no OpenStreetMap: {e}")
        return

    # --- CARREGAR BANCO DE DADOS  ---
    if os.path.exists(ARQUIVO_JSON):
        with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
            banco_atual = json.load(f)
    else:
        os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
        banco_atual = []
    
    # --- NOVA LÓGICA: FILTRAR O QUE JÁ EXISTE ---
    ids_existentes = {parada['id'] for parada in banco_atual}
    paradas_para_processar = []

    for el in elementos:
        if el.get('id') not in ids_existentes:
            paradas_para_processar.append(el)
            
    print(f"🔎 O mapa retornou {len(elementos)} paradas na região.")
    print(f"🆕 Vou processar e adicionar apenas as {len(paradas_para_processar)} paradas INÉDITAS.\n")

    # Se não tiver nada novo, já encerra aqui e economiza tempo
    if not paradas_para_processar:
        print(f"⚠️ Todas as paradas do {nome_bairro.upper()} já estão cadastradas no seu aplicativo!")
        return

    # --- PROCESSAR APENAS AS NOVAS PARADAS ---
    contador = 0
    print("⚙️ Passo 2: Buscando nomes das ruas e verificando fotos...")
    for el in paradas_para_processar:
        id_parada = el.get('id')
        lat = el.get('lat')
        lon = el.get('lon')
        
        #  Buscar o Nome pela API Nominatim
        nome_rua = "Parada de Ônibus"
        url_nome = f"{URL_NOMINATIM}?format=json&lat={lat}&lon={lon}&zoom=18"
        try:
            resp_nome = requests.get(url_nome, headers={'User-Agent': 'BusResenhaApp/1.0'})
            if resp_nome.status_code == 200:
                end = resp_nome.json().get("address", {})
                if "road" in end:
                    nome_rua = f"Parada: {end['road']}"
        except: 
            pass
        
        time.sleep(1.5) # Pausa obrigatória para o Nominatim
        
        #  Tratamento Inteligente de Fotos
        nome_arquivo_foto = f"parada_{id_parada}.jpg"
        caminho_foto_completo = os.path.join(PASTA_FOTOS, nome_arquivo_foto)
        caminho_foto_relativo = f"fotos/{nome_arquivo_foto}" # Mantendo o padrão que o app lê

        # SÓ BAIXA SE A FOTO NÃO EXISTIR NA PASTA
        if not os.path.exists(caminho_foto_completo):
            url_foto = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY_GOOGLE}"
            try:
                resp_foto = requests.get(url_foto)
                if resp_foto.status_code == 200:
                    with open(caminho_foto_completo, 'wb') as img:
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
            "foto_url": caminho_foto_relativo 
        }
        
        novas_paradas.append(parada_pronta)
        contador += 1
        print(f"✅ Nova adicionada: {nome_rua}")

    # --- SALVAR TUDO NO BANCO ---
    if contador > 0:
        banco_atual.extend(novas_paradas)
        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(banco_atual, f, ensure_ascii=False, indent=4)
        print(f"\n🎉 SUCESSO! {contador} novas paradas foram inseridas e salvas!")

# ==========================================
#              PARTIDA
# ==========================================
if __name__ == "__main__":
    if not os.path.exists(PASTA_FOTOS): 
        os.makedirs(PASTA_FOTOS)
    
    if len(sys.argv) < 2:
        print("\n💡 Exemplo de uso: python scripts/adicionar_bairro.py guama")
        print("👉 Bairros disponíveis no catálogo:", ", ".join(CATALOGO_BAIRROS.keys()))
        sys.exit() 
        
    bairro_digitado = sys.argv[1].lower()
    
    if bairro_digitado in CATALOGO_BAIRROS:
        bbox_do_bairro = CATALOGO_BAIRROS[bairro_digitado]
        adicionar_novo_bairro(bbox_do_bairro, bairro_digitado)
    else:
        print(f"\n❌ Erro: O bairro '{bairro_digitado}' ainda não está cadastrado no seu catálogo.")
        print("👉 Bairros disponíveis:", ", ".join(CATALOGO_BAIRROS.keys()))