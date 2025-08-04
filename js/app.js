let map; // Objeto principal do mapa
let layersData = {}; // Armazena os dados carregados das camadas

// ---- CONFIGURAÇÃO DAS CAMADAS ----
// URLs dos serviços ArcGIS com os dados geográficos
const layerConfigs = {
    'batimetria': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/Batimetria_Linha_CPRM_nov2013/FeatureServer',
        name: 'Batimetria'
    },
    'foz-rios': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/IBP_MAREM_FozdeRio/FeatureServer',
        name: 'Foz de Rios'
    },
    'municipios': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/Municipios_Costeiros_IBGE_jul2020/FeatureServer',
        name: 'Municípios Costeiros'
    },
    'sensibilidade-litoral': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/IBP_MAREM_Indice_de_Sensibilidade_do_Litoral/FeatureServer',
        name: 'Sensibilidade do Litoral'
    },
    'bacias-sedimentares': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/Bacias_Sedimentares_ANP_dez2020/FeatureServer',
        name: 'Bacias Sedimentares'
    },
    'terras-indigenas': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/IBP_MAREM_TerrasIndigenas_pl_FUNAI2021/FeatureServer',
        name: 'Terras Indígenas'
    },
    'areas-quilombolas': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/IBP_MAREM_AreasQuilombolas_INCRA2023_shp/FeatureServer',
        name: 'Áreas Quilombolas'
    },
    'unidades-conservacao': {
        url: 'https://services8.arcgis.com/5ekuCm03ET77DU3P/arcgis/rest/services/Unidades_de_Conservacao_MMAICMBIO_jun2020/FeatureServer',
        name: 'Unidades de Conservação'
    }
};

// ---- INICIALIZAÇÃO DA APLICAÇÃO ----
// Executa quando a página termina de carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupToggleSwitches();
});

// Configura os botões liga/desliga das camadas
function setupToggleSwitches() {
    // Clique nos botões toggle
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', function() {
            if (this.classList.contains('loading')) return; // Impede clique durante carregamento
            
            const checkbox = this.previousElementSibling;
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
    
    // Clique nos rótulos das camadas
    document.querySelectorAll('.layer-item label').forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault();
            
            const checkbox = document.getElementById(this.getAttribute('for'));
            const toggleSwitch = checkbox?.nextElementSibling;
            
            if (toggleSwitch?.classList.contains('loading')) return;
            
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
}

// ---- INICIALIZAÇÃO DO MAPA ----
// Cria o mapa com tema escuro e controles básicos
function initializeMap() {
    try {
        // Criar o mapa com configuração escura
        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'esri-dark': {
                        type: 'raster',
                        tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
                        tileSize: 256,
                        attribution: 'Tiles © Esri'
                    }
                },
                layers: [{
                    id: 'esri-dark-layer',
                    type: 'raster',
                    source: 'esri-dark'
                }]
            },
            center: [-43.2, -22.9], // Região do Rio de Janeiro
            zoom: 8,
            minZoom: 3,
            maxZoom: 18
        });

        // Adicionar controles quando o mapa carregar
        map.on('load', function() {
            addMapControls();
            console.log('✅ Mapa carregado com sucesso!');
        });

        // Tratar erros do mapa
        map.on('error', function(e) {
            console.error('❌ Erro no mapa:', e);
        });

    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
    }
}

// ---- CONTROLES DO MAPA ----
// Adiciona todos os controles necessários ao mapa
function addMapControls() {
    // Botão de camadas personalizado
    class LayersControl {
        onAdd(map) {
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = `
                <button type="button" class="layers-control" onclick="toggleSidebar()" title="Abrir painel de camadas">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z"/>
                    </svg>
                </button>
            `;
            return this._container;
        }
        onRemove() {
            this._container.parentNode.removeChild(this._container);
        }
    }
    
    // Botão de pesquisa personalizado
    class SearchControl {
        onAdd(map) {
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = `
                <button type="button" class="search-control" onclick="openSearchModal()" title="Pesquisar camadas">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                    </svg>
                </button>
            `;
            return this._container;
        }
        onRemove() {
            this._container.parentNode.removeChild(this._container);
        }
    }
    
    // Adicionar controles customizados
    map.addControl(new LayersControl(), 'top-left');
    map.addControl(new SearchControl(), 'top-left');

    // Controles padrão do MapLibre
    map.addControl(new maplibregl.NavigationControl(), 'top-right'); // Zoom e rotação
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right'); // Escala
    map.addControl(new maplibregl.FullscreenControl(), 'top-right'); // Tela cheia
    
    // Controle de geolocalização
    const geoControl = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
    });
    map.addControl(geoControl, 'top-right');
    
    // Feedback da geolocalização
    geoControl.on('geolocate', () => console.log('📍 Localização encontrada'));
    geoControl.on('error', () => alert('Não foi possível acessar sua localização'));
}

