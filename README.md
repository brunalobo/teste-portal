# 🌊 Geoportal - Sistema de Visualização de Dados Geoespaciais

## 📁 Estrutura do Projeto
```
teste-portal/
├── index.html              # Página principal
├── assets/
│   ├── css/
│   │   └── style-clean.css  # Estilos simplificados e organizados
│   └── img/
│       └── logo_geoportal.png
└── js/
    └── app-clean.js         # JavaScript simplificado e comentado
```

## 🔧 Arquivos Principais

### `index.html`
- **Finalidade**: Estrutura HTML da aplicação
- **Componentes**: Sidebar com camadas, mapa, modal de pesquisa
- **Características**: Código limpo, bem estruturado e comentado

### `assets/css/style-clean.css`
- **Finalidade**: Estilos visuais da aplicação
- **Organização**: Seções bem definidas com comentários explicativos
- **Componentes**: Sidebar, controles, checkboxes, modal, mapa

### `js/app-clean.js`
- **Finalidade**: Lógica da aplicação
- **Funcionalidades**: Inicialização do mapa, controle de camadas, filtros, pesquisa
- **Organização**: Funções bem definidas e comentadas

## 🚀 Funcionalidades

### 📍 Mapa Interativo
- **MapLibre GL JS v4.1.0**
- **Base**: Esri Ocean World Base
- **Controles**: Navegação, tela cheia, geolocalização

### 🗂️ Sistema de Camadas
- **8 camadas geoespaciais** do ArcGIS FeatureServer
- **Toggle switches** para ativar/desativar camadas
- **Filtros por checkbox** para cada camada

### 🔍 Sistema de Pesquisa
- **Modal de pesquisa** para encontrar camadas
- **Busca em tempo real**
- **Ativação automática** de camadas encontradas

### 🎛️ Interface
- **Sidebar retrátil** com animações suaves
- **Design responsivo** com glassmorphism
- **Controles personalizados** integrados ao mapa

## 🎨 Design
- **Fonte**: Poppins (Google Fonts)
- **Cores**: Azul navy (#00425C) como cor principal
- **Estilo**: Moderno com efeitos de vidro (glassmorphism)
- **Animações**: Transições suaves para melhor UX

## 💡 Como Usar

1. **Abrir camadas**: Clique no botão de camadas no mapa
2. **Ativar camadas**: Use os toggle switches na sidebar
3. **Aplicar filtros**: Marque os checkboxes desejados
4. **Pesquisar**: Use o botão de pesquisa no mapa
5. **Explorar**: Clique nas feições para ver informações

## 🔗 Fontes de Dados
- **ArcGIS FeatureServer**: services8.arcgis.com
- **8 camadas temáticas**: Batimetria, Foz de Rios, Municípios, etc.
- **Dados abertos**: CPRM, IBGE, ANP, FUNAI, INCRA, MMA/ICMBio

## 📝 Código Simplificado
- **HTML**: Estrutura clara com comentários organizacionais
- **CSS**: Seções bem definidas com comentários explicativos
- **JavaScript**: Funções documentadas e organizadas por funcionalidade
- **Performance**: Código otimizado sem redundâncias
