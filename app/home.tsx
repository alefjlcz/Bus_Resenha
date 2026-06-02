import React, { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db, verificarEResetarChats } from '../chat/firebase';

import paradasData from '../assets/dados/banco_de_paradas.json';
import CardParada from '../components/CardParada';
import HeaderHome from '../components/HeaderHome';
import MapaResenha from '../components/MapaResenha';
import MenuLateral from '../components/MenuLateral';

import { useGPS } from '../hooks/useGPS';

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
  const [climaAtual, setClimaAtual] = useState("🌦️ Buscando clima...");
  const [minhasFavoritas, setMinhasFavoritas] = useState<string[]>([]);
  const alertasEnviados = useRef<Set<string>>(new Set());

  useEffect(() => {
    verificarEResetarChats();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribeUser = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().paradasFavoritas) {
        setMinhasFavoritas(docSnap.data().paradasFavoritas);
      }
    });
    return () => unsubscribeUser();
  }, []);

  useEffect(() => {
    const q = collection(db, "status_paradas");
    const unsubscribeStatus = onSnapshot(q, (snapshot) => {
      const novosStatus: Record<string, string> = {};
      snapshot.forEach((doc) => {
        novosStatus[doc.id] = doc.data().status;
      });
      setStatusGlobal(novosStatus);
    });
    return () => unsubscribeStatus();
  }, []);

  useEffect(() => {
    minhasFavoritas.forEach(idParada => {
      if (statusGlobal[idParada] === "perigoso") {
        if (!alertasEnviados.current.has(idParada)) {
          const nomeDaParada = paradasData.find(p => p.id.toString() === idParada)?.nome || "Uma parada favorita";

          Alert.alert(
            "🔔 ALERTA DE SEGURANÇA",
            `Atenção! Relatos de PERIGO recentes em sua parada favorita:\n\n📍 ${nomeDaParada}\n\nEvite o local e mantenha-se seguro.`
          );

          alertasEnviados.current.add(idParada);
        }
      } else {
        alertasEnviados.current.delete(idParada);
      }
    });
  }, [statusGlobal, minhasFavoritas]);

  useEffect(() => {
    const buscarClima = async () => {
      if (!minhaLocalizacao) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${minhaLocalizacao.latitude}&longitude=${minhaLocalizacao.longitude}&current_weather=true`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        const textoTraduzido = traduzirClima(dados.current_weather.weathercode);
        setClimaAtual(`${textoTraduzido} (${dados.current_weather.temperature}°C)`);
      } catch (error) {
        console.log("Erro clima:", error);
      }
    };
    buscarClima();
    const intervaloClima = setInterval(buscarClima, 10 * 60 * 1000);
    return () => clearInterval(intervaloClima);
  }, [minhaLocalizacao]);

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

      <MenuLateral visivel={menuAberto} fecharMenu={() => setMenuAberto(false)} />

      <CardParada
        parada={paradaSelecionada}
        usuarioEstaNaParada={paradaAtualGeofence?.id === paradaSelecionada?.id}
        fecharCard={() => setParadaSelecionada(null)}
        statusGlobal={statusGlobal}
        clima={climaAtual}
        favoritas={minhasFavoritas}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B' },
  mapaContainer: { flex: 1, backgroundColor: '#EEE' },
});