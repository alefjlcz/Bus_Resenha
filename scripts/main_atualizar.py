import os
import subprocess
import sys

# ✅ CORREÇÃO: força o diretório de trabalho para a raiz do projeto
# independente de onde você rodou o script
DIRETORIO_RAIZ = os.path.dirname(os.path.abspath(__file__))
# main_atualizar.py está em scripts/, então sobe um nível
DIRETORIO_RAIZ = os.path.dirname(DIRETORIO_RAIZ)
os.chdir(DIRETORIO_RAIZ)

print(f"📁 Diretório de trabalho: {os.getcwd()}")

def rodar_script(nome_script, argumento=None):
    # Caminho absoluto para o script
    caminho_script = os.path.join(DIRETORIO_RAIZ, "scripts", nome_script)
    comando = [sys.executable, caminho_script]
    if argumento:
        comando.append(argumento)

    print(f"\n--- Executando: {nome_script} ---")
    try:
        subprocess.run(comando, check=True, cwd=DIRETORIO_RAIZ)
    except subprocess.CalledProcessError:
        print(f"❌ Erro fatal ao executar {nome_script}. Abortando atualização.")
        sys.exit(1)

if __name__ == "__main__":
    print("Iniciando pipeline de atualização do banco de paradas via Google Places...")

    # Pergunta se quer rodar o extrair_paradas (perigoso pois sobrescreve tudo)
    resposta = input("\n⚠️  Deseja rodar extrair_paradas.py? Isso SOBRESCREVE o banco atual. (s/N): ").strip().lower()
    if resposta == "s":
        rodar_script("extrair_paradas.py")
    else:
        print("⏭️  Pulando extração. Usando banco de dados existente.")

    rodar_script("atualizar_nomes.py")
    rodar_script("baixar_fotos.py")
    rodar_script("gerar_mapa_fotos.py")

    print("\n✅ TUDO PRONTO! O banco de dados e as fotos foram integrados ao App.")
    print("Se o Expo estiver aberto, ele deve recarregar automaticamente.")