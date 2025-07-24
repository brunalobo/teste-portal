let map;
let layersData = {};
let sidebarVisible = true;

document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeMenuState();
    initializeHeader();
});

function initializeHeader() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchLayers(e.target.value);
        });
    }
}

function initializeMap() {
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
        center: [-43.2, -22.9], // exemplo: centro do Rio de Janeiro
        zoom: 10
    });

    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    
    // Adicionar controles customizados
    addCustomControls();

    map.on('load', function() {
        map.on('click', function(e) {
            const features = map.queryRenderedFeatures(e.point);
            
            if (features.length > 0) {
                const feature = features[0];
                
                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="font-family: Poppins, sans-serif;">
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
        
        map.on('mouseenter', function() {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', function() {
            map.getCanvas().style.cursor = '';
        });
    });
}

// Função para adicionar controles customizados
function addCustomControls() {
    // Controle de Legenda
    const legendControl = new LegendControl();
    map.addControl(legendControl, 'top-right');
    
    // Controle de Camadas
    const layersControl = new LayersControl();
    map.addControl(layersControl, 'top-right');
    
    // Controle de Localização
    const locationControl = new LocationControl();
    map.addControl(locationControl, 'top-right');
}

// Classe para controle de Legenda
class LegendControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.innerHTML = `
            <button class="map-control-btn" title="Legenda" onclick="toggleLegend()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
                </svg>
            </button>
        `;
        return this.container;
    }
    
    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

// Classe para controle de Camadas
class LayersControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.innerHTML = `
            <button class="map-control-btn" title="Camadas" onclick="toggleLayersPanel()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
                </svg>
            </button>
        `;
        return this.container;
    }
    
    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

// Classe para controle de Localização
class LocationControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.innerHTML = `
            <button class="map-control-btn" title="Minha Localização" onclick="goToMyLocation()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
            </button>
        `;
        return this.container;
    }
    
    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

// Função para alternar a legenda
function toggleLegend() {
    let legendPanel = document.getElementById('legend-panel');
    
    if (!legendPanel) {
        createLegendPanel();
        legendPanel = document.getElementById('legend-panel');
    }
    
    if (legendPanel.style.display === 'none' || !legendPanel.style.display) {
        legendPanel.style.display = 'block';
    } else {
        legendPanel.style.display = 'none';
    }
}

