import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

// Ícone nativo 
const iconeOnibusLocal = require('../assets/images/icon_bus.png'); 
const iconePersonagem = require('../assets/images/icon_usuario.png');

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

  // FILTRO: Só processa o que o usuário vê
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

  //  FUNÇÃO PARA CENTRALIZAR O MAPA NO USUÁRIO
  const centralizarNoUsuario = () => {
    if (minhaLocalizacao && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: minhaLocalizacao.latitude,
        longitude: minhaLocalizacao.longitude,
        latitudeDelta: 0.005, // Nível de zoom bem focado
        longitudeDelta: 0.005,
      }, 1000); // Animação suave de 1 segundo
    }
  };

return (
    <MapView 
      ref={mapRef}
      style={styles.map}
      initialRegion={{ 
        latitude: -1.3700, 
        longitude: -48.3800, 
        latitudeDelta: 0.02, 
        longitudeDelta: 0.02 
      }}
      showsUserLocation={false} // Deixei false para a bolinha azul do Google não ficar embaixo do boneco
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

      {/* PERSONAGEM ICON */}
      {minhaLocalizacao && (
        <Marker
          coordinate={{
            latitude: minhaLocalizacao.latitude,
            longitude: minhaLocalizacao.longitude
          }}
          title="Você está aqui"
          icon={iconePersonagem} // Se for trocar icone, colocar dimensão 120x120
          zIndex={100} 
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
            tracksViewChanges={isSelecionada}
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