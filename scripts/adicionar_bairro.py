import requests
import json
import os
import time
import sys
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
DIRETORIO_RAIZ = os.path.dirname(DIRETORIO_SCRIPT)

load_dotenv(os.path.join(DIRETORIO_RAIZ, '.env'))

ARQUIVO_JSON = os.path.join(DIRETORIO_RAIZ, 'assets', 'dados', 'banco_de_paradas.json')
PASTA_FOTOS = os.path.join(DIRETORIO_RAIZ, 'fotos') 

# ==========================================
# CONFIGURAÇÕES APIs
# ==========================================
API_KEY_GOOGLE = os.getenv("API_KEY_GOOGLE")
URL_OVERPASS = os.getenv("URL_OVERPASS")
URL_NOMINATIM = os.getenv("URL_NOMINATIM")

CATALOGO_BAIRROS = {
    # ==========================================
    #   VARREDURA POR CIDADES INTEIRAS 
    # ==========================================
    
    # Cidade Nova, Maguari, Icuí, Coqueiro, Águas Lindas, Guanabara, etc.
    "ananindeua_toda": "-1.4300,-48.4500,-1.2800,-48.3300",
    
    # Centro, Icoaraci, Augusto Montenegro, Guamá, Pedreira, etc.
    "belem_toda": "-1.5000,-48.5200,-1.3700,-48.4200",
    
    # Marituba até a divisa com Benevides
    "marituba_toda": "-1.4000,-48.3800,-1.3200,-48.2800",

    # ==========================================
    # TESTAR UM PEDAÇO MENOR 
    # ==========================================
    "cidade_nova_foco": "-1.3900,-48.4100,-1.3400,-48.3600",

    # --- BAIRROS FORA DO PARÁ DE EXEMPLO ---
    "mariana_mg": "-20.4500,-43.5000,-20.3000,-43.3500",
    "ponte_nova_mg": "-20.4600,-42.9400,-20.3700,-42.8400",
}

# ==========================================
#               PRINCIPAL
# ==========================================
def adicionar_novo_bairro(bbox, nome_bairro):
    print(f"\n=======================================================")
    print(f" Iniciando a pesquisa sobre o bairro: {nome_bairro.upper()}...")
    print(f"=======================================================")
    novas_paradas = []
    