// ---- FUNÇÕES UTILITÁRIAS ----
// Reseta a visualização do mapa para posição inicial
function resetView() {
    map.easeTo({
        center: [-43.2, -22.9], // Região do Rio de Janeiro
        zoom: 8,
        pitch: 0,
        bearing: 0,
        duration: 1000
    });
}

// Define o estilo visual de cada camada baseado no tipo
function getLayerStyle(layerId, geometryType) {
    // Estilos específicos para cada camada
    const styles = {
        'batimetria': {
            type: 'line',
            paint: {
                'line-color': '#0066cc',
                'line-width': 2,
                'line-opacity': 0.8
            }
        },
        'foz-rios': {
            type: 'circle',
            paint: {
                'circle-color': '#00aaff',
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': 0.8
            }
        },
        'municipios': {
            type: 'fill',
            paint: {
                'fill-color': '#ffaa00',
                'fill-opacity': 0.4,
                'fill-outline-color': '#ff8800'
            }
        },
        'sensibilidade-litoral': {
            type: 'fill',
            paint: {
                'fill-color': '#ff6600',
                'fill-opacity': 0.5,
                'fill-outline-color': '#cc3300'
            }
        },
        'bacias-sedimentares': {
            type: 'fill',
            paint: {
                'fill-color': '#8a2be2',
                'fill-opacity': 0.4,
                'fill-outline-color': '#6a1b9a'
            }
        },
        'blocos-exploracao': {
            type: 'fill',
            paint: {
                'fill-color': '#4caf50',
                'fill-opacity': 0.4,
                'fill-outline-color': '#2e7d32'
            }
        },
        'campos-petroleo': {
            type: 'circle',
            paint: {
                'circle-color': '#f44336',
                'circle-radius': 8,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': 0.9
            }
        },
        'pocos-petroleo': {
            type: 'circle',
            paint: {
                'circle-color': '#9c27b0',
                'circle-radius': 5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1,
                'circle-opacity': 0.8
            }
        }
    };

    // Retorna o estilo específico ou um padrão baseado na geometria
    return styles[layerId] || {
        type: geometryType === 'Polygon' || geometryType === 'MultiPolygon' ? 'fill' :
              geometryType === 'LineString' || geometryType === 'MultiLineString' ? 'line' : 'circle',
        paint: geometryType === 'Polygon' || geometryType === 'MultiPolygon' ? {
            'fill-color': '#00425C',
            'fill-opacity': 0.5,
            'fill-outline-color': '#003d52'
        } : geometryType === 'LineString' || geometryType === 'MultiLineString' ? {
            'line-color': '#00425C',
            'line-width': 2
        } : {
            'circle-color': '#00425C',
            'circle-radius': 6,
            'circle-opacity': 0.8
        }
    };
}

