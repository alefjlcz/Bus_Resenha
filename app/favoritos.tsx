import { Ionicons } from '@expo/vector-icons';
import { arrayRemove, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import bancoDeParadas from '../assets/dados/banco_de_paradas.json';
import { auth, db } from '../chat/firebase';

interface ParadaFavorita {
  id: string;
  nome: string;
  reportesPerigo: number;  // soma de reportes Vermelho + 190
  policiaChamada: boolean; // true se o 190 já foi acionado
}

export default function TelaFavoritos() {
  const [favoritos, setFavoritos] = useState<ParadaFavorita[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarFavoritosDoUsuario = async () => {
      try {
        const usuarioAtual = auth.currentUser;
        if (!usuarioAtual) {
          setCarregando(false);
          return;
        }

        const userRef = doc(db, "usuarios", usuarioAtual.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const idsSalvos = docSnap.data().paradasFavoritas || [];

          // Promise.all para buscar os dados reais de cada parada no Firebase
          const paradasMapeadas = await Promise.all(
            idsSalvos.map(async (idDaParada: string) => {
              const paradaEncontrada = bancoDeParadas.find((p: any) => p.id === idDaParada);

              let reportesPerigo = 0;
              let policiaChamada = false;

              try {
                const paradaRef = doc(db, "paradas", idDaParada);
                const paradaSnap = await getDoc(paradaRef);

                if (paradaSnap.exists()) {
                  const data = paradaSnap.data();
                  reportesPerigo = (data.reportesVermelho || 0) + (data.reportes190 || 0);
                  policiaChamada = data.policiaChamada === true;
                }
              } catch (e) {
                console.warn(`Erro ao buscar dados da parada ${idDaParada}`);
              }

              return {
                id: idDaParada,
                nome: paradaEncontrada ? paradaEncontrada.nome : 'Parada Desconhecida',
                reportesPerigo,
                policiaChamada,
              };
            })
          );

          setFavoritos(paradasMapeadas);
        }
      } catch (error) {
        console.error("Erro ao buscar favoritos:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarFavoritosDoUsuario();
  }, []);

  const confirmarRemocao = (id: string, nome: string) => {
    Alert.alert(
      "Remover Favorito",
      `Tem certeza que deseja remover "${nome}" dos seus favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => removerDaLista(id) }
      ]
    );
  };

  const removerDaLista = async (idDaParada: string) => {
    setFavoritos(prev => prev.filter(parada => parada.id !== idDaParada));

    try {
      const usuarioAtual = auth.currentUser;
      if (usuarioAtual) {
        const userRef = doc(db, "usuarios", usuarioAtual.uid);
        await updateDoc(userRef, {
          paradasFavoritas: arrayRemove(idDaParada)
        });
      }
    } catch (error) {
      console.error("❌ Erro ao remover favorito do Firebase:", error);
      Alert.alert("Erro", "Não foi possível remover dos favoritos.");
    }
  };

  const renderCardParada = ({ item }: { item: ParadaFavorita }) => {
    const corReporte =
      item.reportesPerigo > 5 ? '#FF3B30' :
      item.reportesPerigo > 0 ? '#FFCC00' :
      '#8E8E93';

    return (
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <Text style={styles.nomeParada}>{item.nome}</Text>

          {/* Reportes de perigo — só aparece se tiver algum */}
          {item.reportesPerigo > 0 && (
            <View style={styles.reporteContainer}>
              <Ionicons name="warning" size={16} color={corReporte} />
              <Text style={[styles.textoReporte, { color: corReporte }]}>
                {item.reportesPerigo} {item.reportesPerigo === 1 ? 'reporte de perigo' : 'reportes de perigo'}
              </Text>
            </View>
          )}

          {/* Banner do 190 — só aparece se a polícia foi acionada */}
          {item.policiaChamada && (
            <View style={styles.bannerPolicia}>
              <Ionicons name="shield" size={14} color="#FFFFFF" />
              <Text style={styles.textoBannerPolicia}>
                190 foi acionada nessa parada, tome cuidado!
              </Text>
            </View>
          )}

          {/* Sem nenhum reporte — mostra tranquilo */}
          {item.reportesPerigo === 0 && !item.policiaChamada && (
            <View style={styles.reporteContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={[styles.textoReporte, { color: '#34C759' }]}>
                Nenhum reporte de perigo
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.botaoRemover}
          onPress={() => confirmarRemocao(item.id, item.nome)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  if (carregando) {
    return (
      <View style={[styles.container, styles.centralizado]}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={{ marginTop: 10, color: '#666' }}>Buscando seus favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        renderItem={renderCardParada}
        contentContainerStyle={styles.listaPadding}
        ListEmptyComponent={
          <Text style={styles.textoVazio}>Você ainda não tem nenhuma parada favorita.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centralizado: { justifyContent: 'center', alignItems: 'center' },
  listaPadding: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContainer: { flex: 1 },
  nomeParada: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  reporteContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  textoReporte: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  botaoRemover: { padding: 8, marginLeft: 12 },
  textoVazio: { textAlign: 'center', marginTop: 40, color: '#8E8E93', fontSize: 16 },
  bannerPolicia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    gap: 5,
  },
  textoBannerPolicia: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});