import requests
import json
import os
import sys
import time
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÃO DE CAMINHOS DINÂMICOS
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

API_KEY = os.getenv("GOOGLE_API_KEY")
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")

# O PASSO define a "resolução" da varredura.
# 0.006 (aprox. 600m) é bom para achar quase tudo.
# Aumente se quiser economizar na API do Google (ex: 0.01).
PASSO = 0.006

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
    #   ESPIRITO SANTO
    # ==========================================
    "guarapari_es": "-20.7300,-40.5500,-20.6000,-40.4500",

    # ==========================================
    # TESTAR UM PEDAÇO MENOR 
    # ==========================================
    "cidade_nova_foco": "-1.3900,-48.4100,-1.3400,-48.3600",

    # --- BAIRROS FORA DO PARÁ DE EXEMPLO ---
    "mariana_mg": "-20.4500,-43.5000,-20.3000,-43.3500",
    "ponte_nova_mg": "-20.4600,-42.9400,-20.3700,-42.8400",
}

def buscar_paradas_na_regiao(nome_regiao, bbox):
    """
    Varre a região definida pelo bbox (lat_sul, lon_oeste, lat_norte, lon_leste)
    usando a API do Google Places e retorna um dicionário com as paradas encontradas.
    """
    url = "ttps://maps.googleapis.com/maps/api/place/nearhbysearch/json"
    paradas_encontradas = {}

    print(f"\n=======================================================")
    print(f"🛰️  Iniciando varredura profunda: {nome_regiao.upper()}...")
    print(f"=======================================================")

    # Converte a string do bbox para floats
    coords = [float(x) for x in bbox.split(',')]
    lat_sul, lon_oeste, lat_norte, lon_leste = coords

    lat_atual = lat_sul
    while lat_atual <= lat_norte:
        lon_atual = lon_oeste
        while lon_atual <= lon_leste:
            # Imprime sem quebrar a linha para não poluir muito o terminal
            print(f"\r🔍 Escaneando grade: Lat {lat_atual:.4f} | Lon {lon_atual:.4f}", end="", flush=True)

            params = {
                "location": f"{lat_atual},{lon_atual}",
                "radius": 500,
                "keyword": "ponto de onibus",
                "key": API_KEY
            }

            try:
                res = requests.get(url, params=params)
                dados = res.json()

                if dados.get("status") == "OK":
                    for item in dados.get("results", []):
                        pid = item["place_id"]
                        if pid not in paradas_encontradas:
                            item_coords = item["geometry"]["location"]
                            paradas_encontradas[pid] = {
                                "id": pid,
                                "nome": item.get("name", "Ponto de Ônibus"),
                                "latitude": item_coords["lat"],
                                "longitude": item_coords["lng"],
                                "status_clima": "desconhecido",
                                "status_lotacao": "verde",
                                "foto_url": f"fotos/parada_{pid}.jpg" # O baixar_fotos.py cuidará disso
                            }
                elif dados.get("status") == "REQUEST_DENIED":
                    print("\n❌ Chave de API inválida ou sem permissão. Verifique o .env")
                    sys.exit(1)
                elif dados.get("status") == "OVER_QUERY_LIMIT":
                    print("\n⚠️  Cota da API do Google estourada! Pare o script.")
                    sys.exit(1)

                time.sleep(0.2) # Pausa para não estourar os limites da API

            except Exception as e:
                print(f"\n⚠️ Falha na requisição: {e}")

            lon_atual += PASSO
        lat_atual += PASSO

    print(f"\n🏁 Fim da varredura em {nome_regiao.upper()}. Encontradas: {len(paradas_encontradas)}")
    return paradas_encontradas

# --- EXECUÇÃO PRINCIPAL ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\n💡 Opções de uso:")
        print("👉 Para rodar APENAS UMA região: python scripts/extrair_paradas.py cidade_nova_foco")
        print("👉 Para fazer a varredura em TODAS as regiões: python scripts/extrair_paradas.py all")
        print("\nRegiões no catálogo:", ", ".join(CATALOGO_BAIRROS.keys()))
        sys.exit() 
        
    parametro = sys.argv[1].lower()
    todas_novas_paradas = {}

    if parametro == "all":
        print(f"♻️  MODO EM MASSA ATIVADO! Extraindo via Google Places...")
        for nome_regiao, bbox in CATALOGO_BAIRROS.items():
            paradas_da_regiao = buscar_paradas_na_regiao(nome_regiao, bbox)
            todas_novas_paradas.update(paradas_da_regiao) # Junta no dict final
            time.sleep(1) 
    elif parametro in CATALOGO_BAIRROS:
        bbox = CATALOGO_BAIRROS[parametro]
        todas_novas_paradas = buscar_paradas_na_regiao(parametro, bbox)
    else:
        print(f"\n❌ Erro: A região '{parametro}' não existe no catálogo.")
        sys.exit(1)

    if not todas_novas_paradas:
        print("\n❌ Nenhuma parada encontrada na(s) região(ões) selecionada(s).")
        sys.exit(0)

    # ✅ CORREÇÃO PRINCIPAL: mescla com o banco existente em vez de sobrescrever
    banco_atual = []
    ids_existentes = set()

    if os.path.exists(ARQUIVO_JSON):
        with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
            try:
                banco_atual = json.load(f)
                ids_existentes = {p["id"] for p in banco_atual}
                print(f"\n📂 Banco existente carregado: {len(banco_atual)} paradas")
            except json.JSONDecodeError:
                print("\n⚠️  O banco_de_paradas.json estava vazio ou corrompido. Iniciando um novo.")

    # Filtra: Só entra na lista final o que ainda não existir no banco
    paradas_inéditas = [p for pid, p in todas_novas_paradas.items() if pid not in ids_existentes]
    banco_final = banco_atual + paradas_inéditas

    # Salva no arquivo JSON
    os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
    with open(ARQUIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(banco_final, f, ensure_ascii=False, indent=4)

    print(f"\n✅ SUCESSO ABSOLUTO!")
    print(f"   Paradas já existentes (mantidas): {len(banco_atual)}")
    print(f"   Paradas INÉDITAS adicionadas:     {len(paradas_inéditas)}")
    print(f"   Total no banco agora:             {len(banco_final)}")