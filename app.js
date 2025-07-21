// Inicialização do mapa
let map;
let layersData = {};
let sidebarVisible = true;

// Configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeMenuState();
    initializeHeader();
});

// Inicializar funcionalidades do header
function initializeHeader() {
    // Configurar busca em tempo real
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchLayers(e.target.value);
        });
    }
}

// Inicializar o mapa MapLibre
function initializeMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                }
            },
            layers: [
                {
                    id: 'osm',
                    type: 'raster',
                    source: 'osm'
                }
            ]
        },
        center: [-45.0, -15.0], // Centro aproximado do Brasil
        zoom: 4
    });

    // Adicionar controles de navegação
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.ScaleControl());
}

// Inicializar estado do menu (alguns grupos expandidos por padrão)
function initializeMenuState() {
    // Expandir algumas classes por padrão
    const defaultExpanded = ['dados-ambientais'];
    defaultExpanded.forEach(classId => {
        const element = document.getElementById(classId);
        if (element) {
            element.classList.remove('collapsed');
        }
    });

    // Expandir alguns subgrupos por padrão
    const defaultSubgroupsExpanded = ['ambiental'];
    defaultSubgroupsExpanded.forEach(subgroupId => {
        const element = document.getElementById(subgroupId);
        if (element) {
            element.classList.remove('collapsed');
        }
    });
}

// Função para alternar classes principais
function toggleClass(classId) {
    const element = document.getElementById(classId);
    const button = element.previousElementSibling;
    
    if (element.classList.contains('collapsed')) {
        element.classList.remove('collapsed');
        button.classList.remove('collapsed');
        element.parentElement.classList.add('active');
    } else {
        element.classList.add('collapsed');
        button.classList.add('collapsed');
        element.parentElement.classList.remove('active');
    }
}

// Função para alternar subgrupos
function toggleSubgroup(subgroupId) {
    const element = document.getElementById(subgroupId);
    const button = element.previousElementSibling;
    
    if (element.classList.contains('collapsed')) {
        element.classList.remove('collapsed');
        button.classList.remove('collapsed');
        element.parentElement.classList.add('active');
    } else {
        element.classList.add('collapsed');
        button.classList.add('collapsed');
        element.parentElement.classList.remove('active');
    }
}

// Função para alternar visibilidade das camadas
function toggleLayer(layerId) {
    const checkbox = document.getElementById(layerId + '-layer');
    const isVisible = checkbox.checked;
    const layerItem = checkbox.closest('.shapefile-item');
    
    if (isVisible) {
        addLayerToMap(layerId);
        layerItem.classList.add('layer-active');
        console.log(`Camada ${layerId} ativada`);
    } else {
        removeLayerFromMap(layerId);
        layerItem.classList.remove('layer-active');
        console.log(`Camada ${layerId} desativada`);
    }
}

// Adicionar camada ao mapa
function addLayerToMap(layerId) {
    // Verificar se a camada já existe
    if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        return;
    }

    // Configurações específicas para cada tipo de camada
    const layerConfigs = {
        // Limites Territoriais
        'municipios': {
            type: 'fill',
            paint: {
                'fill-color': '#3498db',
                'fill-opacity': 0.3,
                'fill-outline-color': '#2980b9'
            }
        },
        'zee': {
            type: 'fill',
            paint: {
                'fill-color': '#3498db',
                'fill-opacity': 0.1,
                'fill-outline-color': '#2980b9'
            }
        },
        'mar-territorial': {
            type: 'fill',
            paint: {
                'fill-color': '#2ecc71',
                'fill-opacity': 0.2,
                'fill-outline-color': '#27ae60'
            }
        },
        
        // Dados Ambientais - Batimetria
        'batimetria-cprm': {
            type: 'raster',
            paint: {
                'raster-opacity': 0.7
            }
        },
        'batimetria-gebco': {
            type: 'raster',
            paint: {
                'raster-opacity': 0.7
            }
        },
        
        // Dados Ambientais - Hidrografia
        'foz-rios': {
            type: 'circle',
            paint: {
                'circle-color': '#3498db',
                'circle-radius': 4,
                'circle-stroke-color': '#2980b9',
                'circle-stroke-width': 1
            }
        },
        
        // Dados Ambientais - Meio Ambiente
        'sensibilidade-litoral': {
            type: 'fill',
            paint: {
                'fill-color': [
                    'case',
                    ['==', ['get', 'sensitivity'], 1], '#2ecc71',
                    ['==', ['get', 'sensitivity'], 2], '#f1c40f',
                    ['==', ['get', 'sensitivity'], 3], '#e67e22',
                    ['==', ['get', 'sensitivity'], 4], '#e74c3c',
                    '#95a5a6'
                ],
                'fill-opacity': 0.6
            }
        }
    };

    // Para este exemplo, vamos simular dados (em um projeto real, você carregaria shapefiles)
    if (!map.getSource(layerId)) {
        // Adicionar fonte de dados simulada
        map.addSource(layerId, {
            type: 'geojson',
            data: generateSampleData(layerId)
        });
    }

    // Adicionar camada com configuração específica
    const config = layerConfigs[layerId] || {
        type: 'fill',
        paint: {
            'fill-color': '#3498db',
            'fill-opacity': 0.3
        }
    };

    map.addLayer({
        id: layerId,
        type: config.type,
        source: layerId,
        paint: config.paint,
        layout: {
            'visibility': 'visible'
        }
    });

    // Armazenar informações da camada
    layersData[layerId] = {
        visible: true,
        config: config
    };
}

