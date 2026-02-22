/**
 * CONFIGURATION: Replace these URLs with your published Google Sheet links
 * 
 * To get these:
 * 1. File > Share > Publish to web
 * 2. For CSV: Link tab > Select Sheet > Comma-separated values (.csv)
 * 3. For Charts: Embed tab > Select Chart > Publish
 */
const CONFIG = {
    // Paste the CSV URL here
    csvUrl: 'https://script.google.com/macros/s/AKfycbwseb5DK__uDq2SEqtjfs6fFgyRzEaWH3ZgGTFc4si2aCSO3s4eWJa5xsiBioVr8UdP/exec',

    // Paste the Chart Embed Links (src attribute from the <iframe>) here
    charts: {
        minutes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO9h_PXmTNYI7KBNkEGoRzHeHdeZaha1tIB0LpaC_zs-J-Vr4tVv30AHYl85XqNdvZtgg_lMwe2Ent/pubchart?oid=151358683&format=interactive',
        revenue: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO9h_PXmTNYI7KBNkEGoRzHeHdeZaha1tIB0LpaC_zs-J-Vr4tVv30AHYl85XqNdvZtgg_lMwe2Ent/pubchart?oid=215857505&format=interactive',
        impact: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO9h_PXmTNYI7KBNkEGoRzHeHdeZaha1tIB0LpaC_zs-J-Vr4tVv30AHYl85XqNdvZtgg_lMwe2Ent/pubchart?oid=2134680678&format=interactive'
    },

    // How often to refresh the data (in milliseconds)
    refreshInterval: 30000 // 30 seconds
};

// State management
let rawData = [];
let headers = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadCharts();
    fetchData();

    // Setup search
    document.getElementById('table-search').addEventListener('input', (e) => {
        filterTable(e.target.value);
    });

    // Auto refresh
    setInterval(fetchData, CONFIG.refreshInterval);
});

// Navigation Logic
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar nav li');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionTarget = item.getAttribute('data-section');

            // Update nav UI
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show target section
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === sectionTarget) s.classList.add('active');
            });
        });
    });
}

// Load Iframes for Charts
function loadCharts() {
    const containers = {
        minutes: document.getElementById('chart-minutes'),
        revenue: document.getElementById('chart-revenue'),
        impact: document.getElementById('chart-impact')
    };

    for (const [key, value] of Object.entries(CONFIG.charts)) {
        if (value && value !== 'CHART_1_EMBED_SRC_URL' && value !== 'CHART_2_EMBED_SRC_URL' && value !== 'CHART_3_EMBED_SRC_URL') {
            const iframe = document.createElement('iframe');
            iframe.src = value;
            iframe.onload = () => {
                containers[key].querySelector('.loader').classList.add('hidden');
                const placeholder = containers[key].querySelector('.placeholder-text');
                if (placeholder) placeholder.classList.add('hidden');
            };
            containers[key].appendChild(iframe);
        } else {
            const loader = containers[key].querySelector('.loader');
            if (loader) loader.classList.add('hidden');
        }
    }
}

// Fetch Data from Google Sheet CSV
async function fetchData() {
    if (!CONFIG.csvUrl || CONFIG.csvUrl === 'YOUR_CSV_PUBLISH_LINK_HERE') {
        document.getElementById('table-loader').classList.add('hidden');
        document.getElementById('no-data-msg').classList.remove('hidden');
        return;
    }

    try {
        // Add cache-busting parameter
        const urlWithCacheBuster = CONFIG.csvUrl + (CONFIG.csvUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        const response = await fetch(urlWithCacheBuster);
        const data = await response.text();
        parseCSV(data);
        renderTable(rawData);

        document.getElementById('table-loader').classList.add('hidden');
        document.getElementById('no-data-msg').classList.add('hidden');
        updateLastUpdated();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('table-loader').classList.add('hidden');
        document.getElementById('no-data-msg').textContent = "Connection Error. Check URL.";
        document.getElementById('no-data-msg').classList.remove('hidden');
    }
}

// Simple CSV Parser
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length === 0) return;

    // Filter out empty lines
    const validLines = lines.filter(line => line.trim() !== '');

    headers = validLines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    rawData = validLines.slice(1).map(line => {
        // Handle commas inside quotes if necessary
        const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
}

// Render Table
function renderTable(data) {
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');

    // Render Headers
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

    // Render Rows
    tbody.innerHTML = data.map(row => {
        return `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`;
    }).join('');
}

// Filter Logic
function filterTable(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = rawData.filter(row => {
        return Object.values(row).some(val =>
            String(val).toLowerCase().includes(term)
        );
    });
    renderTable(filtered);
}

function updateLastUpdated() {
    const now = new Date();
    document.querySelector('#last-updated span').textContent = now.toLocaleTimeString();
}
