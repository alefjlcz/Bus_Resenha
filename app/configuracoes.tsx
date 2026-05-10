import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TelaConfiguracoes() {
  
  const mostrarSobreOApp = () => {
    Alert.alert(
      "ℹ️ Sobre o Bus Resenha",
      "Versão: 1.0.0 (MVP)\n\nDesenvolvido para facilitar a vida de quem usa transporte público na região metropolitana, trazendo alertas em tempo real através da colaboração dos passageiros.\n\n"
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.tituloHeader}>Configurações</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <View style={styles.menuConfig}>
        
        <Text style={styles.secaoTitulo}>Geral</Text>

        <TouchableOpacity style={styles.opcaoBotao} onPress={mostrarSobreOApp}>
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={24} color="#00A86B" />
          </View>
          <Text style={styles.opcaoTxt}>Sobre o Aplicativo</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.setaDireita} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#00A86B',
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  btnVoltar: { padding: 5 },
  tituloHeader: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  menuConfig: { padding: 20 },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 15,
    marginLeft: 5
  },
  opcaoBotao: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2 
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  opcaoTxt: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  setaDireita: { marginLeft: 'auto' },
  badgeEmBreve: {
    backgroundColor: '#EEE',
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden'
  }
});