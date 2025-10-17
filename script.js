document.addEventListener("DOMContentLoaded", function() {
    // --- VARIÁVEIS GLOBAIS ---
    let allDataPoints = []; // Armazena TODOS os dados da planilha
    let markerLayer = L.layerGroup(); // Camada para guardar os marcadores
    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    
    // Nomes dos meses para os filtros
    const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // --- INICIALIZAÇÃO DO MAPA ---
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markerLayer.addTo(map);

    // --- CARREGAMENTO DOS DADOS ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    Papa.parse(urlComCacheBuster, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const data = results.data;
            let locationsFound = 0;
            
            for (const item of data) {
                const address = item["Logradouro da Ocorrência"];
                if (address) {
                    // Extrai dados de data e tipo
                    const timestamp = item["Carimbo de data/hora"];
                    const dateParts = timestamp.split(' ')[0].split('/'); // "13/10/2025" -> ["13", "10", "2025"]
                    const itemMonth = parseInt(dateParts[1], 10);
                    const itemYear = parseInt(dateParts[2], 10);
                    const itemType = item["Tipo de Ocorrência"].trim();
                    
                    // Geocodifica o endereço
                    const coords = await geocodeAddress(address);
                    
                    // Armazena o ponto de dado (mesmo se não for geocodificado)
                    allDataPoints.push({
                        ...item,
                        coords: coords,
                        month: itemMonth,
                        year: itemYear,
                        type: itemType
                    });

                    if (coords) locationsFound++;
                    
                    // Pausa para a API
                    await delay(1000); 
                }
            }
            
            // Após carregar tudo, popula os filtros e desenha o mapa
            populateFilters();
            applyFilters();
        }
    });

    // --- FUNÇÕES DE FILTRAGEM ---

    function populateFilters() {
        const mesSelect = document.getElementById('filtro-mes');
        const anoSelect = document.getElementById('filtro-ano');
        const tipoSelect = document.getElementById('filtro-tipo');

        const uniqueMonths = new Set();
        const uniqueYears = new Set();
        const uniqueTypes = new Set();

        allDataPoints.forEach(item => {
            uniqueMonths.add(item.month);
            uniqueYears.add(item.year);
            uniqueTypes.add(item.type);
        });

        uniqueMonths.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = meses[month]; // Converte "10" para "Outubro"
            mesSelect.appendChild(option);
        });

        uniqueYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            anoSelect.appendChild(option);
        });

        uniqueTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            tipoSelect.appendChild(option);
        });
    }

    function applyFilters() {
        markerLayer.clearLayers(); // Limpa todos os marcadores do mapa

        const selectedMonth = document.getElementById('filtro-mes').value;
        const selectedYear = document.getElementById('filtro-ano').value;
        const selectedType = document.getElementById('filtro-tipo').value;

        allDataPoints.forEach(item => {
            // Verifica se o item tem coordenadas
            if (item.coords) {
                // Verifica as condições do filtro
                const monthMatch = (selectedMonth === 'todos' || item.month == selectedMonth);
                const yearMatch = (selectedYear === 'todos' || item.year == selectedYear);
                const typeMatch = (selectedType === 'todos' || item.type === selectedType);

                // Se passar em todos os filtros, adiciona ao mapa
                if (monthMatch && yearMatch && typeMatch) {
                    const marker = createMarker(item);
                    marker.addTo(markerLayer);
                }
            }
        });
    }
    
    // --- FUNÇÕES AUXILIARES ---

    function createMarker(item) {
        const { coords, ...data } = item;
        const marker = L.marker([coords.lat, coords.lon]);
        
        let popupContent = '';
        for (const key in data) {
            // Não exibe as coordenadas brutas ou o objeto 'coords' no popup
            if (key !== 'coords' && key !== 'month' && key !== 'year' && key !== 'type') {
                 popupContent += `<b>${key}:</b> ${data[key]}<br>`;
            }
        }
        popupContent += `<b>Coordenadas Encontradas:</b> ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}<br>`;
        
        const mapillaryUrl = `https://www.mapillary.com/app/?lat=${coords.lat}&lng=${coords.lon}&z=17&mapStyle=Esri+satellite`;
        popupContent += `<br><a href="${mapillaryUrl}" target="_blank" class="mapillary-link">Ver imagem da rua (Satélite)</a>`;
        
        marker.bindPopup(popupContent);
        return marker;
    }

    async function geocodeAddress(address) {
        const parts = address.trim().split(',');
        let addressForSearch = address.trim();
        if (parts.length === 4) {
            addressForSearch = `${parts[0].trim()}, ${parts[1].trim()}, ${parts[3].trim()}`;
        }
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressForSearch)}&countrycodes=br`;
        
        try {
            const response = await fetch(geoUrl);
            const geoData = await response.json();
            if (geoData && geoData.length > 0) {
                return { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
            }
        } catch (error) {
            console.error(`Erro ao geocodificar o endereço '${address}':`, error);
        }
        return null;
    }

    const delay = ms => new Promise(res => setTimeout(res, ms));
    
    // --- ADICIONA OS "OUVINTES" DE EVENTO ---
    document.getElementById('filtro-mes').addEventListener('change', applyFilters);
    document.getElementById('filtro-ano').addEventListener('change', applyFilters);
    document.getElementById('filtro-tipo').addEventListener('change', applyFilters);
});
