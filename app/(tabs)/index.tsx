import { Ionicons } from '@expo/vector-icons'; // <-- Adicionado para o ícone do menu
import React, { useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';

import paradasData from '../../assets/dados/banco_de_paradas.json';
import { styles } from './styles';

import CardParada from '../../components/CardParada';
import MapaResenha from '../../components/MapaResenha';
import MenuLateral from '../../components/MenuLateral'; // <-- O novo componente!

export default function App() {
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<any>(null);
  const [paradaAtualGeofence, setParadaAtualGeofence] = useState<any>(null);
  const [statusGlobal, setStatusGlobal] = useState<Record<string, string>>({});

  const registrarResenha = (idParada: string, status: string) => {
    setStatusGlobal(prev => ({
      ...prev,
      [idParada]: status
    }));
  };
  
  // --- NOVO ESTADO: Controle da Gaveta ---
  const [menuAberto, setMenuAberto] = useState(false);


  // ... (Toda a sua lógica dos useEffects do GPS e setInterval fica intacta aqui) ...

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00A86B" />
      
      {/* --- O NOVO CABEÇALHO --- */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 }]}>
        
        {/* O BOTÃO DOS 3 RISQUINHOS */}
        <TouchableOpacity onPress={() => setMenuAberto(true)} style={{ padding: 5 }}>
          <Ionicons name="menu" size={32} color="#FFF" />
        </TouchableOpacity>

        {/* TÍTULO CENTRALIZADO */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Bus Resenha</Text>
          <Text style={styles.headerSubtitle}>Vem beber com nós</Text>
        </View>

        {/* Espaço vazio na direita para manter o título perfeitamente no centro */}
        <View style={{ width: 42 }} /> 
      </View>

      <MapaResenha 
        paradas={paradasData}
        minhaLocalizacao={minhaLocalizacao}
        paradaSelecionada={paradaSelecionada}
        setParadaSelecionada={setParadaSelecionada}
        statusGlobal={statusGlobal} 
      />

      {/* --- A GAVETA LATERAL --- */}
      <MenuLateral 
        visivel={menuAberto} 
        fecharMenu={() => setMenuAberto(false)} 
      />

      <CardParada 
        parada={paradaSelecionada} 
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id} 
        fecharCard={() => setParadaSelecionada(null)}
        statusGlobal={statusGlobal} 
        registrarResenha={registrarResenha} 
      />
      
    </View>
  );
}