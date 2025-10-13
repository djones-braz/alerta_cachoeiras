document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração para buscar dados da Planilha Google ---
    const SHEET_ID = '1queldSMu9oGP2eokmNUr_NHc4aZGEwVBj8HcmnyxSAs';
    const GID = '415255226';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

    // Inicializa o mapa
    const map = L.map('map').setView([-14.235, -51.925], 4);

    // Adiciona o mapa base do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Função para carregar e exibir os dados
    function carregarDados() {
        console.log("Buscando novos dados...");
        Papa.parse(sheetUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            // Adiciona um parâmetro aleatório para evitar cache
            downloadRequestHeaders: { 'Cache-Control': 'no-cache' },
            complete: function(results) {
                const data = results.data;
                let firstLocation = null;
                let locationsFound = false;

                // Limpa marcadores antigos do mapa
                map.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                data.forEach(item => {
                    if (item && item.Lat && item.Long) {
                        const lat = parseFloat(item.Lat.replace(',', '.'));
                        const lon = parseFloat(item.Long.replace(',', '.'));
                        if (!isNaN(lat) && !isNaN(lon)) {
                            locationsFound = true;
                            if (!firstLocation) firstLocation = [lat, lon];
                            
                            const marker = L.marker([lat, lon]).addTo(map);
                            let popupContent = '';
                            for (const key in item) {
                                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                popupContent += `<b>${formattedKey}:</b> ${item[key]}<br>`;
                            }
                            marker.bindPopup(popupContent);
                        }
                    }
                });

                if (firstLocation) {
                    map.setView(firstLocation, 15);
                }
                
                if (!locationsFound) {
                    alert("Dados carregados, mas nenhuma coordenada válida (Lat/Long) foi encontrada na planilha.");
                }
            },
            error: function(err) {
                console.error("Erro:", err);
                alert("Não foi possível carregar os dados da planilha online.");
            }
        });
    }

    // Carrega os dados quando a página abre
    carregarDados();
});