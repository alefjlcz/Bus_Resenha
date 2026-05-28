<h1 align="center">
  🚌 Bus Resenha
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Status-Em_Desenvolvimento-green?style=for-the-badge" alt="Status" />
</p>

## 📌 Sobre o Projeto

O **Bus Resenha** é um aplicativo desenvolvido para transformar a experiência dos usuários de transporte público. O projeto nasceu da necessidade de aliar **mobilidade urbana** à **segurança**, permitindo que os passageiros otimizem seu tempo e evitem exposições desnecessárias em paradas de ônibus.

Com uma interface intuitiva, o app fornece informações em tempo real sobre trajetos e inclui recursos focados no bem-estar e na segurança do usuário enquanto aguarda o transporte.

## ✨ Principais Funcionalidades

* **📍 Rastreamento em Tempo Real:** Acompanhamento da localização exata dos ônibus e estimativa precisa de chegada à parada.
* **🛡️ Alertas de Segurança:** Mapeamento de paradas com base na iluminação, movimentação e alertas da comunidade, visando rotas mais seguras.
* **🗺️ Planejamento de Rotas:** Sugestões de trajetos otimizados, combinando caminhada e transporte público.
* **🔔 Notificações Inteligentes:** Avisos automáticos quando o ônibus estiver se aproximando do ponto selecionado.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias:

**Frontend (Mobile)**
* [React Native](https://reactnative.dev/)
* [Expo](https://expo.dev/) (se aplicável)
* [React Navigation](https://reactnavigation.org/) para roteamento

**Backend & Dados**
* [Python](https://www.python.org/)
* [Firebase] (https://firebase.google.com)
* Integração com APIs de Geoposicionamento (ex: Google Maps API)

## 🚀 Como Executar o Projeto

Para rodar este projeto localmente em sua máquina (ambiente Windows/Linux/macOS), siga os passos abaixo:

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* [Node.js](https://nodejs.org/)
* [Git](https://git-scm.com/)
* Gerenciador de pacotes (`npm` ou `yarn`)
* Ambiente Python configurado (para o backend)

### 1. Clonando o Repositório

```bash
git clone [https://github.com/alefjlcz/bus_resenha.git](https://github.com/alefjlcz/bus_resenha.git)
cd bus_resenha
```

### 2. Configurando o Frontend
# Entre na pasta do app
cd app

# Instale as dependências
npm install
# ou
yarn install

# Inicie o servidor de desenvolvimento
npx expo start

### 3. CONTROLE DE API

# Entre na pasta do backend
cd backend

# Crie um ambiente virtual e ative-o
python -m venv venv
.\venv\Scripts\activate  # No Windows

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python main.py

