import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

// Ícone nativo (Alta performance)
const iconeOnibusLocal = require('../assets/images/icon_bus.png'); 

// Função matemática para o filtro de 500m
const calcularDistanciaEmKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

interface MapaResenhaProps {
  paradas: any[];
  minhaLocalizacao: any;
  paradaSelecionada: any;
  setParadaSelecionada: (parada: any) => void;
  statusGlobal: Record<string, string>; 
}

export default function MapaResenha({ 
  paradas, 
  minhaLocalizacao, 
  paradaSelecionada, 
  setParadaSelecionada,
}: MapaResenhaProps) {
  
  const mapRef = useRef<MapView>(null);
  const [focoInicialFeito, setFocoInicialFeito] = useState(false);

  const RAIO_MAXIMO_KM = 0.5; // 500 metros

  // 🚀 FILTRO DE PERFORMANCE: Só processa o que o usuário vê
  const paradasProximas = useMemo(() => {
    if (!minhaLocalizacao || !paradas || paradas.length === 0) return [];

    return paradas.filter((parada) => {
      const lat = Number(parada.latitude);
      const lon = Number(parada.longitude);
      if (isNaN(lat) || isNaN(lon)) return false;

      const distancia = calcularDistanciaEmKm(
        minhaLocalizacao.latitude,
        minhaLocalizacao.longitude,
        lat,
        lon
      );

      return distancia <= RAIO_MAXIMO_KM;
    });
  }, [paradas, minhaLocalizacao]); 

  // Animação para a posição do usuário ao abrir
  useEffect(() => {
    if (minhaLocalizacao && mapRef.current && !focoInicialFeito) {
      mapRef.current.animateToRegion({
        latitude: minhaLocalizacao.latitude,
        longitude: minhaLocalizacao.longitude,
        latitudeDelta: 0.01, // Zoom mais próximo para ver as ruas
        longitudeDelta: 0.01,
      }, 1000);
      setFocoInicialFeito(true);
    }
  }, [minhaLocalizacao, focoInicialFeito]);

  return (
    <MapView 
      ref={mapRef}
      style={styles.map}
      // Foco inicial padrão na Cidade Nova
      initialRegion={{ 
        latitude: -1.3700, 
        longitude: -48.3800, 
        latitudeDelta: 0.02, 
        longitudeDelta: 0.02 
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
      onPress={() => setParadaSelecionada(null)} 
    >
      
      {/* Raio visual de 500m */}
      {minhaLocalizacao && (
        <Circle
          center={{ 
            latitude: minhaLocalizacao.latitude, 
            longitude: minhaLocalizacao.longitude 
          }}
          radius={RAIO_MAXIMO_KM * 1000} 
          strokeColor="rgba(0, 168, 107, 0.4)" 
          fillColor="rgba(0, 168, 107, 0.08)" 
        />
      )}

      {/* Renderização das Paradas Filtradas */}
      {paradasProximas.map((parada) => {
        const isSelecionada = paradaSelecionada?.id === parada.id;

        return (
          <Marker
            key={`parada-${parada.id}`} 
            coordinate={{ 
              latitude: Number(parada.latitude), 
              longitude: Number(parada.longitude) 
            }}
            onPress={() => setParadaSelecionada(parada)}
            icon={iconeOnibusLocal}
            // 🛡️ Impedindo tremedeira: tracksViewChanges como false economiza CPU
            // Só permitimos true se a parada for a selecionada (caso queira animar algo nela)
            tracksViewChanges={isSelecionada}
            // Garante que a parada clicada fique por cima das outras
            zIndex={isSelecionada ? 99 : 1}
          />
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' }
});