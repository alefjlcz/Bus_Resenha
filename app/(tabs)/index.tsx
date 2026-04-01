import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib'; // <-- 1. IMPORTANDO O GEOLIB

import paradasData from '../../assets/dados/banco_de_paradas.json';
import { styles } from './styles';
import CardParada from '../../components/CardParada';

export default function App() {
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<any>(null);
  
  // <-- 2. NOVO ESTADO: Guarda em qual parada o usuário está fisicamente agora
  const [paradaAtualGeofence, setParadaAtualGeofence] = useState<any>(null); 

  useEffect(() => {
    (async () => {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("GPS Desativado", "Por favor, ligue a localização.");
        return; // Boa prática: parar a execução aqui se não tiver GPS
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 10 },
        (location: any) => {
          const coordsAtual = { 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude 
          };
          setMinhaLocalizacao(coordsAtual);

          // <-- 3. LÓGICA DO GEOFENCING 
          let encontrouParadaProxima = null;

          for (let parada of paradasData) {
            const distancia = getDistance(
              { latitude: coordsAtual.latitude, longitude: coordsAtual.longitude },
              { latitude: parada.latitude, longitude: parada.longitude }
            );

            // Se estiver num raio de 30 metros ou menos
            if (distancia <= 30) {
              encontrouParadaProxima = parada;
              break; // Achou uma, para o loop pra economizar processamento
            }
          }

          if (encontrouParadaProxima) {
            // Atualiza o estado dizendo que você está dentro do raio dessa parada
            setParadaAtualGeofence(encontrouParadaProxima);
            
            // Opcional mas recomendado: Auto-seleciona a parada para o Card subir na tela sozinho!
            setParadaSelecionada(encontrouParadaProxima); 
          } else {
            // Se saiu do raio de 30m de qualquer parada, zera o estado
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
        <Text style={styles.headerSubtitle}>Mapeamento Inteligente de Paradas</Text>
      </View>

      <MapView 
        style={styles.map}
        initialRegion={{ latitude: -1.4550, longitude: -48.4800, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation={true}
        followsUserLocation={true}
        onPress={() => setParadaSelecionada(null)} 
      >
        {paradasData.map((parada) => (
          <Marker
            key={parada.id.toString()}
            coordinate={{ latitude: parada.latitude, longitude: parada.longitude }}
            onPress={() => setParadaSelecionada(parada)}
            pinColor={paradaSelecionada?.id === parada.id ? "#FF3B30" : "#00A86B"}
          />
        ))}
      </MapView>

      {/* <-- 4. PASSANDO A NOVA INFORMAÇÃO PRO CARD */}
      <CardParada 
        parada={paradaSelecionada} 
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id} 
      />
      
    </View>
  );
}