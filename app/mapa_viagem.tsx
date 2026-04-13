import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { db } from '../chat/firebase';

const { width, height } = Dimensions.get('window');

export default function MapaViagem() {
  const router = useRouter();
  // Puxa os IDs que enviamos pelo botão "Ver no Mapa"
  const { chatId, msgId } = useLocalSearchParams();

  const [localizacao, setLocalizacao] = useState<{ lat: number; lon: number } | null>(null);
  const [motorista, setMotorista] = useState('Passageiro');
  const [carregando, setCarregando] = useState(true);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (!chatId || !msgId) return;

    // Fica "escutando" APENAS o documento desta localização específica
    const docRef = doc(db, "chats", chatId as string, "mensagens", msgId as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const dados = docSnap.data();
        
        // LÓGICA DE EXPIRAÇÃO (TTL)
        const agora = new Date();
        const dataExpiracao = new Date(dados.expiraEm);

        if (agora > dataExpiracao) {
          setExpirado(true);
        } else {
          setLocalizacao({
            lat: dados.latitude,
            lon: dados.longitude
          });
          setMotorista(dados.usuario);
        }
      } else {
        // Se por acaso a mensagem for deletada
        setExpirado(true);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [chatId, msgId]);

  // Se ainda estiver buscando a primeira coordenada no banco
  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={{ marginTop: 10, color: '#666' }}>Buscando sinal do GPS...</Text>
      </View>
    );
  }

  // Se o tempo acabou (ou a mensagem sumiu)
  if (expirado || !localizacao) {
    return (
      <View style={styles.centralizado}>
        <Ionicons name="location-outline" size={60} color="#CCC" />
        <Text style={styles.textoExpirado}>Compartilhamento Encerrado</Text>
        <Text style={styles.subtextoExpirado}>O tempo limite dessa viagem acabou.</Text>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <Text style={styles.textoBotaoVoltar}>Voltar para o Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Se o GPS está ativo e dentro do tempo, desenha o Mapa!
  return (
    <View style={styles.container}>
      <MapView
        style={styles.mapa}
        initialRegion={{
          latitude: localizacao.lat,
          longitude: localizacao.lon,
          latitudeDelta: 0.01, // Zoom de perto
          longitudeDelta: 0.01,
        }}
        region={{
          // O `region` força o mapa a centralizar toda vez que a coordenada muda!
          latitude: localizacao.lat,
          longitude: localizacao.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: localizacao.lat, longitude: localizacao.lon }}
          title={`Busão com ${motorista}`}
          description="Localização em tempo real"
        >
          {/* Você pode trocar esse ícone por uma imagem de um ônibus depois! */}
          <View style={styles.marcadorOnibus}>
            <Ionicons name="bus" size={24} color="#FFF" />
          </View>
        </Marker>
      </MapView>

      {/* CABEÇALHO FLUTUANTE */}
      <View style={styles.headerFlutuante}>
        <TouchableOpacity style={styles.botaoVoltarFlutuante} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.infoHeader}>
          <Text style={styles.tituloHeader}>Acompanhando</Text>
          <Text style={styles.subtituloHeader}>{motorista}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mapa: { width: width, height: height },
  
  // Estilos da tela de expirado
  textoExpirado: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15 },
  subtextoExpirado: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5, marginBottom: 20 },
  botaoVoltar: { backgroundColor: '#00A86B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  textoBotaoVoltar: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Marcador customizado no mapa
  marcadorOnibus: {
    backgroundColor: '#00A86B',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

  // Cabeçalho por cima do mapa
  headerFlutuante: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  botaoVoltarFlutuante: {
    padding: 5,
    marginRight: 10,
  },
  infoHeader: { flex: 1 },
  tituloHeader: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: 'bold' },
  subtituloHeader: { fontSize: 16, color: '#333', fontWeight: 'bold' }
});