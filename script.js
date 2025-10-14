document.addEventListener("DOMContentLoaded", function() {
    // URL de publicação direta da sua planilha
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    // Centraliza o mapa na sua cidade
    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Função para converter endereço em coordenadas (Geocodificação)
    async function geocodeAddress(address) {
        try {
            // Adicionamos ", Cachoeiras de Macacu, RJ" para tornar a busca mais precisa
            const fullAddress = `${address}, Cachoeiras de Macacu, RJ`;
            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
            
            const response = await fetch(geoUrl);
            const geoData = await response.json();

            if (geoData && geoData.length > 0) {
                // Retorna as coordenadas do primeiro resultado encontrado
                return { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
            }
        } catch (error) {
            console.error(`Erro ao geocodificar o endereço '${address}':`, error);
        }
        return null; // Retorna nulo se não encontrar o endereço ou se der erro
    }

    Papa.parse(urlComCacheBuster, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const data = results.data;
            let locationsFound = 0;

            // Processa cada linha da planilha uma por uma
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
                        // Adiciona as coordenadas encontradas ao popup para conferência
                        popupContent += `<b>Coordenadas Encontradas:</b> ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
                        
                        marker.bindPopup(popupContent);
                    }
                }
            }

            if (locationsFound === 0) {
                alert("Planilha carregada, mas nenhum endereço pôde ser convertido em coordenadas.");
            }
        },
        error: function(error) {
            console.error('Erro ao processar o CSV:', error);
            alert(`Erro ao carregar os dados da planilha. Detalhe: ${error.message}`);
        }
    });
});