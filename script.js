document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração da sua Planilha ---
    const SHEET_ID = '1queldSMu9oGP2eokmNUr_NHc4aZGEwVBj8HcmnyxSAs';
    const GID = '415255226';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

    const map = L.map('map').setView([-22.4640, -42.6534], 13); // Centralizado em Cachoeiras de Macacu

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    fetch(sheetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro de rede ou a planilha não está publicada corretamente na web.');
            }
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    const data = results.data;
                    let locationsFound = false;

                    data.forEach(item => {
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
                        alert("Dados da planilha carregados, mas nenhuma coordenada válida (Lat/Long) foi encontrada.");
                    }
                }
            });
        })
        .catch(error => {
            console.error('Falha detalhada:', error);
            alert('Não foi possível carregar os dados da planilha. Verifique se ela foi "Publicada na web" corretamente (Arquivo > Compartilhar > Publicar na web).');
        });
});