# --- BUSCAR PARADAS ---
    print(" Procurando paradas no mapa (OpenStreetMap)...")
    query = f"""
    [out:json][timeout:60];
    (
      node["highway"="bus_stop"]({bbox});
      node["public_transport"="platform"]({bbox});
      node["amenity"="bus_station"]({bbox});
    );
    out body;
    """
    
    cabecalho = {'User-Agent': 'BusResenhaApp/1.0'}
    
    elementos = []
    max_tentativas = 3
    sucesso_mapa = False
    
    for tentativa in range(max_tentativas):
        try:
            # Coloquei um timeout no próprio request para evitar que ele fique travado infinitamente
            resp_overpass = requests.post(URL_OVERPASS, data={'data': query}, headers=cabecalho, timeout=60)
            
            if resp_overpass.status_code == 200:
                elementos = resp_overpass.json().get('elements', [])
                sucesso_mapa = True
                break # Conseguiu baixar! Sai do loop de tentativas.
            else:
                print(f"⚠️ O mapa recusou (Código {resp_overpass.status_code}). Tentando de novo...")
                
        except Exception as e:
            print(f"⚠️ Queda de conexão (Tentativa {tentativa + 1}/{max_tentativas})")
            
        if tentativa < max_tentativas - 1:
            print("⏳ Aguardando 5 segundos para não estressar o servidor...")
            time.sleep(5)
            
    if not sucesso_mapa:
        print(f"❌ O servidor do OpenStreetMap falhou 3 vezes seguidas. Pulando o bairro {nome_bairro.upper()}...")
        return # Aborta esse bairro e vai pro próximo da lista

    # --- CARREGAR BANCO DE DADOS  ---
    if os.path.exists(ARQUIVO_JSON):
        with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
            banco_atual = json.load(f)
    else:
        os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
        banco_atual = []
    
    # --- FILTRAR O QUE JÁ EXISTE ---
    ids_existentes = {parada['id'] for parada in banco_atual}
    paradas_para_processar = []

    for el in elementos:
        if el.get('id') not in ids_existentes:
            paradas_para_processar.append(el)
            
    print(f"🔎 O mapa encontrou {len(elementos)} paradas no total desta região.")
    print(f"🆕 Destas, apenas {len(paradas_para_processar)} são INÉDITAS no banco de dados.")

    # Se não tiver nada novo, pula pro próximo bairro sem dar erro
    if not paradas_para_processar:
        print(f"⏭️  [OK] Todas as paradas de {nome_bairro.upper()} já estão salvas.")
        return

    # --- PROCESSAR APENAS AS NOVAS PARADAS ---
    contador = 0
    print("\n⚙️ Buscando nomes das ruas e puxando fotos no Google Street View...")
    for el in paradas_para_processar:
        id_parada = el.get('id')
        lat = el.get('lat')
        lon = el.get('lon')
        
        # Buscar o Nome pela API Nominatim
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
        
        time.sleep(1.2) # Pausa obrigatória exigida pela política do Nominatim
        
        # Tratamento de Fotos
        nome_arquivo_foto = f"parada_{id_parada}.jpg"
        caminho_foto_completo = os.path.join(PASTA_FOTOS, nome_arquivo_foto)
        caminho_foto_relativo = f"fotos/{nome_arquivo_foto}"

        # Só faz a requisição se a foto fisicamente não existir na pasta
        if not os.path.exists(caminho_foto_completo):
            url_foto = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={API_KEY_GOOGLE}"
            try:
                resp_foto = requests.get(url_foto)
                if resp_foto.status_code == 200:
                    with open(caminho_foto_completo, 'wb') as img:
                        img.write(resp_foto.content)
            except: 
                pass
        
        # Montar estrutura padrão para o App ler
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
        print(f"  └─ CADASTRED: {nome_rua} (ID: {id_parada})")

    # --- SALVAR NO BANCO ---
    if contador > 0:
        # Recarrega o banco antes de salvar para evitar condições de corrida (se rodar scripts juntos)
        if os.path.exists(ARQUIVO_JSON):
            with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
                banco_atual = json.load(f)
        
        banco_atual.extend(novas_paradas)
        with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
            json.dump(banco_atual, f, ensure_ascii=False, indent=4)
        print(f"📂 Salvo! +{contador} paradas adicionadas ao banco vindas de {nome_bairro.upper()}.")

# ==========================================
#              PARTIDA
# ==========================================
if __name__ == "__main__":
    if not os.path.exists(PASTA_FOTOS): 
        os.makedirs(PASTA_FOTOS)
    
    if len(sys.argv) < 2:
        print("\n💡 Opções de uso:")
        print("👉 Para rodar APENAS UM bairro: python scripts/adicionar_bairro.py guama")
        print("👉 Para fazer a varredura em TODOS os bairros: python scripts/adicionar_bairro.py all")
        print("\nBairros no catálogo:", ", ".join(CATALOGO_BAIRROS.keys()))
        sys.exit() 
        
    parametro = sys.argv[1].lower()
    
    if parametro == "all":
        print(f"♻️  MODO EM MASSA ATIVADO! Iniciando varredura de todos os {len(CATALOGO_BAIRROS)} bairros...")
        tempo_inicio = time.time()
        
        for nome_bairro, bbox_do_bairro in CATALOGO_BAIRROS.items():
            adicionar_novo_bairro(bbox_do_bairro, nome_bairro)
            time.sleep(2) # Pequena folga entre bairros para não estressar as APIs
            
        tempo_total = (time.time() - tempo_inicio) / 60
        print(f"\n🏆 VARREDURA COMPLETA FINALIZADA! Todos os bairros foram checados em {tempo_total:.2f} minutos.")
        
    elif parametro in CATALOGO_BAIRROS:
        bbox_do_bairro = CATALOGO_BAIRROS[parametro]
        adicionar_novo_bairro(bbox_do_bairro, parametro)
    else:
        print(f"\n❌ Erro: O bairro ou comando '{parametro}' não existe.")
        print("👉 Use 'all' para todos ou escolha um do catálogo:", ", ".join(CATALOGO_BAIRROS.keys()))