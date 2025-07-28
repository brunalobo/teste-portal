let map;
let layersData = {};
let layerFilters = {}; // Para armazenar filtros aplicados

// Configuração das camadas ArcGIS
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
        name: 'Índice de Sensibilidade do Litoral'
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

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeToggleSwitches();
});

// Função para inicializar os toggles switches
function initializeToggleSwitches() {
    // Adicionar evento de click nos toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Não permitir clique se estiver em loading
            if (this.classList.contains('loading')) {
                e.preventDefault();
                return;
            }
            
            const checkbox = this.previousElementSibling;
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.checked = !checkbox.checked;
                // Disparar o evento onchange manualmente
                const event = new Event('change');
                checkbox.dispatchEvent(event);
            }
        });
    });
    
    // Adicionar evento de click nos labels
    document.querySelectorAll('.layer-item label').forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault();
            
            const checkbox = document.getElementById(this.getAttribute('for'));
            const toggleSwitch = checkbox?.nextElementSibling;
            
            // Não permitir clique se estiver em loading
            if (toggleSwitch?.classList.contains('loading')) {
                return;
            }
            
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                // Disparar o evento onchange manualmente
                const event = new Event('change');
                checkbox.dispatchEvent(event);
            }
        });
    });
}

// Função para inicializar o mapa
function initializeMap() {
    try {
        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'esri-dark': {
                        type: 'raster',
                        tiles: [
                            'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                        ],
                        tileSize: 256,
                        attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ'
                    }
                },
                layers: [
                    {
                        id: 'esri-dark-layer',
                        type: 'raster',
                        source: 'esri-dark'
                    }
                ]
            },
            center: [-43.2, -22.9],
            zoom: 8,
            minZoom: 3,
            maxZoom: 18
        });

        // Aguardar o mapa carregar antes de adicionar controles
        map.on('load', function() {
            addAllControls();
            console.log('Mapa carregado com sucesso!');
        });

        // Error handling
        map.on('error', function(e) {
            console.error('Erro no mapa:', e);
        });

    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
    }
}

// Função para adicionar todos os controles do MapLibre
function addAllControls() {
    // Controle personalizado de camadas
    class LayersControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = `
                <button type="button" class="layers-control" onclick="toggleSidebar()" title="Camadas">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z"/>
                    </svg>
                </button>
            `;
            return this._container;
        }
        
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    
    // Controle personalizado de pesquisa
    class SearchControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = `
                <button type="button" class="search-control" onclick="openSearchModal()" title="Pesquisar">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                    </svg>
                </button>
            `;
            return this._container;
        }
        
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    
    // Adicionar controles customizados primeiro
    map.addControl(new LayersControl(), 'top-left');
    map.addControl(new SearchControl(), 'top-left');

    // Controles de navegação (zoom in/out, compass)
    map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    }), 'top-right');

    // Controle de escala
    map.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    }), 'bottom-right');

    // Controle de tela cheia
    map.addControl(new maplibregl.FullscreenControl({
        container: document.querySelector('body')
    }), 'top-right');

    // Controle de geolocalização
    const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        },
        fitBoundsOptions: {
            maxZoom: 16,
            duration: 2000
        },
        trackUserLocation: true,
        showAccuracyCircle: true,
        showUserHeading: true
    });
    
    map.addControl(geolocateControl, 'top-right');
    
    // Adicionar eventos para feedback do usuário
    geolocateControl.on('geolocate', function(e) {
        console.log('Localização encontrada:', e.coords);
    });
    
    geolocateControl.on('error', function(e) {
        console.error('Erro de geolocalização:', e);
        alert('Não foi possível acessar sua localização. Verifique se o acesso à localização está habilitado no seu navegador.');
    });

    // Controle de pitch/rotação
    class TerrainControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
            this._container.innerHTML = `
                <button type="button" onclick="resetView()" title="Reset da Visualização">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M18,11H13L14.5,9.5C13.14,8.86 11.54,8.84 10.15,9.45C8.76,10.06 7.78,11.24 7.5,12.66C7.18,14.42 7.84,16.26 9.25,17.43L10.32,16.36C9.52,15.73 9.05,14.76 9.22,13.73C9.37,12.83 9.92,12.06 10.71,11.68C11.5,11.29 12.40,11.33 13.15,11.78L11.5,13.5H18V11Z"/>
                    </svg>
                </button>
            `;
            return this._container;
        }
        
        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    
    map.addControl(new TerrainControl(), 'top-right');
}

