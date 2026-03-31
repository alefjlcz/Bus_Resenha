import React from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Importando o nosso Big Data (Ajustado para a nova estrutura de abas)
import paradasData from '../../assets/dados/banco_de_paradas.json';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Cabeçalho do App */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Resenha</Text>
        <Text style={styles.headerSubtitle}>Mapeamento Inteligente de Paradas</Text>
      </View>

      {/* O Mapa Nativo */}
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: -1.4550, // Centralizado em Belém
          longitude: -48.4800,
          latitudeDelta: 0.05, // Nível de Zoom
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true} // Se o tablet tiver GPS, mostra a bolinha azul
      >
        {/* Desenhando os pinos puxados do JSON */}
        {paradasData.map((parada) => (
          <Marker
            key={parada.id.toString()}
            coordinate={{
              latitude: parada.latitude,
              longitude: parada.longitude,
            }}
            title={parada.nome}
            description="Clique para ver a resenha"
            pinColor="#00A86B" // Cor verde pro nosso app
          />
        ))} 
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0F7FA',
  },
  map: {
    flex: 1,
    width: '100%',
  },
});