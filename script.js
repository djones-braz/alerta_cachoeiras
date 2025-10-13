document.addEventListener("DOMContentLoaded", function() {
    console.log("Mapa iniciado. Carregando dados da planilha...");

    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    async function geocodeAddress(address) {
        // Usa o endereço exato da planilha, que já parece completo
        const cleanAddress = address.trim();
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}`;
        
        console.log(`%cBuscando coordenadas para: %c"${cleanAddress}"`, "color: blue;", "color: black; font-weight: bold;");

        try {
            const response = await fetch(geoUrl);
            const geoData = await response.json();
            
            console.log("Resposta recebida do serviço de mapas:", geoData);

            if (geoData && geoData.length > 0) {
                const coords = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
                console.log(`%cSUCESSO! %cCoordenadas encontradas: Lat ${coords.lat}, Lon ${coords.lon}`, "color: green; font-weight: bold;", "color: black;");
                return coords;
            } else {
                console.warn(`AVISO: Nenhum resultado encontrado para o endereço: "${cleanAddress}"`);
                return null;
            }
        } catch (error) {
            console.error(`ERRO CRÍTICO ao tentar buscar o endereço '${cleanAddress}':`, error);
            return null;
        }
    }

    Papa.parse(urlComCacheBuster, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            console.log("Planilha CSV processada com sucesso. Iniciando geocodificação...");
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
                        popupContent += `<b>Coordenadas Encontradas:</b> ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
                        marker.bindPopup(popupContent);
                    }
                }
            }

            if (locationsFound === 0) {
                alert("Planilha carregada, mas nenhum endereço pôde ser convertido em coordenadas. Pressione F12 e verifique a aba 'Console' para detalhes.");
            }
        },
        error: function(error) {
            console.error('Erro ao carregar/processar o CSV:', error);
            alert(`Erro grave ao carregar a planilha. Detalhe: ${error.message}`);
        }
    });
});
