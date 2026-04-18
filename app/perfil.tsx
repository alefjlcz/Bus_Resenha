import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { atualizarAvatar, atualizarTagLinha, auth, db, sairDaConta } from '../chat/firebase';

// ==========================================
// 🖼️ DICIONÁRIO DE AVATARES
// Troque os nomes dos arquivos aqui embaixo
// para bater com as imagens que você baixou!
// ==========================================
const LISTA_AVATARES = [
  { id: 'Mulher Meditando', img: require('../assets/avatares/meditacao_mulher.png'), nome: 'Mulher Meditando' },
  { id: 'Homem Meditando', img: require('../assets/avatares/meditacao_homem.png'), nome: 'Homem Meditando' },
];

export default function TelaPerfil() {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estados para o Modal da TAG
  const [modalTagVisivel, setModalTagVisivel] = useState(false);
  const [inputTag, setInputTag] = useState('');

  // Estados para o Modal do AVATAR
  const [modalAvatarVisivel, setModalAvatarVisivel] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      const usuarioAtual = auth.currentUser;
      
      if (usuarioAtual) {
        const docRef = doc(db, "usuarios", usuarioAtual.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDados(docSnap.data());
          setInputTag(docSnap.data().tagLinha || ''); 
        }
      }
      setCarregando(false);
    }

    carregarPerfil();
  }, []);

  // Define qual imagem mostrar (Se não tiver no banco, mostra a primeira da lista)
  const imagemAtual = LISTA_AVATARES.find(a => a.id === dados?.avatarId)?.img || LISTA_AVATARES[0].img;

  const formatarData = (timestamp: any) => {
    if (!timestamp) return "...";
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR');
  };

  // Salva a TAG (Discord Style)
  const handleSalvarTag = async () => {
    if (auth.currentUser) {
      try {
        await atualizarTagLinha(auth.currentUser.uid, inputTag.trim());
        setDados((prev: any) => ({ ...prev, tagLinha: inputTag.trim() }));
        setModalTagVisivel(false);
        Alert.alert("Sucesso", "Sua tag foi atualizada!");
      } catch (error) {
        Alert.alert("Erro", "Não foi possível salvar a tag.");
      }
    }
  };

  // Salva o AVATAR
  const selecionarAvatar = async (idAvatar: string) => {
    if (auth.currentUser) {
      try {
        await atualizarAvatar(auth.currentUser.uid, idAvatar);
        setDados((prev: any) => ({ ...prev, avatarId: idAvatar }));
        setModalAvatarVisivel(false);
      } catch (error) {
        Alert.alert("Erro", "Falha ao salvar a foto de perfil.");
      }
    }
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
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        {/* FOTO CLICÁVEL */}
        <TouchableOpacity style={styles.molduraFoto} onPress={() => setModalAvatarVisivel(true)}>
          <Image source={imagemAtual} style={styles.fotoPerfil} />
          <View style={styles.badgeEdit}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.nomeContainer}>
          <Text style={styles.nome}>{dados?.nome || "Usuário"}</Text>
          {dados?.tagLinha ? (
            <View style={styles.discordBadge}>
              <Text style={styles.discordBadgeText}>🚌 {dados.tagLinha}</Text>
            </View>
          ) : null}
        </View>

        {dados?.isUniversitario && (
          <View style={styles.badge}>
            <Text style={styles.textoBadge}>🎓 Universitário</Text>
          </View>
        )}
      </View>

      {/* INFORMAÇÕES E BOTÕES */}
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

        {/* BOTÃO TROCAR FOTO */}
        <TouchableOpacity style={styles.botaoAcao} onPress={() => setModalAvatarVisivel(true)}>
          <Ionicons name="image-outline" size={20} color="#FFF" />
          <Text style={styles.textoBotaoAcao}>Trocar Foto de Perfil</Text>
        </TouchableOpacity>

        {/* BOTÃO DEFINIR TAG */}
        <TouchableOpacity style={[styles.botaoAcao, { backgroundColor: '#333' }]} onPress={() => setModalTagVisivel(true)}>
          <Ionicons name="bus-outline" size={20} color="#FFF" />
          <Text style={styles.textoBotaoAcao}>Definir Linha Favorita</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botaoSair} onPress={handleSair}>
        <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* ========================================= */}
      {/* 1. MODAL DE TAG (TEXTO) */}
      {/* ========================================= */}
      <Modal animationType="fade" transparent={true} visible={modalTagVisivel} onRequestClose={() => setModalTagVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sua Linha Favorita</Text>
            <Text style={styles.modalSubTitle}>Essa tag vai aparecer ao lado do seu nome no chat.</Text>
            
            <TextInput
              style={styles.inputModal}
              placeholder="Ex: 932, 316, Icoaraci..."
              value={inputTag}
              onChangeText={setInputTag}
              maxLength={15} 
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={[styles.botaoModal, styles.botaoCancelar]} onPress={() => setModalTagVisivel(false)}>
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoModal, styles.botaoSalvar]} onPress={handleSalvarTag}>
                <Text style={styles.textoBotaoSalvar}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* 2. MODAL DE FOTO DE PERFIL (AVATAR) */}
      {/* ========================================= */}
      <Modal animationType="slide" transparent={true} visible={modalAvatarVisivel} onRequestClose={() => setModalAvatarVisivel(false)}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalContentAvatar}>
            <Text style={styles.modalTitle}>Escolha seu Avatar</Text>
            
            <FlatList
              data={LISTA_AVATARES}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.itemAvatar, dados?.avatarId === item.id ? styles.avatarSelecionado : null]} 
                  onPress={() => selecionarAvatar(item.id)}
                >
                  <Image source={item.img} style={styles.imgOpcao} />
                  <Text style={styles.nomeAvatar}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.botaoFecharModal} onPress={() => setModalAvatarVisivel(false)}>
              <Text style={styles.textoFecharModal}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#00A86B', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  
  // Estilos da Foto no Perfil
  molduraFoto: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', elevation: 5, position: 'relative', marginBottom: 15 },
  fotoPerfil: { width: 120, height: 120, borderRadius: 60 },
  badgeEdit: { position: 'absolute', bottom: 0, right: 5, backgroundColor: '#333', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
  
  nomeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nome: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  discordBadge: { backgroundColor: '#1E1F22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 10 },
  discordBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  textoBadge: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  infoBox: { marginTop: 30, paddingHorizontal: 20 },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  textosContainer: { marginLeft: 15 },
  label: { fontSize: 12, color: '#999', marginBottom: 2 },
  valor: { fontSize: 16, color: '#333', fontWeight: '500' },
  
  botaoAcao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00A86B', padding: 15, borderRadius: 12, marginTop: 10, elevation: 2 },
  textoBotaoAcao: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  botaoSair: { marginTop: 'auto', marginBottom: 40, marginHorizontal: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  textoBotaoSair: { color: '#D9534F', fontWeight: 'bold', fontSize: 16 },

  // Estilos do Modal TAG
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalSubTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inputModal: { width: '100%', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  modalBotoes: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  botaoModal: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  botaoCancelar: { backgroundColor: '#E0E0E0' },
  textoBotaoCancelar: { color: '#333', fontWeight: 'bold' },
  botaoSalvar: { backgroundColor: '#00A86B' },
  textoBotaoSalvar: { color: '#FFF', fontWeight: 'bold' },

  // Estilos do Modal AVATAR
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContentAvatar: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '60%' },
  itemAvatar: { flex: 1, alignItems: 'center', margin: 5, padding: 10, borderRadius: 15 },
  avatarSelecionado: { backgroundColor: '#E8F5E9', borderColor: '#00A86B', borderWidth: 2 },
  imgOpcao: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F0F0' },
  nomeAvatar: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center', fontWeight: 'bold' },
  botaoFecharModal: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  textoFecharModal: { fontWeight: 'bold', color: '#333', fontSize: 16 }
});