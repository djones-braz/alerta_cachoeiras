document.addEventListener("DOMContentLoaded", function() {
    console.log("Mapa iniciado. Carregando dados da planilha...");

    // URL de publicação direta da sua planilha
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // FUNÇÃO AUXILIAR PARA CRIAR UMA PAUSA
    const delay = ms => new Promise(res => setTimeout(res, ms));

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
                    const coords = await geocodeAddress(address);
                    if (coords) {
                        locationsFound++;
                        const marker = L.marker([coords.lat, coords.lon]).addTo(map);
                        
                        let popupContent = '';
                        for (const key in item) {
                            popupContent += `<b>${key}:</b> ${item[key]}<br>`;
                        }
                        popupContent += `<b>Coordenadas Encontradas:</b> ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}<br>`;
                        
                        // --- CORREÇÃO FINAL BASEADA NA SUA IMAGEM ---
                        // O nome correto, como visto no menu, é 'esri_satellite'.
                        const mapillaryUrl = `https://www.mapillary.com/app/?lat=${coords.lat}&lng=${coords.lon}&z=17&mapStyle=Esri+satellite`;
                        popupContent += `<br><a href="${mapillaryUrl}" target="_blank" class="mapillary-link">Ver imagem da rua (Satélite)</a>`;
                        
                        marker.bindPopup(popupContent);
                    }
                    
                    // Pausa de 1 segundo para respeitar o limite de uso da API
                    await delay(1000); 
                }
            }

            if (locationsFound === 0 && data.length > 0) {
                alert("Planilha carregada, mas nenhum endereço pôde ser convertido em coordenadas.");
            }
        },
        error: function(error) {
            console.error('Erro ao processar o CSV:', error);
            alert(`Erro ao carregar os dados da planilha. Detalhe: ${error.message}`);
        }
    });
});