// Função para resetar a visualização do mapa
function resetView() {
    map.easeTo({
        center: [-43.2, -22.9],
        zoom: 8,
        pitch: 0,
        bearing: 0,
        duration: 1000
    });
}

// Função para carregar dados do ArcGIS FeatureServer
async function loadArcGISFeatures(layerId) {
    const config = layerConfigs[layerId];
    if (!config) {
        console.error(`Configuração não encontrada para camada: ${layerId}`);
        return null;
    }

    try {
        console.log(`Carregando camada: ${config.name}`);
        
        // Buscar dados do FeatureServer
        const response = await fetch(`${config.url}/0/query?f=geojson&where=1=1&outFields=*&resultRecordCount=1000`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            console.log(`Camada ${config.name} carregada com ${data.features.length} features`);
            return data;
        } else {
            console.warn(`Nenhuma feature encontrada para ${config.name}`);
            return null;
        }
        
    } catch (error) {
        console.error(`Erro ao carregar camada ${config.name}:`, error);
        return null;
    }
}

// Função para obter estilo da camada baseado no tipo de geometria
function getLayerStyle(layerId, geometryType) {
    const baseStyles = {
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
        'terras-indigenas': {
            type: 'fill',
            paint: {
                'fill-color': '#2e7d32',
                'fill-opacity': 0.5,
                'fill-outline-color': '#1b5e20'
            }
        },
        'areas-quilombolas': {
            type: 'fill',
            paint: {
                'fill-color': '#d32f2f',
                'fill-opacity': 0.5,
                'fill-outline-color': '#b71c1c'
            }
        },
        'unidades-conservacao': {
            type: 'fill',
            paint: {
                'fill-color': '#388e3c',
                'fill-opacity': 0.4,
                'fill-outline-color': '#2e7d32'
            }
        }
    };

    // Retorna estilo base ou adapta baseado no tipo de geometria
    const style = baseStyles[layerId];
    if (!style) {
        // Estilo padrão baseado na geometria
        if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            return {
                type: 'fill',
                paint: {
                    'fill-color': '#ff0000',
                    'fill-opacity': 0.5,
                    'fill-outline-color': '#aa0000'
                }
            };
        } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            return {
                type: 'line',
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2
                }
            };
        } else {
            return {
                type: 'circle',
                paint: {
                    'circle-color': '#ff0000',
                    'circle-radius': 5
                }
            };
        }
    }
    
    return style;
}

// Função para alternar visibilidade da camada
async function toggleLayer(layerId) {
    const checkbox = document.getElementById(`${layerId}-layer`);
    const toggleSwitch = checkbox?.nextElementSibling;
    
    if (!checkbox || !toggleSwitch) {
        console.error(`Elementos não encontrados para camada: ${layerId}`);
        return;
    }
    
    const isChecked = checkbox.checked;

    try {
        if (isChecked) {
            // Primeiro, volta o toggle para off enquanto carrega
            checkbox.checked = false;
            
            // Adicionar estado de loading
            toggleSwitch.classList.add('loading');
            
            // Carregar dados se necessário
            if (!layersData[layerId]) {
                console.log(`Iniciando carregamento da camada: ${layerConfigs[layerId]?.name}`);
                
                const data = await loadArcGISFeatures(layerId);
                if (data && data.features && data.features.length > 0) {
                    layersData[layerId] = data;
                } else {
                    // Remover loading e manter off
                    toggleSwitch.classList.remove('loading');
                    alert(`Não foi possível carregar dados para: ${layerConfigs[layerId]?.name || layerId}`);
                    return;
                }
            }

            // Adicionar source se não existir
            if (!map.getSource(layerId)) {
                map.addSource(layerId, {
                    type: 'geojson',
                    data: layersData[layerId]
                });
            }

            // Determinar tipo de geometria
            const firstFeature = layersData[layerId].features[0];
            const geometryType = firstFeature ? firstFeature.geometry.type : 'Point';

            // Adicionar layer se não existir
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
                map.on('mouseenter', layerId, function() {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', layerId, function() {
                    map.getCanvas().style.cursor = '';
                });
            }

            // Tornar visível
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            
            // Remover loading e ativar toggle
            toggleSwitch.classList.remove('loading');
            checkbox.checked = true;
            
            console.log(`Camada ${layerId} ativada com sucesso`);

        } else {
            // Ocultar camada (isso é imediato)
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'none');
                console.log(`Camada ${layerId} desativada`);
            }
        }
    } catch (error) {
        console.error(`Erro ao alternar camada ${layerId}:`, error);
        
        // Remover loading e manter off em caso de erro
        toggleSwitch.classList.remove('loading');
        checkbox.checked = false;
        
        alert(`Erro ao carregar camada: ${error.message}`);
    }
}

