document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração da sua Planilha ---
    const SHEET_ID = '1queldSMu9oGP2eokmNUr_NHc4aZGEwVBj8HcmnyxSAs';
    const GID = '415255226';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

    // Centraliza o mapa em Cachoeiras de Macacu para uma melhor visualização inicial
    const map = L.map('map').setView([-22.4640, -42.6534], 13);

    // Adiciona o mapa base do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Usa a API 'fetch' do navegador, que é mais moderna e confiável
    fetch(sheetUrl)
        .then(response => {
            // Verifica se a resposta da rede foi bem-sucedida
            if (!response.ok) {
                throw new Error('Erro de rede ou a planilha não está publicada na web.');
            }
            return response.text(); // Converte a resposta em texto (formato CSV)
        })
        .then(csvText => {
            // Usa o PapaParse para analisar o texto CSV
            Papa.parse(csvText, {
                header: true, // A primeira linha é o cabeçalho
                skipEmptyLines: true,
                complete: function(results) {
                    const data = results.data;
                    let locationsFound = false;

                    data.forEach(item => {
                        // Verifica se as colunas Lat e Long existem e não estão vazias
                        if (item && item.Lat && item.Long) {
                            const lat = parseFloat(item.Lat.replace(',', '.'));
                            const lon = parseFloat(item.Long.replace(',', '.'));
                            
                            if (!isNaN(lat) && !isNaN(lon)) {
                                locationsFound = true;
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

                    if (!locationsFound) {
                        alert("Planilha carregada com sucesso, mas nenhuma coordenada (Lat/Long) foi encontrada.");
                    }
                }
            });
        })
        .catch(error => {
            // Se qualquer etapa falhar, exibe um alerta detalhado
            console.error('Falha detalhada no carregamento:', error);
            alert('Não foi possível carregar os dados. Verifique se a planilha está "Publicada na web" (Arquivo > Compartilhar > Publicar na web) e se as colunas "Lat" e "Long" estão corretas.');
        });
});