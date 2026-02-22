const CONFIG = {
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
let currentSlide = 0;
let slides = [];
let dots = [];
let prevBtn, nextBtn;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    slides = document.querySelectorAll('.carousel-slide');
    dots = document.querySelectorAll('.dot');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');

    loadCharts();
    setupCarousel();
    updateLastUpdated();

    // Auto refresh
    setInterval(() => {
        refreshActiveChart();
        updateLastUpdated();
    }, CONFIG.refreshInterval);
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

// Load Iframes for Charts
function loadCharts() {
    const containers = {
        minutes: document.getElementById('chart-minutes'),
        revenue: document.getElementById('chart-revenue'),
        impact: document.getElementById('chart-impact')
    };

    for (const [key, value] of Object.entries(CONFIG.charts)) {
        if (value && containers[key]) {
            const iframe = document.createElement('iframe');
            // Adding cache buster to bypass Google Sheets 5m cache if possible
            iframe.src = value + '&t=' + new Date().getTime();
            iframe.onload = () => {
                const loader = containers[key].querySelector('.loader');
                if (loader) loader.classList.add('hidden');
            };
            containers[key].appendChild(iframe);
        } else if (containers[key]) {
            const loader = containers[key].querySelector('.loader');
            if (loader) loader.classList.add('hidden');
        }
    }
}

// Refresh only the active chart to save bandwidth/flicker
function refreshActiveChart() {
    const keys = ['minutes', 'revenue', 'impact'];
    const activeKey = keys[currentSlide];
    const container = document.getElementById(`chart-${activeKey}`);
    const iframe = container.querySelector('iframe');

    if (iframe && CONFIG.charts[activeKey]) {
        iframe.src = CONFIG.charts[activeKey] + '&t=' + new Date().getTime();
    }
}

function updateLastUpdated() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    document.querySelector('#last-updated span').textContent = now.toLocaleString('en-US', options);
}
