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
    map.addControl(new maplibregl.ScaleControl());

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
