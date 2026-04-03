import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import React, { useEffect, useState } from 'react';
import { Alert, StatusBar, Text, View } from 'react-native';

import paradasData from '../../assets/dados/banco_de_paradas.json';
import { styles } from './styles';

import CardParada from '../../components/CardParada';
import MapaResenha from '../../components/MapaResenha';

export default function App() {
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<any>(null);
  const [paradaAtualGeofence, setParadaAtualGeofence] = useState<any>(null);

  // --- NOVO: ESTADO GLOBAL DE RESENHAS ---
  // Guarda o status das paradas. Ex: { "1234": "alagada", "5678": "perigosa" }
  const [statusGlobal, setStatusGlobal] = useState<Record<string, string>>({});

  // Simulação do "Tempo Real" a cada 15 minutos
  useEffect(() => {
    const tempoDeAtualizacao = 15 * 60 * 1000; // 15 minutos em milissegundos
    // DICA: Para testar rápido, troque a linha de cima por: const tempoDeAtualizacao = 15000; (15 segundos)

    const intervalo = setInterval(() => {
      console.log("🔄 Buscando novas resenhas do servidor na nuvem...");
      // No futuro, aqui entrará o código para buscar os dados do Firebase/Supabase
      // Por enquanto, ele apenas avisa que o ciclo de 15 min rodou.
    }, tempoDeAtualizacao);

    return () => clearInterval(intervalo);
  }, []);

  // Função que o Card vai chamar quando alguém reportar um problema
  const registrarResenha = (idParada: string, status: string) => {
    setStatusGlobal(prev => ({
      ...prev,
      [idParada]: status
    }));
  };
  // ----------------------------------------

  useEffect(() => {
    (async () => {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("GPS Desativado", "Por favor, ligue a localização.");
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 10 },
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
              { latitude: parada.latitude, longitude: parada.longitude }
            );
            if (distancia <= 30) {
              encontrouParadaProxima = parada;
              break;
            }
          }
          if (encontrouParadaProxima) {
            setParadaAtualGeofence(encontrouParadaProxima);
            setParadaSelecionada(encontrouParadaProxima); 
          } else {
            setParadaAtualGeofence(null);
          }
        }
      );
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00A86B" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Resenha</Text>
        <Text style={styles.headerSubtitle}>Vem beber com nós</Text>
      </View>

      <MapaResenha 
        paradas={paradasData}
        minhaLocalizacao={minhaLocalizacao}
        paradaSelecionada={paradaSelecionada}
        setParadaSelecionada={setParadaSelecionada}
        statusGlobal={statusGlobal} // <-- Passando as resenhas para o mapa
      />

      <CardParada 
        parada={paradaSelecionada} 
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id} 
        fecharCard={() => setParadaSelecionada(null)}
        statusGlobal={statusGlobal} // <-- Passando as resenhas para o card
        registrarResenha={registrarResenha} // <-- Passando a função de reportar
      />
      
    </View>
  );
}