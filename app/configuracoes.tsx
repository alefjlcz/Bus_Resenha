import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TelaConfiguracoes() {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [raioAtual, setRaioAtual] = useState(0.5); // Padrão 500m

  // Opções disponíveis para o usuário
  const opcoesRaio = [
    { label: '250 metros', valor: 0.25 },
    { label: '500 metros', valor: 0.5 },
    { label: '750 metros', valor: 0.75 },
    { label: '1 km', valor: 1 },
    { label: '2 km', valor: 2 },
    { label: '5 km', valor: 5 },
    { label: '10 km', valor: 10 },
  ];

  // Carrega o raio salvo assim que a tela abre
  useEffect(() => {
    const carregarRaio = async () => {
      try {
        const salvo = await AsyncStorage.getItem('@raio_visual');
        if (salvo !== null) {
          setRaioAtual(parseFloat(salvo));
        }
      } catch (e) {
        console.error("Erro ao carregar raio", e);
      }
    };
    carregarRaio();
  }, []);

  // Salva o novo raio escolhido
  const salvarNovoRaio = async (valor: number) => {
    try {
      await AsyncStorage.setItem('@raio_visual', valor.toString());
      setRaioAtual(valor);
      setModalVisivel(false);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a configuração.");
    }
  };

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
        
        <Text style={styles.secaoTitulo}>Mapa</Text>

        {/* 🗺️ BOTÃO DE RAIO DE VISÃO */}
        <TouchableOpacity style={styles.opcaoBotao} onPress={() => setModalVisivel(true)}>
          <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="map" size={24} color="#1976D2" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opcaoTxt}>Raio de Visão no Mapa</Text>
            <Text style={styles.subTextoDescricao}>
              Atual: {opcoesRaio.find(o => o.valor === raioAtual)?.label || '500 metros'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <Text style={styles.secaoTitulo}>Geral</Text>

        {/* ℹ️ BOTÃO SOBRE O APP */}
        <TouchableOpacity style={styles.opcaoBotao} onPress={mostrarSobreOApp}>
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={24} color="#00A86B" />
          </View>
          <Text style={styles.opcaoTxt}>Sobre o Aplicativo</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

      </View>

      {/* 🛑 MODAL DE ESCOLHA DO RAIO */}
      <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha o Raio de Visão</Text>
            
            {opcoesRaio.map((opcao) => (
              <TouchableOpacity 
                key={opcao.valor} 
                style={[
                  styles.opcaoRaio, 
                  raioAtual === opcao.valor && styles.opcaoRaioSelecionada
                ]}
                onPress={() => salvarNovoRaio(opcao.valor)}
              >
                <Text style={[
                  styles.textoOpcaoRaio,
                  raioAtual === opcao.valor && styles.textoOpcaoRaioSelecionada
                ]}>
                  {opcao.label}
                </Text>
                {raioAtual === opcao.valor && <Ionicons name="checkmark-circle" size={24} color="#00A86B" />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.btnCancelarModal} onPress={() => setModalVisivel(false)}>
              <Text style={styles.txtBtnCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#00A86B', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 } },
  btnVoltar: { padding: 5 },
  tituloHeader: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  menuConfig: { padding: 20 },
  secaoTitulo: { fontSize: 14, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 10, marginTop: 15, marginLeft: 5 },
  opcaoBotao: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  opcaoTxt: { fontSize: 16, fontWeight: '600', color: '#333' },
  subTextoDescricao: { fontSize: 13, color: '#666', marginTop: 2 },
  
  // Estilos do Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  opcaoRaio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  opcaoRaioSelecionada: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, borderBottomWidth: 0 },
  textoOpcaoRaio: { fontSize: 16, color: '#444' },
  textoOpcaoRaioSelecionada: { fontWeight: 'bold', color: '#00A86B' },
  btnCancelarModal: { marginTop: 20, padding: 15, backgroundColor: '#F5F5F5', borderRadius: 10, alignItems: 'center' },
  txtBtnCancelar: { fontSize: 16, fontWeight: 'bold', color: '#666' }
});