// Função para criar o painel de legenda
function createLegendPanel() {
    const legendPanel = document.createElement('div');
    legendPanel.id = 'legend-panel';
    legendPanel.className = 'map-panel legend-panel';
    legendPanel.innerHTML = `
        <div class="panel-header">
            <h3>Legenda</h3>
            <button onclick="closeLegend()" class="close-btn">×</button>
        </div>
        <div class="panel-content">
            <div class="legend-item">
                <div class="legend-color" style="background: #3498db;"></div>
                <span>Municípios</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #2c3e50;"></div>
                <span>Batimetria</span>
            </div>
            <div class="legend-item">
                <div class="legend-color circle" style="background: #3498db;"></div>
                <span>Foz dos Rios</span>
            </div>
            <div class="legend-group">
                <h4>Sensibilidade do Litoral</h4>
                <div class="legend-item">
                    <div class="legend-color" style="background: #2ecc71;"></div>
                    <span>Baixa (1)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f1c40f;"></div>
                    <span>Média (2)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #e67e22;"></div>
                    <span>Alta (3)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #e74c3c;"></div>
                    <span>Muito Alta (4)</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(legendPanel);
}

// Função para fechar a legenda
function closeLegend() {
    const legendPanel = document.getElementById('legend-panel');
    if (legendPanel) {
        legendPanel.style.display = 'none';
    }
}

// Função para alternar o painel de camadas
function toggleLayersPanel() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
    } else {
        sidebar.classList.add('hidden');
    }
    
    setTimeout(() => {
        if (map) {
            map.resize();
        }
    }, 300);
}

// Função para ir para minha localização
function goToMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const coords = [position.coords.longitude, position.coords.latitude];
                
                // Adicionar marcador de localização
                if (map.getSource('user-location')) {
                    map.getSource('user-location').setData({
                        type: 'Point',
                        coordinates: coords
                    });
                } else {
                    map.addSource('user-location', {
                        type: 'geojson',
                        data: {
                            type: 'Point',
                            coordinates: coords
                        }
                    });
                    
                    map.addLayer({
                        id: 'user-location',
                        type: 'circle',
                        source: 'user-location',
                        paint: {
                            'circle-radius': 8,
                            'circle-color': '#007cbf',
                            'circle-stroke-color': '#fff',
                            'circle-stroke-width': 2
                        }
                    });
                }
                
                // Centralizar o mapa na localização do usuário
                map.flyTo({
                    center: coords,
                    zoom: 15,
                    duration: 2000
                });
                
                // Mostrar popup com informação
                new maplibregl.Popup()
                    .setLngLat(coords)
                    .setHTML('<div style="font-family: Poppins, sans-serif;"><strong>Você está aqui!</strong></div>')
                    .addTo(map);
            },
            function(error) {
                alert('Erro ao obter localização: ' + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocalização não é suportada pelo seu navegador.');
    }
}

function initializeMenuState() {
    const defaultExpanded = ['dados-ambientais'];
    defaultExpanded.forEach(classId => {
        const element = document.getElementById(classId);
        if (element) {
            element.classList.remove('collapsed');
        }
    });

    const defaultSubgroupsExpanded = ['ambiental'];
    defaultSubgroupsExpanded.forEach(subgroupId => {
        const element = document.getElementById(subgroupId);
        if (element) {
            element.classList.remove('collapsed');
        }
    });
}

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

function toggleLayer(layerId) {
    const checkbox = document.getElementById(layerId + '-layer');
    const isVisible = checkbox.checked;
    const layerItem = checkbox.closest('.shapefile-item');
    
    if (isVisible) {
        addLayerToMap(layerId);
        layerItem.classList.add('layer-active');
    } else {
        removeLayerFromMap(layerId);
        layerItem.classList.remove('layer-active');
    }
}

function addLayerToMap(layerId) {
    if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        return;
    }

    const layerConfigs = {
        'municipios': {
            type: 'fill',
            paint: {
                'fill-color': '#3498db',
                'fill-opacity': 0.3,
                'fill-outline-color': '#2980b9'
            }
        },
        'batimetria': {
            type: 'fill',
            paint: {
                'fill-color': '#2c3e50',
                'fill-opacity': 0.5
            }
        },
        'foz-rios': {
            type: 'circle',
            paint: {
                'circle-color': '#3498db',
                'circle-radius': 4,
                'circle-stroke-color': '#2980b9',
                'circle-stroke-width': 1
            }
        },
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

    if (!map.getSource(layerId)) {
        map.addSource(layerId, {
            type: 'geojson',
            data: generateSampleData(layerId)
        });
    }

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

    layersData[layerId] = {
        visible: true,
        config: config
    };
}

function removeLayerFromMap(layerId) {
    if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        layersData[layerId].visible = false;
    }
}

function generateSampleData(layerId) {
    const sampleFeatures = {
        type: 'FeatureCollection',
        features: []
    };

    if (layerId === 'foz-rios') {
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
    } else {
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

function searchLayers(searchTerm) {
    const items = document.querySelectorAll('.shapefile-item');
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        items.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    items.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        if (label.includes(term)) {
            item.style.display = 'flex';
            
            let parent = item.closest('.layer-groups');
            while (parent) {
                parent.classList.remove('collapsed');
                const button = parent.previousElementSibling;
                if (button) button.classList.remove('collapsed');
                parent = parent.parentElement.closest('.layer-groups');
            }
            
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
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    searchLayers('');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    sidebarVisible = !sidebarVisible;
    
    if (sidebarVisible) {
        sidebar.classList.remove('hidden');
    } else {
        sidebar.classList.add('hidden');
    }
    
    setTimeout(() => {
        if (map) {
            map.resize();
        }
    }, 300);
}