// Remover camada do mapa
function removeLayerFromMap(layerId) {
    if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        layersData[layerId].visible = false;
    }
}

// Gerar dados de exemplo (substitua por carregamento real de shapefiles)
function generateSampleData(layerId) {
    // Esta é uma função de exemplo - em um projeto real você carregaria os shapefiles
    const sampleFeatures = {
        type: 'FeatureCollection',
        features: []
    };

    // Gerar algumas features de exemplo baseadas no tipo de camada
    if (layerId === 'foz-rios') {
        // Pontos de exemplo para foz de rios
        for (let i = 0; i < 5; i++) {
            sampleFeatures.features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-45 + Math.random() * 10, -15 + Math.random() * 10]
                },
                properties: {
                    name: `Foz do Rio ${i + 1}`,
                    description: `Foz de rio exemplo ${i + 1}`
                }
            });
        }
    } else if (layerId.includes('batimetria')) {
        // Para batimetria, criar um grid raster simulado
        sampleFeatures.features.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-50, -20],
                    [-40, -20],
                    [-40, -10],
                    [-50, -10],
                    [-50, -20]
                ]]
            },
            properties: {
                name: layerId,
                description: `Dados de ${layerId}`,
                depth: Math.floor(Math.random() * 1000) + 10
            }
        });
    } else {
        // Polígonos de exemplo para outras camadas
        sampleFeatures.features.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-45, -15],
                    [-44, -15],
                    [-44, -14],
                    [-45, -14],
                    [-45, -15]
                ]]
            },
            properties: {
                name: layerId,
                description: `Dados de ${layerId}`,
                sensitivity: Math.floor(Math.random() * 4) + 1
            }
        });
    }

    return sampleFeatures;
}

// Função para buscar camadas
function searchLayers(searchTerm) {
    const items = document.querySelectorAll('.shapefile-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        if (label.includes(term)) {
            item.style.display = 'flex';
            // Expandir grupos pai se necessário
            let parent = item.closest('.layer-groups');
            while (parent) {
                parent.classList.remove('collapsed');
                parent = parent.parentElement.closest('.layer-groups');
            }
        } else {
            item.style.display = 'none';
        }
    });
}

// Função para resetar todas as camadas
function resetAllLayers() {
    const checkboxes = document.querySelectorAll('.shapefile-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            const layerId = checkbox.id.replace('-layer', '');
            removeLayerFromMap(layerId);
            checkbox.closest('.shapefile-item').classList.remove('layer-active');
        }
    });
}

// Adicionar funcionalidades extras quando o mapa estiver carregado
map.on('load', function() {
    console.log('Mapa carregado com sucesso!');
    
    // Adicionar popup para interação com as camadas
    map.on('click', function(e) {
        const features = map.queryRenderedFeatures(e.point);
        
        if (features.length > 0) {
            const feature = features[0];
            
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">
                            ${feature.properties.name || 'Camada'}
                        </h4>
                        <p style="margin: 0; font-size: 12px; color: #7f8c8d;">
                            ${feature.properties.description || 'Clique para mais informações'}
                        </p>
                    </div>
                `)
                .addTo(map);
        }
    });
    
    // Mudar cursor quando hover sobre features
    map.on('mouseenter', function() {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', function() {
        map.getCanvas().style.cursor = '';
    });
});

// FUNÇÕES DO HEADER

// Alternar visibilidade do sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const map = document.getElementById('map');
    
    sidebarVisible = !sidebarVisible;
    
    if (sidebarVisible) {
        sidebar.classList.remove('hidden');
        map.classList.remove('full-width');
    } else {
        sidebar.classList.add('hidden');
        map.classList.add('full-width');
    }
    
    // Redimensionar o mapa após a transição
    setTimeout(() => {
        if (map) {
            map.getContainer().style.width = sidebarVisible ? 'calc(100% - 350px)' : '100%';
            map.resize();
        }
    }, 300);
}

// Função de busca melhorada
function searchLayers(searchTerm) {
    const items = document.querySelectorAll('.shapefile-item');
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        // Mostrar todos os itens e resetar grupos
        items.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    let hasResults = false;
    
    items.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        if (label.includes(term)) {
            item.style.display = 'flex';
            hasResults = true;
            
            // Expandir grupos pai automaticamente
            let parent = item.closest('.layer-groups');
            while (parent) {
                parent.classList.remove('collapsed');
                const button = parent.previousElementSibling;
                if (button) button.classList.remove('collapsed');
                parent = parent.parentElement.closest('.layer-groups');
            }
            
            // Expandir subgrupo
            let subgroup = item.closest('.shapefile-list');
            if (subgroup) {
                subgroup.classList.remove('collapsed');
                const subButton = subgroup.previousElementSibling;
                if (subButton) subButton.classList.remove('collapsed');
            }
        } else {
            item.style.display = 'none';
        }
    });
    
    // Adicionar indicador visual se não houver resultados
    if (!hasResults && term !== '') {
        console.log('Nenhuma camada encontrada para:', term);
    }
}

// Limpar busca
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    searchLayers('');
}

// Alternar tela cheia
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Redimensionar mapa quando necessário
function resizeMap() {
    if (map) {
        map.resize();
    }
}
