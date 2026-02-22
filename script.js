const CONFIG = {
    // The CSV Publish Link
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO9h_PXmTNYI7KBNkEGoRzHeHdeZaha1tIB0LpaC_zs-J-Vr4tVv30AHYl85XqNdvZtgg_lMwe2Ent/pub?gid=587889392&single=true&output=csv',
    refreshInterval: 30000 // 30 seconds
};

// State management
let currentSlide = 0;
let slides = [];
let dots = [];
let prevBtn, nextBtn;

// Chart Instances
let charts = {
    minutes: null,
    revenue: null,
    impact: null
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    slides = document.querySelectorAll('.carousel-slide');
    dots = document.querySelectorAll('.dot');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');

    setupCarousel();
    initCharts();
    fetchAndUpdateCharts(); // Initial load

    // Auto refresh
    setInterval(fetchAndUpdateCharts, CONFIG.refreshInterval);
});

// Setup Carousel Interactions
function setupCarousel() {
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarouselDOM();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateCarouselDOM();
        }
    });

    updateCarouselDOM(); // Initial state
}

function updateCarouselDOM() {
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
            dots[index].classList.add('active');
        } else {
            slide.classList.remove('active');
            dots[index].classList.remove('active');
        }
    });

    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
}

// ----- Chart.js Logic -----

// Common Chart Options for Pie
const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: '#f8fafc',
                font: { family: 'Outfit', size: 12 }
            }
        },
        tooltip: {
            bodyFont: { family: 'Outfit' },
            titleFont: { family: 'Outfit' }
        }
    }
};

const colors = [
    '#8b5cf6', '#c026d3', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#14b8a6', '#f43f5e', '#6366f1', '#ec4899'
];

function initCharts() {
    Chart.defaults.color = '#f8fafc';

    charts.minutes = new Chart(document.getElementById('minutesChart'), {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0 }] },
        options: baseChartOptions
    });

    charts.revenue = new Chart(document.getElementById('revenueChart'), {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0 }] },
        options: baseChartOptions
    });

    charts.impact = new Chart(document.getElementById('impactChart'), {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0 }] },
        options: baseChartOptions
    });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    return lines.slice(1).map(line => {
        // Handle basic commas inside quotes.
        // For production, a robust CSV library (like PapaParse) is recommended if data has complex quotes.
        let values = [];
        let inQuote = false;
        let start = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuote = !inQuote;
            else if (line[i] === ',' && !inQuote) {
                values.push(line.substring(start, i).trim().replace(/^"(.*)"$/, '$1'));
                start = i + 1;
            }
        }
        values.push(line.substring(start).trim().replace(/^"(.*)"$/, '$1'));

        let obj = {};
        headers.forEach((header, i) => { obj[header] = values[i] || ''; });
        return obj;
    });
}

async function fetchAndUpdateCharts() {
    if (!CONFIG.csvUrl) return;

    try {
        const urlWithCacheBuster = CONFIG.csvUrl + '&t=' + new Date().getTime();
        // Use allorigins to bypass CORS 
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlWithCacheBuster)}`;

        const response = await fetch(proxyUrl);
        const json = await response.json();
        const data = json.contents; // The actual CSV text

        const parsedData = parseCSV(data);

        if (parsedData.length > 0) {
            updateChartData(parsedData);
            updateLastUpdated();
        }
    } catch (error) {
        console.error('Error fetching data for charts:', error);
    }
}

function updateChartData(data) {
    // Expected column names based on the user's Sheet:
    // "Asset", "Minuets", "Revenue", "No. of (Students Benefited)"
    // Note: Adjust these perfectly if the CSV headers differ slightly.

    // Extract Arrays
    const labels = data.map(row => row['Asset']).filter(l => l);
    // Parse to float, treating empty/invalid strings as 0
    const minutes = data.map(row => parseFloat(row['Minuets']) || 0);
    const revenue = data.map(row => parseFloat(row['Revenue'].replace(/[^0-9.-]+/g, "")) || 0);
    const impact = data.map(row => parseFloat(row['No. of (Students Benefited)']) || 0);

    // Update Minutes Chart
    charts.minutes.data.labels = labels;
    charts.minutes.data.datasets[0].data = minutes;
    charts.minutes.update();

    // Update Revenue Chart
    charts.revenue.data.labels = labels;
    charts.revenue.data.datasets[0].data = revenue;
    charts.revenue.update();

    // Update Impact Chart
    charts.impact.data.labels = labels;
    charts.impact.data.datasets[0].data = impact;
    charts.impact.update();
}

function updateLastUpdated() {
    const now = new Date();
    const options = {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    };
    document.querySelector('#last-updated span').textContent = now.toLocaleString('en-US', options);
}
