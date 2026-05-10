import React from 'react';
// Importamos o StatusBar aqui do react-native
import { Ionicons } from '@expo/vector-icons';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  abrirMenu: () => void;
}

export default function HeaderHome({ abrirMenu }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={abrirMenu} style={styles.botaoMenu}>
        <Ionicons name="menu" size={32} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.tituloContainer}>
        <Text style={styles.headerTitle}>Bus Resenha</Text>
        <Text style={styles.headerSubtitle}>Qual parada vamos hoje?</Text>
      </View>

      <View style={{ width: 40 }} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00A86B',
    paddingHorizontal: 15,
    paddingBottom: 15, // Adicionei um respiro na parte de baixo também
    
    // A MÁGICA ACONTECE AQUI 👇
    // Pega o tamanho exato da barra de status do celular e soma mais 10 de margem
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 0,
  },
  botaoMenu: { padding: 5 },
  tituloContainer: { alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#FFF', fontSize: 12, opacity: 0.8 },
});