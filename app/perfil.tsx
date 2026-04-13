import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { auth, db, sairDaConta } from '../chat/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TelaPerfil() {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      const usuarioAtual = auth.currentUser;
      
      if (usuarioAtual) {
        const docRef = doc(db, "usuarios", usuarioAtual.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDados(docSnap.data());
        }
      }
      setCarregando(false);
    }

    carregarPerfil();
  }, []);

  const formatarData = (timestamp: any) => {
    if (!timestamp) return "...";
    // Converte o timestamp do Firebase para data de Brasília
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR');
  };

  const handleSair = async () => {
    await sairDaConta();
    router.replace('/');
  };

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho com Foto Exemplo */}
      <View style={styles.header}>
        <View style={styles.molduraFoto}>
          <Ionicons name="person" size={80} color="#CCC" />
        </View>
        <Text style={styles.nome}>{dados?.nome || "Usuário"}</Text>
        {dados?.isUniversitario && (
          <View style={styles.badge}>
            <Text style={styles.textoBadge}>🎓 Universitário</Text>
          </View>
        )}
      </View>

      {/* Informações Privadas */}
      <View style={styles.infoBox}>
        <View style={styles.linhaInfo}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <View style={styles.textosContainer}>
            <Text style={styles.label}>E-mail (Privado)</Text>
            <Text style={styles.valor}>{dados?.email}</Text>
          </View>
        </View>

        <View style={styles.linhaInfo}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <View style={styles.textosContainer}>
            <Text style={styles.label}>Membro desde</Text>
            <Text style={styles.valor}>{formatarData(dados?.contaCriadaEm)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.botaoSair} onPress={handleSair}>
        <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#00A86B', 
    padding: 40, 
    alignItems: 'center', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  molduraFoto: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5
  },
  nome: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  badge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20, 
    marginTop: 8 
  },
  textoBadge: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  infoBox: { marginTop: 30, paddingHorizontal: 20 },
  linhaInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    elevation: 2
  },
  textosContainer: { marginLeft: 15 },
  label: { fontSize: 12, color: '#999', marginBottom: 2 },
  valor: { fontSize: 16, color: '#333', fontWeight: '500' },
  botaoSair: { 
    marginTop: 'auto', 
    marginBottom: 40, 
    marginHorizontal: 20, 
    padding: 15, 
    backgroundColor: '#FFE5E5', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  textoBotaoSair: { color: '#D9534F', fontWeight: 'bold', fontSize: 16 }
});