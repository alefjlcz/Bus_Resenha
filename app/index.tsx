import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Puxando APENAS as funções do nosso banco para E-mail e Senha
import { auth, criarConta, entrarNaConta, sairDaConta } from '../chat/firebase';

export default function TelaLogin() {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  //       LEMBRAR CONTA 
  useEffect(() => {
    const ouvinte = onAuthStateChanged(auth, (user) => {
      // Só joga pro mapa se o cara tiver logado E com e-mail verificado!
      if (user && user.emailVerified) {
        router.replace('/home');
      }
    });
    return () => ouvinte();
  }, []);

  const handleAutenticacao = async () => {
    if (!email || !senha || (modoCadastro && !nome)) {
      Alert.alert('Ops!', 'Preencha todos os campos.');
      return;
    }

    setCarregando(true);
    
    try {
      if (modoCadastro) {
        // Cria a conta e o Firebase já manda o e-mail automático
        await criarConta(nome, email.trim(), senha);
        Alert.alert(
          'Quase lá!', 
          'Conta criada com sucesso! 📧 Vá na sua caixa de entrada (ou spam) e clique no link para confirmar.'
        );
        
        //  Desloga a pessoa para ela não entrar "burlada"
        await sairDaConta(); 
        setModoCadastro(false); // Volta a tela para o modo "Entrar"
        
      } else {
        // Tenta fazer o Login
        const usuario = await entrarNaConta(email.trim(), senha);
        
        // TRAVA DE SEGURANÇA 🔒
        if (!usuario.emailVerified) {
          await sairDaConta(); // Expulsa o usuário se não confirmou
          Alert.alert(
            'Acesso Bloqueado', 
            'Você ainda não confirmou seu e-mail! Vá na sua caixa de entrada e clique no link que enviamos.'
          );
          setCarregando(false);
          return; 
        }
 
        // Se chegou aqui, o e-mail tá verificado! 
        // O Auto-login lá de cima já vai jogar o usuário pra /home automaticamente!
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message); 
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.box}>
        <Text style={styles.titulo}>Bus Resenha</Text>
        <Text style={styles.subtitulo}>{modoCadastro ? 'Crie sua conta' : 'Bem-vindo!'}</Text>

        {modoCadastro && (
          <TextInput
            style={styles.input}
            placeholder="Seu Nome"
            value={nome}
            onChangeText={setNome}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.botaoPrincipal} onPress={handleAutenticacao} disabled={carregando}>
          <Text style={styles.textoBotao}>{carregando ? 'Aguarde...' : (modoCadastro ? 'Cadastrar' : 'Entrar')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)}>
          <Text style={styles.textoTrocar}>
            {modoCadastro ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#00A86B', textAlign: 'center', marginBottom: 5 },
  subtitulo: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16 },
  botaoPrincipal: { backgroundColor: '#00A86B', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  textoBotao: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  textoTrocar: { textAlign: 'center', color: '#00A86B', fontWeight: 'bold', marginTop: 10 }
});