import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

const iconeOnibusAzul     = require('../assets/images/icon_bus_ok.png');
const iconeOnibusAmarelo  = require('../assets/images/icon_bus.png');
const iconeOnibusVermelho = require('../assets/images/icon_bus_cuidado.png');
const iconePersonagem     = require('../assets/images/icon_usuario.png');

const calcularDistanciaEmKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  const RAIO_VISUAL_KM   = 0.5; // 500 metros
  const RAIO_PRESENCA_KM = 0.03; // 30 metros

  const paradasVisiveis = useMemo(() => {
    if (!paradas || paradas.length === 0 || !minhaLocalizacao) {
      return [];
    }

    return paradas
      .map((parada) => {
        const latBruta = parada.latitude ?? parada.lat;
        const lonBruta = parada.longitude ?? parada.lng ?? parada.lon;

        const latLimpa = typeof latBruta === 'string' ? latBruta.replace(',', '.').trim() : latBruta;
        const lonLimpa = typeof lonBruta === 'string' ? lonBruta.replace(',', '.').trim() : lonBruta;

        const lat = Number(latLimpa);
        const lon = Number(lonLimpa);
        
        if (isNaN(lat) || isNaN(lon)) return null;

        const distancia = calcularDistanciaEmKm(
          minhaLocalizacao.latitude,
          minhaLocalizacao.longitude,
          lat,
          lon
        );

        return { ...parada, distanciaAteUsuario: distancia };
      })
      .filter(p => p !== null && p.distanciaAteUsuario <= RAIO_VISUAL_KM);
  }, [paradas, minhaLocalizacao]);

  useEffect(() => {
    if (minhaLocalizacao && mapRef.current && !focoInicialFeito) {
      mapRef.current.animateToRegion({
        latitude: minhaLocalizacao.latitude,
        longitude: minhaLocalizacao.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
      setFocoInicialFeito(true);
    }
  }, [minhaLocalizacao, focoInicialFeito]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: -1.3750,
        longitude: -48.4000,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={false}
      showsMyLocationButton={true}
      onPress={() => setParadaSelecionada(null)}
    >
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

      {paradasVisiveis.map((parada) => {
        const isSelecionada = paradaSelecionada?.id === parada.id;
        const statusAtual = statusGlobal[parada.id?.toString()] || "ok";
        const usuarioEstaNaParada = parada.distanciaAteUsuario <= RAIO_PRESENCA_KM;

        let imagemDoIcone = iconeOnibusAzul;
        if (statusAtual === 'perigoso') {
          imagemDoIcone = iconeOnibusVermelho;
        } else if (statusAtual === 'cuidado') {
          imagemDoIcone = iconeOnibusAmarelo;
        } else if (statusAtual === 'ok' || usuarioEstaNaParada) {
          imagemDoIcone = iconeOnibusAzul;
        }

        return (
          <Marker
            key={`parada-${parada.id}`}
            coordinate={{
              latitude: Number(typeof parada.latitude === 'string' ? parada.latitude.replace(',', '.') : parada.latitude ?? parada.lat),
              longitude: Number(typeof parada.longitude === 'string' ? parada.longitude.replace(',', '.') : parada.longitude ?? parada.lng ?? parada.lon)
            }}
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