import requests
import schedule
import time
import os
from dotenv import load_dotenv

load_dotenv() 

URL_BASE_METEO = os.getenv("URL_OPEN_METEO")

LAT = "-1.454061"
LON = "-48.481225"

def verificar_clima():
    url = f"{URL_BASE_METEO}?latitude={LAT}&longitude={LON}&current_weather=true"

    try:
        resposta = requests.get(url)
        dados = resposta.json()

        if resposta.status_code == 200:
            clima = dados['current_weather']
            temperatura = clima['temperature']
            codigo_clima = clima['weathercode']
            
            esta_chovendo = codigo_clima >= 50 

            hora_atual = time.strftime('%H:%M:%S')
            print(f"[{hora_atual}] Nazaré/Belém - Temperatura atual: {temperatura}°C")

            if esta_chovendo:
                print("⚠️ ALERTA: Chuva ou garoa detectada! Atualizando status das paradas.\n")
            else:
                print("✅ Tempo firme. Sem alertas climáticos no momento.\n")
                
        else:
            print("Erro ao acessar a API.")
            
    except Exception as e:
        print(f"Erro no código ou sem internet: {e}")

schedule.every(10).minutes.do(verificar_clima)

print("Iniciando o motor climático do Bus Resenha (via Open-Meteo)...")
verificar_clima()

while True:
    schedule.run_pending()
    time.sleep(1)