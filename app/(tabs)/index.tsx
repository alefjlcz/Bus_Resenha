import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

// 🧩 IMPORTAÇÃO DOS COMPONENTES VISUAIS (As peças de Lego)
import paradasData from '../../assets/dados/banco_de_paradas.json';
import CardParada from '../../components/CardParada';
import HeaderHome from '../../components/HeaderHome';
import MapaResenha from '../../components/MapaResenha';
import MenuLateral from '../../components/MenuLateral';

// 🧠 IMPORTAÇÃO DA LÓGICA (O Cérebro)
import { useGPS } from '../../hooks/useGPS';

export default function App() {
  // 1. O Maestro puxando a lógica oculta do GPS
  const { minhaLocalizacao, paradaAtualGeofence } = useGPS();

  // 2. Estados simples de controle de tela
  const [menuAberto, setMenuAberto] = useState(false);
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [statusGlobal, setStatusGlobal] = useState<Record<string, string>>({});

  const registrarResenha = (idParada: string, status: string) => {
    setStatusGlobal(prev => ({ ...prev, [idParada]: status }));
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      console.log("🔄 Buscando novas resenhas...");
    }, 15 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  // 3. Renderização extremamente limpa!
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
          statusGlobal={statusGlobal} 
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
        registrarResenha={registrarResenha} 
      />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B' },
  mapaContainer: { flex: 1, backgroundColor: '#EEE' }, 
});