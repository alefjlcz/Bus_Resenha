import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../chat/firebase';

import paradasData from '../assets/dados/banco_de_paradas.json';
import CardParada from '../components/CardParada';
import HeaderHome from '../components/HeaderHome';
import MapaResenha from '../components/MapaResenha';
import MenuLateral from '../components/MenuLateral';

import { useGPS } from '../hooks/useGPS';

// ==========================================
// 🌦️ FUNÇÃO DE TRADUÇÃO DE CLIMA (Portado do seu Python)
// ==========================================
const traduzirClima = (codigo: number) => {
  if (codigo === 0) return "☀️ Limpo";
  if ([1, 2, 3].includes(codigo)) return "⛅ Parc. Nublado";
  if ([45, 48].includes(codigo)) return "🌫️ Nevoeiro";
  if ([51, 53, 55].includes(codigo)) return "🌧️ Chuva Leve";
  if ([61, 63, 65].includes(codigo)) return "🌧️ Chuvoso";
  if ([80, 81, 82].includes(codigo)) return "🌦️ Pancadas de Chuva";
  if ([95, 96, 99].includes(codigo)) return "⚡ Tempestade";
  return "☁️ Nublado";
};

export default function App() {
  const { minhaLocalizacao, paradaAtualGeofence } = useGPS();

  const [menuAberto, setMenuAberto] = useState(false);
  const [paradaSelecionada, setParadaSelecionada] = useState<any>(null); 
  const [statusGlobal, setStatusGlobal] = useState<Record<string, string>>({});
  
  // NOVO: Estado para guardar o clima da cidade
  const [climaAtual, setClimaAtual] = useState("🌦️ Buscando clima...");

  // Ouvinte do Firebase (Status das Paradas)
  useEffect(() => {
    const q = collection(db, "status_paradas");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const novosStatus: Record<string, string> = {};
      snapshot.forEach((doc) => {
        novosStatus[doc.id] = doc.data().status;
      });
      setStatusGlobal(novosStatus);
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // ⏱️ MOTOR DO CLIMA (A CADA 10 MINUTOS)
  // ==========================================
  useEffect(() => {
    const buscarClima = async () => {
      if (!minhaLocalizacao) return; // Só busca se tiver GPS ativado
      
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${minhaLocalizacao.latitude}&longitude=${minhaLocalizacao.longitude}&current_weather=true`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        const codigo = dados.current_weather.weathercode;
        const temperatura = dados.current_weather.temperature;
        
        const textoTraduzido = traduzirClima(codigo);
        setClimaAtual(`${textoTraduzido} (${temperatura}°C)`);
      } catch (error) {
        console.log("Erro ao buscar clima da Open-Meteo:", error);
      }
    };

    // 1. Busca assim que o mapa abre
    buscarClima(); 

    // 2. Cria o timer para buscar a cada 10 minutos (10 * 60 * 1000 milissegundos)
    const intervaloClima = setInterval(buscarClima, 10 * 60 * 1000);

    // Limpa o timer se a tela for fechada
    return () => clearInterval(intervaloClima);
  }, [minhaLocalizacao]); // Refaz a busca se o usuário mudar muito de lugar

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00A86B" />
      
      <HeaderHome abrirMenu={() => setMenuAberto(true)} />

      <View style={styles.mapaContainer}>
        <MapaResenha 
          paradas={paradasData}
          minhaLocalizacao={minhaLocalizacao}
          paradaSelecionada={paradaSelecionada}
          setParadaSelecionada={setParadaSelecionada}
          statusGlobal={statusGlobal} 
        />
      </View>

      <MenuLateral 
        visivel={menuAberto} 
        fecharMenu={() => setMenuAberto(false)} 
      />

      <CardParada 
        parada={paradaSelecionada} 
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id} 
        fecharCard={() => setParadaSelecionada(null)}
        statusGlobal={statusGlobal} 
        clima={climaAtual} // PASSA O CLIMA AO VIVO PARA O CARD!
      />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B' },
  mapaContainer: { flex: 1, backgroundColor: '#EEE' }, 
});