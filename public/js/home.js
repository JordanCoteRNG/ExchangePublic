const btcurl = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=cad&days=2&precision=2";
const ethurl = "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=cad&days=2&precision=2";
let settings = { method: "Get" };
let btcPrices;
let ethPrices;
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const options = { month: 'long', day: 'numeric' };
    const datePart = date.toLocaleDateString(undefined, options);
    const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
}

async function generateBTCChart(json) {
    btcPrices = json.prices.map(([timestamp, price]) => ({
        time: formatTimestamp(timestamp),
        price: price
    }));
    var ctx = document.getElementById('lineChart');
    const timeArray = btcPrices.map(entry => entry.time);
    const valueArray = btcPrices.map(entry => entry.price);
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeArray,
            datasets: [{
                color: app.color.theme,
                borderColor: app.color.theme,
                borderWidth: 1.5,
                pointBackgroundColor: app.color.theme,
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverBackgroundColor: app.color.theme,
                pointHoverBorderColor: app.color.theme,
                pointHoverRadius: 7,
                label: 'Valeur BTC ($CAD)',
                data: valueArray
            }]
        }
    });
}

async function generateETHChart(json) {
    ethPrices = json.prices.map(([timestamp, price]) => ({
        time: formatTimestamp(timestamp),
        price: price
    }));
    var ctx = document.getElementById('lineChartETH');
    const timeArray = ethPrices.map(entry => entry.time);
    const valueArray = ethPrices.map(entry => entry.price);
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeArray,
            datasets: [{
                color: app.color.theme,
                borderColor: app.color.theme,
                borderWidth: 1.5,
                pointBackgroundColor: app.color.theme,
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverBackgroundColor: app.color.theme,
                pointHoverBorderColor: app.color.theme,
                pointHoverRadius: 7,
                label: 'Valeur ETH ($CAD)',
                data: valueArray
            }]
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    fetch(btcurl, settings)
        .then(res => res.json())
        .then((json) => {
            generateBTCChart(json);
        });

    fetch(ethurl, settings)
        .then(res => res.json())
        .then((json) => {
            generateETHChart(json);
        });
});

