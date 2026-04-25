import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

// IMPORTAÇÃO DO FIREBASE (A Mágica do Tempo Real)
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../chat/firebase';

// IMPORTAÇÃO DOS COMPONENTES VISUAIS 
import paradasData from '../assets/dados/banco_de_paradas.json';
import CardParada from '../components/CardParada';
import HeaderHome from '../components/HeaderHome';
import MapaResenha from '../components/MapaResenha';
import MenuLateral from '../components/MenuLateral';

import { useGPS } from '../hooks/useGPS';

export default function App() {
  // 1. Puxando a lógica do GPS
  const { minhaLocalizacao, paradaAtualGeofence } = useGPS();

  // 2. Estados de controle de tela e banco de dados
  const [menuAberto, setMenuAberto] = useState(false);
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [statusGlobal, setStatusGlobal] = useState<Record<string, string>>({});

  // 3. O Ouvinte do Firebase (Substitui o setInterval antigo)
  useEffect(() => {
    const q = collection(db, "status_paradas");
    
    // Fica escutando o banco 24h por dia. 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const novosStatus: Record<string, string> = {};
      snapshot.forEach((doc) => {
        novosStatus[doc.id] = doc.data().status;
      });
      
      // Atualiza o mapa na hora!
      setStatusGlobal(novosStatus);
    });

    // Desliga a escuta se a tela for fechada (economiza bateria)
    return () => unsubscribe();
  }, []);

  // 4. Renderização
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00A86B" />
      
      {/* O CABEÇALHO */}
      <HeaderHome abrirMenu={() => setMenuAberto(true)} />

      {/* O MAPA */}
      <View style={styles.mapaContainer}>
        <MapaResenha 
          paradas={paradasData}
          minhaLocalizacao={minhaLocalizacao}
          paradaSelecionada={paradaSelecionada}
          setParadaSelecionada={setParadaSelecionada}
          statusGlobal={statusGlobal} // Passa os dados do Firebase pro mapa
        />
      </View>

      {/* A GAVETA (Oculta até ser chamada) */}
      <MenuLateral 
        visivel={menuAberto} 
        fecharMenu={() => setMenuAberto(false)} 
      />

      {/* O CARD (Oculto até clicar no ponto) */}
      <CardParada 
        parada={paradaSelecionada} 
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id} 
        fecharCard={() => setParadaSelecionada(null)}
        statusGlobal={statusGlobal} 
        // Passando uma função vazia só pro TypeScript não reclamar, 
        // já que o próprio CardParada agora salva direto no Firebase!
        registrarResenha={() => {}} 
      />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B' },
  mapaContainer: { flex: 1, backgroundColor: '#EEE' }, 
});