document.addEventListener("DOMContentLoaded", function() {
    console.log("Mapa iniciado. Carregando dados da planilha...");

    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    const map = L.map('map').setView([-22.4640, -42.6534], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    async function geocodeAddress(address) {
        // --- A SOLUÇÃO DEFINITIVA ESTÁ AQUI ---
        // Se o endereço tiver 4 partes (Rua, Número, Bairro, Cidade),
        // nós o reconstruímos sem o bairro para uma busca precisa.
        const parts = address.trim().split(',');
        let addressForSearch = address.trim(); // Por padrão, usa o endereço original

        if (parts.length === 4) {
            // Reconstrói o endereço pegando a Rua (parte 0), o Número (parte 1) e a Cidade (parte 3)
            addressForSearch = `${parts[0].trim()}, ${parts[1].trim()}, ${parts[3].trim()}`;
        }

        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressForSearch)}&countrycodes=br`;
        
        console.log(`Enviando endereço LIMPO para busca: "${addressForSearch}"`);

        try {
            const response = await fetch(geoUrl);
            const geoData = await response.json();

            if (geoData && geoData.length > 0) {
                const coords = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
                console.log(`%cSUCESSO! Coordenadas encontradas para "${address}": Lat ${coords.lat}, Lon ${coords.lon}`, "color: green; font-weight: bold;");
                return coords;
            } else {
                console.warn(`AVISO: Nenhum resultado encontrado para o endereço: "${addressForSearch}"`);
                return null;
            }
        } catch (error) {
            console.error(`ERRO ao buscar o endereço '${addressForSearch}':`, error);
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
                alert("Planilha carregada, mas nenhum endereço pôde ser convertido em coordenadas.");
            }
        },
        error: function(error) {
            console.error('Erro ao carregar o CSV:', error);
            alert(`Erro grave ao carregar a planilha.`);
        }
    });
});
