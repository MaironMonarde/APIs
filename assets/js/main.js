
let tarifaActual = {};
let chart = null;


document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('boton-convertir').addEventListener('click', function() {
        loadExchangeData();
    });
});



async function loadExchangeData() {
    const conversionA = document.getElementById('conversionA').value;
    const montoInput = document.getElementById('monto-input').value;
    const cargaElem = document.getElementById('carga');
    const graficoChart = document.getElementById('grafico-chart');
    const errorMsg = document.getElementById('mensaje-error');
    


    if (!montoInput || parseFloat(montoInput) <= 0) {
        document.getElementById('resultado').textContent = 'Ingresa una cantidad válida';
        document.getElementById('resultado').style.backgroundColor = '#d19898ff';
        document.getElementById('resultado').style.borderColor = '#d19898ff';
        return;
    }
    


    document.getElementById('resultado').style.backgroundColor = '';
    document.getElementById('resultado').style.borderColor = '';
    


    cargaElem.style.display = 'block';
    graficoChart.style.display = 'none';
    errorMsg.style.display = 'none';

    
    try {


        const respuesta = await fetch(`https://mindicador.cl/api/${conversionA}`);
        if (!respuesta.ok) {
            throw new Error('Error en la respuesta de la API');
        }
        
        const dato = await respuesta.json();
        


        if (!dato.serie || dato.serie.length === 0) {
            throw new Error('No hay datos disponibles');
        }
        

        
        const ultimos10Dias = dato.serie.slice(0, 10).reverse();
        const tarifas = ultimos10Dias.map(dia => dia.valor);
        const fechas = ultimos10Dias.map(dia => {
            const fecha = new Date(dia.fecha);
            return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        });
        


        tarifaActual = {
            values: tarifas,
            dates: fechas,
            current: tarifas[tarifas.length - 1]
        };
        


        createOrUpdateChart(tarifas, fechas, conversionA);
        


        convertCurrency();
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        errorMsg.style.display = 'block';
        cargaElem.style.display = 'none';
        document.getElementById('resultado').textContent = 'Error al cargar datos';
    }
}



function createOrUpdateChart(tarifas, fechas, conversionA) {
    const ctx = document.getElementById('grafico-chart').getContext('2d');
    const cargaElem = document.getElementById('carga');
    const graficoChart = document.getElementById('grafico-chart');
    


    cargaElem.style.display = 'none';
    graficoChart.style.display = 'block';
    


    const azulColor = '#3498db';
    const azulFondo = 'rgba(52, 152, 219, 0.1)';



    const nomMoneda = {
        'dolar': 'Dólar Estadounidense (USD)',
        'euro': 'Euro (EUR)',
        'uf': 'Unidad de Fomento (UF)',
        'utm': 'Unidad Tributaria Mensual (UTM)',
        'bitcoin': 'Bitcoin (BTC)'
    };
    
    if (chart) {


        chart.data.labels = fechas;
        chart.data.datasets[0].data = tarifas;
        chart.data.datasets[0].label = `CLP a ${nomMoneda[conversionA]}`;
        chart.data.datasets[0].borderColor = azulColor;
        chart.data.datasets[0].backgroundColor = azulFondo;
        chart.update();
    } else {


        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [{
                    label: `CLP a ${nomMoneda[conversionA]}`,
                    data: tarifas,
                    borderColor: azulColor,
                    backgroundColor: azulFondo,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: azulColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tasa de Cambio - Últimos 10 Días',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `1 ${nomMoneda[conversionA]} = $${context.parsed.y.toLocaleString('es-CL')} CLP`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-CL');
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
}



function convertCurrency() {
    const montoInput = parseFloat(document.getElementById('monto-input').value);
    const conversionA = document.getElementById('conversionA').value;
    
    if (isNaN(montoInput) || montoInput < 0) {
        document.getElementById('resultado').textContent = 'Ingrese una cantidad válida';
        return;
    }
    


    const rate = tarifaActual.current;
    const resultado = montoInput / rate;
    


    const simboloMoneda = {
        'dolar': 'US$',
        'euro': '€',
        'uf': 'UF',
        'utm': 'UTM',
        'bitcoin': 'BTC'
    };
    

    const simbolo = simboloMoneda[conversionA] || '';
    let formattedResult;
    
    if (conversionA === 'bitcoin') {
        formattedResult = resultado.toFixed(8);
    } else {
        formattedResult = resultado.toFixed(2);
    }
    
    document.getElementById('resultado').textContent = 
        `Resultado: ${simbolo} ${formattedResult}`;
}
