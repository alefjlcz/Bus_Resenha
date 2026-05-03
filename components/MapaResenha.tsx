import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

// Ícones dinâmicos das paradas
const iconeOnibusAzul = require('../assets/images/icon_bus_ok.png'); 
const iconeOnibusAmarelo = require('../assets/images/icon_bus.png');
const iconeOnibusVermelho = require('../assets/images/icon_bus_cuidado.png');

const iconePersonagem = require('../assets/images/icon_usuario.png');

// Função matemática para calcular a distância entre 2 pontos na Terra
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
  statusGlobal
}: MapaResenhaProps) {
  
  const mapRef = useRef<MapView>(null);
  const [focoInicialFeito, setFocoInicialFeito] = useState(false);

  // 500 metros para APARECER no mapa 0.5;
   const RAIO_VISUAL_KM = 0.5;  
  // 30 metros para considerar que a pessoa está DENTRO da parada
  const RAIO_PRESENCA_KM = 0.03; 

  // FILTRO: Processa as paradas num raio de 500m e já anota a distância exata delas
  const paradasProximas = useMemo(() => {
    if (!minhaLocalizacao || !paradas || paradas.length === 0) return [];

    return paradas
      .map((parada) => {
        const lat = Number(parada.latitude);
        const lon = Number(parada.longitude);
        if (isNaN(lat) || isNaN(lon)) return { ...parada, distanciaAteUsuario: 999 };

        const distancia = calcularDistanciaEmKm(
          minhaLocalizacao.latitude,
          minhaLocalizacao.longitude,
          lat,
          lon
        );

        // Retorna a parada com a informação nova da distância
        return { ...parada, distanciaAteUsuario: distancia };
      })
      // Só deixa passar quem tá a menos de 500 metros
      .filter((parada) => parada.distanciaAteUsuario <= RAIO_VISUAL_KM);
  }, [paradas, minhaLocalizacao]); 

  // Animação para a posição do usuário ao abrir
  useEffect(() => {
    if (minhaLocalizacao && mapRef.current && !focoInicialFeito) {
      mapRef.current.animateToRegion({
        latitude: minhaLocalizacao.latitude,
        longitude: minhaLocalizacao.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      setFocoInicialFeito(true);
    }
  }, [minhaLocalizacao, focoInicialFeito]);

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
      showsUserLocation={false} 
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
          radius={RAIO_VISUAL_KM * 1000} 
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
          icon={iconePersonagem}
          zIndex={100} 
        />
      )}

      {/* Renderização das Paradas Filtradas com Cores Inteligentes */}
      {paradasProximas.map((parada) => {
        const isSelecionada = paradaSelecionada?.id === parada.id;
        
        // 1. Pega o status do Firebase (se não tiver, assume "ok")
        const statusAtual = statusGlobal[parada.id?.toString()] || "ok";
        
        // 2. Verifica se a pessoa está a menos de 30m da parada
        const usuarioEstaNaParada = parada.distanciaAteUsuario <= RAIO_PRESENCA_KM;

        // 3. A Lógica de Decisão da Cor (Prioridade Máxima para o Perigo)
        let imagemDoIcone = iconeOnibusAzul;
        
        if (statusAtual === 'perigoso') {
          imagemDoIcone = iconeOnibusVermelho; // Assalto/Perigo
        } else if (statusAtual === 'cuidado') {
          imagemDoIcone = iconeOnibusAmarelo; // Alagado/Infraestrutura
        } else if (statusAtual === 'ok' || usuarioEstaNaParada) {
          imagemDoIcone = iconeOnibusAzul; // Tudo limpo ou tem movimento
        }

        return (
          <Marker
            key={`parada-${parada.id}`} 
            coordinate={{
              latitude: Number(parada.latitude),
              longitude: Number(parada.longitude)
            }}
            // Voltamos para o formato nativo e limpo para não travar o clique!
            onPress={() => setParadaSelecionada(parada)}
            icon={imagemDoIcone} 
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