// Função para mostrar popup com informações da feature
function showFeaturePopup(e, layerId) {
    const feature = e.features[0];
    const config = layerConfigs[layerId];
    
    if (!feature || !config) return;

    // Construir HTML do popup
    let popupContent = `<h3>${config.name}</h3>`;
    
    if (feature.properties) {
        popupContent += '<div class="popup-properties">';
        
        // Mostrar algumas propriedades principais
        const importantProps = ['nome', 'name', 'NOME', 'NAME', 'descricao', 'tipo', 'area'];
        let hasProps = false;
        
        for (const prop of importantProps) {
            if (feature.properties[prop]) {
                popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                hasProps = true;
            }
        }
        
        // Se não encontrou propriedades importantes, mostrar as primeiras 3
        if (!hasProps) {
            const props = Object.keys(feature.properties).slice(0, 3);
            for (const prop of props) {
                if (feature.properties[prop] !== null && feature.properties[prop] !== '') {
                    popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                }
            }
        }
        
        popupContent += '</div>';
    }

    // Criar e mostrar popup
    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
}

// Função para alternar submenu
function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.classList.toggle('active');
    }
}

// Função para alternar sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    sidebar.classList.toggle('active');
    body.classList.toggle('sidebar-open');
}

// Função para aplicar filtro nas camadas
function applyLayerFilter(layerId, filterValue, isChecked) {
    if (!layerFilters[layerId]) {
        layerFilters[layerId] = [];
    }
    
    if (isChecked) {
        // Adicionar filtro se marcado
        if (!layerFilters[layerId].includes(filterValue)) {
            layerFilters[layerId].push(filterValue);
        }
    } else {
        // Remover filtro se desmarcado
        layerFilters[layerId] = layerFilters[layerId].filter(f => f !== filterValue);
    }
    
    // Se a camada estiver ativa, reaplicar os dados com filtro
    if (map.getLayer(layerId)) {
        const originalData = layersData[layerId];
        if (originalData && originalData.features) {
            let filteredData = { ...originalData };
            
            if (layerFilters[layerId].length > 0) {
                // Aplicar filtros baseado nos valores selecionados
                filteredData.features = originalData.features.filter(feature => {
                    const props = feature.properties;
                    return layerFilters[layerId].some(filterValue => 
                        Object.values(props).some(value => 
                            String(value).toLowerCase().includes(filterValue.toLowerCase())
                        )
                    );
                });
            }
            
            // Atualizar source com dados filtrados
            map.getSource(layerId).setData(filteredData);
        }
    }
}

// Função para abrir modal de pesquisa
function openSearchModal() {
    document.getElementById('search-modal').classList.add('active');
    document.getElementById('search-input').focus();
}

// Função para fechar modal de pesquisa
function closeSearchModal() {
    document.getElementById('search-modal').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

// Função para pesquisar camadas
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
        if (data && data.features) {
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
    
    // Mostrar resultados
    results.slice(0, 10).forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<strong>${result.name}</strong>`;
        item.onclick = function() {
            if (result.type === 'layer') {
                // Ativar camada e fechar modal
                const checkbox = document.getElementById(`${result.id}-layer`);
                if (checkbox && !checkbox.checked) {
                    checkbox.click();
                }
                toggleSidebar();
            } else if (result.type === 'feature') {
                // Zoom para feature
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
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="search-result-item">Nenhum resultado encontrado</div>';
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('search-modal');
    if (e.target === modal) {
        closeSearchModal();
    }
});

// Fechar modal com ESC
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

// Fechar sidebar ao clicar fora dela
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const layersControl = document.querySelector('.layers-control');
    const searchModal = document.getElementById('search-modal');
    const body = document.body;
    
    // Fechar modal de pesquisa se clicar fora
    if (e.target === searchModal) {
        closeSearchModal();
    }
    
    // Fechar sidebar se clicar fora dela e ela estiver aberta
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !layersControl.contains(e.target)) {
        sidebar.classList.remove('active');
        body.classList.remove('sidebar-open');
    }
});