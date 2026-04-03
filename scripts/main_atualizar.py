import os
import subprocess
import sys

def rodar_script(nome_script, argumento=None):
    comando = [sys.executable, f"scripts/{nome_script}"]
    if argumento:
        comando.append(argumento)
    
    print(f"\n--- Executando: {nome_script} ---")
    
    # Adicionado check=True para parar o processo caso algum script dê erro
    try:
        subprocess.run(comando, check=True)
    except subprocess.CalledProcessError:
        print(f"❌ Erro fatal ao executar {nome_script}. Abortando atualização.")
        sys.exit(1)

if __name__ == "__main__":

    print("Iniciando pipeline de atualização do banco de paradas via Google Places...")

    # 1. Extrai as paradas da API do Google (novo script)
    rodar_script("extrair_paradas.py")
    
    # 2. Roda os seus tratamentos de dados e imagens
    rodar_script("atualizar_nomes.py")
    rodar_script("baixar_fotos.py")
    rodar_script("gerar_mapa_fotos.py") 

    print("\n✅ TUDO PRONTO! O banco de dados e as fotos foram integrados ao App.")
    print("Se o Expo estiver aberto, ele deve recarregar automaticamente.")