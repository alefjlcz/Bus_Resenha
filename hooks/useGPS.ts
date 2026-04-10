// Arquivo: Bus Resenha/hooks/useGPS.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { Alert } from 'react-native';

// Importa os dados das paradas para o GPS saber o que procurar
import paradasData from '../assets/dados/banco_de_paradas.json';

export function useGPS() {
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<any>(null);
  const [paradaAtualGeofence, setParadaAtualGeofence] = useState<any>(null);

  useEffect(() => {
    (async () => {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("GPS Desativado", "Por favor, ligue a localização.");
        return;
      }
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão Negada", "Precisamos do GPS para mostrar o mapa.");
        return;
      }

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (location: any) => {
          const coordsAtual = { 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude,
            latitudeDelta: 0.005, 
            longitudeDelta: 0.005,
          };
          setMinhaLocalizacao(coordsAtual);

          let encontrouParadaProxima = null;
          for (let parada of paradasData) {
            const distancia = getDistance(
              { latitude: coordsAtual.latitude, longitude: coordsAtual.longitude },
              { latitude: Number(parada.latitude), longitude: Number(parada.longitude) }
            );
            if (distancia <= 30) {
              encontrouParadaProxima = parada;
              break;
            }
          }
          
          setParadaAtualGeofence(encontrouParadaProxima || null);
        }
      );
    })();
  }, []);

  // O "Hook" devolve apenas os dados prontos para a tela principal usar
  return { minhaLocalizacao, paradaAtualGeofence };
}