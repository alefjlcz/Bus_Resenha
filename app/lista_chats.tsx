import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Puxando o banco de dados local das linhas (saindo de 'app', entrando em 'assets')
import linhasData from '../assets/dados/linhas_onibus.json';

export default function ListaChatsScreen() {
  const router = useRouter();

  const entrarNoChat = (idLinha: string, nomeLinha: string) => {
    // Viaja para o chat levando o ID e o Nome da linha na mala
    router.push({
      pathname: '/chat',
      params: { idLinha, nomeLinha }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escolha a Linha</Text>
      </View>

      <FlatList
        data={linhasData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.cardLinha} 
            onPress={() => entrarNoChat(item.id, item.nome)}
          >
            <View style={styles.iconeContainer}>
              <Ionicons name="bus" size={24} color="#FFF" />
            </View>
            <View style={styles.textoContainer}>
              <Text style={styles.numeroLinha}>{item.id}</Text>
              <Text style={styles.nomeLinha}>{item.nome}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#00A86B', padding: 20, paddingTop: 40, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
  },
  iconeContainer: { backgroundColor: '#00A86B', padding: 10, borderRadius: 50, marginRight: 15 },
  textoContainer: { flex: 1 },
  numeroLinha: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  nomeLinha: { fontSize: 14, color: '#666' }
});