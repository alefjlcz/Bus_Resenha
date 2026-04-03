import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQUIVO_JSON = os.path.join(BASE_DIR, "assets", "dados", "banco_de_paradas.json")
ARQUIVO_TS = os.path.join(BASE_DIR, "assets", "dados", "mapa_fotos.ts")

# Aponta para a sua pasta original na raiz do projeto
PASTA_FOTOS = os.path.join(BASE_DIR, "fotos")

if not os.path.exists(ARQUIVO_JSON):
    print("❌ Erro: banco_de_paradas.json não encontrado.")
    sys.exit(1)

with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
    paradas = json.load(f)

linhas_ts = [
    "// ARQUIVO GERADO AUTOMATICAMENTE. NÃO EDITE MANUALMENTE.",
    "export const mapaFotos: Record<string, any> = {"
]

contador_adicionadas = 0
contador_ignoradas = 0

for parada in paradas:
    id_parada = parada["id"]
    nome_foto = f"parada_{id_parada}.jpg"
    
    # 1. Caminho físico real para o Python checar se o arquivo existe no HD
    caminho_fisico = os.path.join(PASTA_FOTOS, nome_foto)
    
    # 2. O caminho matemático que o Expo precisa ler (saindo de assets/dados/)
    caminho_require = f'../../fotos/{nome_foto}'

    # O ESCUDO: Só escreve o require se a foto estiver fisicamente lá!
    if os.path.exists(caminho_fisico):
        linhas_ts.append(f'  "{id_parada}": require("{caminho_require}"),')
        contador_adicionadas += 1
    else:
        # Se a foto não existir, ignora para não dar tela vermelha no Expo
        contador_ignoradas += 1

linhas_ts.append("};")

with open(ARQUIVO_TS, 'w', encoding='utf-8') as f:
    f.write("\n".join(linhas_ts))

print(f"✅ mapa_fotos.ts gerado com sucesso!")
print(f"📸 Fotos mapeadas para o App: {contador_adicionadas}")
if contador_ignoradas > 0:
    print(f"🛡️ Fotos ignoradas (salvando o App do crash): {contador_ignoradas}")