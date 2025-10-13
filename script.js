document.addEventListener("DOMContentLoaded", function() {
    // --- CORREÇÃO FINAL: Usando o link de publicação direta ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDTtaJJh_GXdGQCZdBXc9YjvDuvJGDcuU3T0XVkR8-knVRiTKIGYc7dD3TSC2cgyj5DF_tLR5wBBW1/pub?gid=415255226&single=true&output=csv';

    // Adiciona um parâmetro para evitar cache do navegador
    const urlComCacheBuster = `${sheetUrl}&t=${new Date().getTime()}`;

    // Centraliza o mapa em Cachoeiras de Macacu
    const map = L.map('map').setView([-22.4640, -42.6534], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // O PapaParse pode buscar a URL diretamente, o que é mais robusto
    Papa.parse(urlComCacheBuster, {
        download: true, // Pede ao PapaParse para fazer o download
        header: true,   // A primeira linha é o cabeçalho
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            let locationsFound = false;

            if (!data || data.length === 0) {
                alert("O arquivo CSV foi carregado, mas está vazio ou em um formato inesperado.");
                return;
            }

            // Verifica se as colunas Lat e Long existem no resultado
            if (!results.meta.fields.includes("Lat") || !results.meta.fields.includes("Long")) {
                alert(`As colunas necessárias "Lat" e "Long" não foram encontradas. Foram encontradas: ${results.meta.fields.join(", ")}`);
                return;
            }

            data.forEach(item => {
                const latValue = item.Lat;
                const longValue = item.Long;

                if (latValue && longValue) {
                    const lat = parseFloat(latValue.replace(',', '.'));
                    const lon = parseFloat(longValue.replace(',', '.'));

                    if (!isNaN(lat) && !isNaN(lon)) {
                        locationsFound = true;
                        const marker = L.marker([lat, lon]).addTo(map);
                        let popupContent = '';
                        
                        results.meta.fields.forEach(header => {
                            popupContent += `<b>${header}:</b> ${item[header]}<br>`;
                        });
                        
                        marker.bindPopup(popupContent);
                    }
                }
            });

            if (!locationsFound) {
                alert("Planilha carregada, mas nenhuma coordenada válida foi encontrada.");
            }
        },
        error: function(error) {
            console.error('Erro do PapaParse:', error);
            alert(`Erro ao processar o CSV. Detalhe: ${error.message}`);
        }
    });
});