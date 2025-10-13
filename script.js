document.addEventListener("DOMContentLoaded", function() {
    console.log("Mapa iniciado. Carregando dados da planilha...");

    // --- URL CORRIGIDA ---
    // Esta é a URL correta e limpa, sem a duplicação do erro anterior.
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    
    // Adiciona um parâmetro para evitar que o navegador use uma versão antiga (cache)
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    async function geocodeAddress(address) {
        const cleanAddress = address.trim();
        // Usamos o parâmetro "countrycodes=br" para focar a busca no Brasil
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&countrycodes=br`;
        
        console.log(`Buscando coordenadas para: "${cleanAddress}" (limitado ao Brasil)`);

        try {
            const response = await fetch(geoUrl);
            const geoData = await response.json();

            if (geoData && geoData.length > 0) {
                const coords = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
                console.log(`%cSUCESSO! Coordenadas encontradas: Lat ${coords.lat}, Lon ${coords.lon}`, "color: green; font-weight: bold;");
                return coords;
            } else {
                console.warn(`AVISO: Nenhum resultado encontrado para o endereço: "${cleanAddress}"`);
                return null;
            }
        } catch (error) {
            console.error(`ERRO ao tentar buscar o endereço '${cleanAddress}':`, error);
            return null;
        }
    }

    Papa.parse(urlComCacheBuster, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const data = results.data;
            let locationsFound = 0;

            for (const item of data) {
                // Certifique-se de que o nome da coluna aqui está EXATAMENTE igual ao da sua planilha
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

            if (locationsFound === 0 && data.length > 0) {
                alert("Planilha carregada, mas nenhum endereço pôde ser convertido em coordenadas. Verifique o formato dos endereços na planilha.");
            }
        },
        error: function(error, file) {
            console.error('Erro ao carregar ou processar o CSV:', error, file);
            alert(`Erro grave ao carregar a planilha. Verifique o console (F12) para detalhes.`);
        }
    });
});
