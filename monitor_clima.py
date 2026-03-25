import requests
import schedule
import time

# Coordenadas de Nazaré (conforme a sua lista)
LAT = "-1.454061"
LON = "-48.481225"

def verificar_clima():
    # URL da API Open-Meteo (Não precisa de chave!)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current_weather=true"

    try:
        # O Python pede os dados
        resposta = requests.get(url)
        dados = resposta.json()

        if resposta.status_code == 200:
            # Extraindo as informações da Open-Meteo
            clima = dados['current_weather']
            temperatura = clima['temperature']
            codigo_clima = clima['weathercode']
            
            # A Open-Meteo usa os códigos da WMO (Organização Meteorológica Mundial)
            # Códigos de 50 para cima representam garoa, chuva ou tempestade
            esta_chovendo = codigo_clima >= 50 

            hora_atual = time.strftime('%H:%M:%S')
            print(f"[{hora_atual}] Nazaré/Belém - Temperatura atual: {temperatura}°C")

            # A inteligência do Bus Resenha
            if esta_chovendo:
                print("⚠️ ALERTA: Chuva ou garoa detectada! Atualizando status das paradas.\n")
            else:
                print("✅ Tempo firme. Sem alertas climáticos no momento.\n")
                
        else:
            print("Erro ao acessar a API.")
            
    except Exception as e:
        print(f"Erro no código ou sem internet: {e}")

# Agendando para rodar a cada 10 minutos
schedule.every(10).minutes.do(verificar_clima)

print("Iniciando o motor climático do Bus Resenha (via Open-Meteo)...")
verificar_clima() # Roda imediatamente

# Loop infinito para manter rodando
while True:
    schedule.run_pending()
    time.sleep(1)