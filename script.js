document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração da sua Planilha ---
    const SHEET_ID = '1queldSMu9oGP2eokmNUr_NHc4aZGEwVBj8HcmnyxSAs';
    const GID = '415255226';
    // Usamos um truque para adicionar um timestamp e evitar que o navegador use uma versão antiga (cache)
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&t=${new Date().getTime()}`;

    // Centraliza o mapa em Cachoeiras de Macacu
    const map = L.map('map').setView([-22.4640, -42.6534], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    fetch(sheetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('A resposta da rede não foi OK. Verifique a publicação da planilha.');
            }
            return response.text();
        })
        .then(csvText => {
            // Analisa o CSV sem usar o cabeçalho para evitar erros de formatação
            Papa.parse(csvText, {
                header: false, // IMPORTANTE: Não processa a primeira linha como cabeçalho
                skipEmptyLines: true,
                complete: function(results) {
                    const dataRows = results.data;
                    
                    // Pega a primeira linha para ser nosso cabeçalho de referência
                    const header = dataRows.shift(); 
                    
                    // Encontra a posição (índice) das colunas Lat e Long
                    const latIndex = header.indexOf("Lat");
                    const longIndex = header.indexOf("Long");
                    
                    if (latIndex === -1 || longIndex === -1) {
                        alert('Não foi possível encontrar as colunas "Lat" e "Long" na planilha. Verifique se os nomes estão escritos exatamente assim.');
                        return;
                    }

                    let locationsFound = false;

                    dataRows.forEach(row => {
                        const latValue = row[latIndex];
                        const longValue = row[longIndex];

                        if (latValue && longValue) {
                            const lat = parseFloat(latValue.replace(',', '.'));
                            const lon = parseFloat(longValue.replace(',', '.'));

                            if (!isNaN(lat) && !isNaN(lon)) {
                                locationsFound = true;
                                const marker = L.marker([lat, lon]).addTo(map);
                                let popupContent = '';
                                
                                // Monta o popup usando o cabeçalho que extraímos
                                header.forEach((colName, index) => {
                                    popupContent += `<b>${colName}:</b> ${row[index]}<br>`;
                                });
                                
                                marker.bindPopup(popupContent);
                            }
                        }
                    });

                    if (!locationsFound) {
                        alert("Planilha carregada, mas nenhuma coordenada válida foi encontrada.");
                    }
                }
            });
        })
        .catch(error => {
            console.error('Falha detalhada no carregamento:', error);
            alert(`Erro final ao tentar buscar os dados. Detalhe: ${error.message}`);
        });
});