// ---- CONTROLE DE CAMADAS ----
// Liga/desliga uma camada específica do mapa
async function toggleLayer(layerId) {
    const checkbox = document.getElementById(`${layerId}-layer`);
    const toggleSwitch = checkbox?.nextElementSibling;
    
    if (!checkbox || !toggleSwitch) {
        console.error(`❌ Elementos não encontrados para: ${layerId}`);
        return;
    }
    
    const isChecked = checkbox.checked;

    try {
        if (isChecked) {
            // Desativar temporariamente durante carregamento
            checkbox.checked = false;
            toggleSwitch.classList.add('loading');
            
            // Carregar dados se necessário
            if (!layersData[layerId]) {
                console.log(`📥 Carregando camada: ${layerConfigs[layerId]?.name}`);
                
                const data = await loadLayerData(layerId);
                if (!data || !data.features || data.features.length === 0) {
                    toggleSwitch.classList.remove('loading');
                    alert(`Não foi possível carregar dados para: ${layerConfigs[layerId]?.name || layerId}`);
                    return;
                }
                layersData[layerId] = data;
            }

            // Adicionar camada ao mapa
            addLayerToMap(layerId);
            
            // Ativar toggle após carregamento
            toggleSwitch.classList.remove('loading');
            checkbox.checked = true;
            console.log(`✅ Camada ativada: ${layerId}`);

        } else {
            // Desativar camada (imediato)
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'none');
                console.log(`❌ Camada desativada: ${layerId}`);
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao alternar camada ${layerId}:`, error);
        toggleSwitch.classList.remove('loading');
        checkbox.checked = false;
        alert(`Erro ao carregar camada: ${error.message}`);
    }
}

// Carrega dados de uma camada do ArcGIS
async function loadLayerData(layerId) {
    const config = layerConfigs[layerId];
    if (!config) return null;

    const queryUrl = `${config.url}/query?where=1%3D1&outFields=*&f=geojson&outSR=4326`;
    
    try {
        const response = await fetch(queryUrl);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const data = await response.json();
        console.log(`📊 Dados carregados para ${layerId}:`, data.features.length, 'features');
        return data;
        
    } catch (error) {
        console.error(`❌ Erro ao carregar dados de ${layerId}:`, error);
        throw error;
    }
}

// Adiciona uma camada ao mapa
function addLayerToMap(layerId) {
    const data = layersData[layerId];
    const config = layerConfigs[layerId];
    
    // Adicionar fonte de dados
    if (!map.getSource(layerId)) {
        map.addSource(layerId, {
            type: 'geojson',
            data: data
        });
    }

    // Determinar tipo de geometria
    const firstFeature = data.features[0];
    const geometryType = firstFeature ? firstFeature.geometry.type : 'Point';

    // Adicionar camada visual
    if (!map.getLayer(layerId)) {
        const style = getLayerStyle(layerId, geometryType);
        
        map.addLayer({
            id: layerId,
            source: layerId,
            ...style
        });

        // Adicionar popup ao clicar
        map.on('click', layerId, function(e) {
            showFeaturePopup(e, layerId);
        });

        // Cursor pointer no hover
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    }

    // Tornar camada visível
    map.setLayoutProperty(layerId, 'visibility', 'visible');
}

// Mostra popup com informações da feature
function showFeaturePopup(e, layerId) {
    const feature = e.features[0];
    const config = layerConfigs[layerId];
    
    if (!feature || !config) return;

    // Criar conteúdo do popup
    let content = `<h3>${config.name}</h3>`;
    
    if (feature.properties) {
        content += '<div class="popup-properties">';
        
        // Propriedades importantes para mostrar
        const importantProps = ['nome', 'name', 'NOME', 'NAME', 'descricao', 'tipo', 'area'];
        let hasProps = false;
        
        // Tentar mostrar propriedades importantes primeiro
        for (const prop of importantProps) {
            if (feature.properties[prop]) {
                content += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                hasProps = true;
            }
        }
        
        // Se não encontrou, mostrar as primeiras 3 propriedades
        if (!hasProps) {
            const props = Object.keys(feature.properties).slice(0, 3);
            for (const prop of props) {
                const value = feature.properties[prop];
                if (value !== null && value !== '') {
                    content += `<p><strong>${prop}:</strong> ${value}</p>`;
                }
            }
        }
        
        content += '</div>';
    }

    // Criar e mostrar popup
    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map);
}

// ---- INTERFACE DO USUÁRIO ----
// Abre/fecha o painel lateral de camadas
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    sidebar.classList.toggle('active');
    body.classList.toggle('sidebar-open');
}

// Abre o modal de pesquisa
function openSearchModal() {
    document.getElementById('search-modal').classList.add('active');
    document.getElementById('search-input').focus();
}

// Fecha o modal de pesquisa
function closeSearchModal() {
    document.getElementById('search-modal').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

// Pesquisa camadas por nome
function searchLayers(query) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    if (query.length < 2) return;
    
    const results = [];
    
    // Pesquisar nos nomes das camadas
    Object.keys(layerConfigs).forEach(layerId => {
        const config = layerConfigs[layerId];
        if (config.name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
                id: layerId,
                name: config.name,
                type: 'layer'
            });
        }
    });
    
    // Pesquisar nas features das camadas carregadas
    Object.keys(layersData).forEach(layerId => {
        const data = layersData[layerId];
        if (data?.features) {
            data.features.forEach((feature, index) => {
                const props = feature.properties;
                if (props) {
                    Object.values(props).forEach(value => {
                        if (String(value).toLowerCase().includes(query.toLowerCase())) {
                            results.push({
                                id: `${layerId}-${index}`,
                                name: `${layerConfigs[layerId].name}: ${value}`,
                                type: 'feature',
                                layerId: layerId,
                                feature: feature
                            });
                        }
                    });
                }
            });
        }
    });
    
    // Mostrar até 10 resultados
    results.slice(0, 10).forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<strong>${result.name}</strong>`;
        item.onclick = function() {
            if (result.type === 'layer') {
                // Ativar camada e fechar painel
                const checkbox = document.getElementById(`${result.id}-layer`);
                if (checkbox && !checkbox.checked) {
                    checkbox.click();
                }
                toggleSidebar();
            } else if (result.type === 'feature') {
                // Zoom para feature encontrada
                if (result.feature.geometry.type === 'Point') {
                    map.flyTo({
                        center: result.feature.geometry.coordinates,
                        zoom: 14,
                        duration: 2000
                    });
                }
            }
            closeSearchModal();
        };
        resultsDiv.appendChild(item);
    });
    
    // Mostrar mensagem se não encontrar nada
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="search-result-item">Nenhum resultado encontrado</div>';
    }
}

// ---- EVENT LISTENERS ----
// Fecha modal/sidebar com a tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearchModal();
        
        // Fechar sidebar também com ESC
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    }
});

// Fecha modal/sidebar ao clicar fora
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const layersControl = document.querySelector('.layers-control');
    const searchModal = document.getElementById('search-modal');
    const body = document.body;
    
    // Fechar modal de pesquisa se clicar fora
    if (e.target === searchModal) {
        closeSearchModal();
    }
    
    // Fechar sidebar se clicar fora e ela estiver aberta
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !layersControl.contains(e.target)) {
        sidebar.classList.remove('active');
        body.classList.remove('sidebar-open');
    }
});