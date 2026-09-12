const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');

const errorMsg = document.getElementById('errorMsg');
const weatherResult = document.getElementById('weatherResult');

const cityName = document.getElementById('cityName');
const countryName = document.getElementById('countryName');
const wind = document.getElementById('wind');
const uvIndex = document.getElementById('uvIndex');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();

  if (city === '') {
    showError('Please enter a city name.');
    return;
  }

  getCoordinates(city);
});
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
  weatherResult.classList.add('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}
async function getCoordinates(city) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10`;
    const response = await fetch(geoUrl);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      showError('City not found. Please check the spelling.');
      return;
    }

    // Naam match kare AUR population kaafi ho (chhoti/unknown jagah exclude karne ke liye)
    const matches = data.results.filter(
      (place) =>
        place.name.toLowerCase() === city.toLowerCase().trim() &&
        place.population &&
        place.population >= 1000
    );

    if (matches.length === 0) {
      showError('City not found. Please enter a valid city name.');
      return;
    }

    const match = matches.sort((a, b) => b.population - a.population)[0];

    const { latitude, longitude, name, country } = match;
    hideError();
    getWeather(latitude, longitude, name, country);

  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
}
async function getWeather(lat, lon, city, country) {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=uv_index_max&timezone=auto`;
    const response = await fetch(weatherUrl);
    const data = await response.json();

    displayWeather(data.current, data.daily, city, country);

  } catch (error) {
    showError('Unable to fetch weather. Please try again.');
  }
}
function getWeatherInfo(code) {
  if (code === 0) return { condition: 'Clear sky', icon: 'sun' };
  if (code >= 1 && code <= 3) return { condition: 'Cloudy', icon: 'cloud' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy', icon: 'fog' };
  if (code >= 51 && code <= 67) return { condition: 'Rainy', icon: 'rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snowy', icon: 'snow' };
  if (code >= 80 && code <= 82) return { condition: 'Rain showers', icon: 'rain' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: 'thunder' };
  return { condition: 'Unknown', icon: 'cloud' };
}

function displayWeather(current, daily, city, country) {
  const weatherInfo = getWeatherInfo(current.weather_code);

  cityName.textContent = city;
  countryName.textContent = country || '';
  weatherIcon.innerHTML = svgIcons[weatherInfo.icon];
  temperature.textContent = `${current.temperature_2m}°C`;
  condition.textContent = weatherInfo.condition;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${current.wind_speed_10m} km/h`;

  const uv = daily && daily.uv_index_max ? daily.uv_index_max[0] : null;
  uvIndex.textContent = uv !== null ? `${uv} ${getUvLabel(uv)}` : '—';

  weatherResult.classList.remove('hidden');
  changeBackground(current.weather_code);
}

function getUvLabel(uv) {
  if (uv <= 2) return '(Low)';
  if (uv <= 5) return '(Moderate)';
  if (uv <= 7) return '(High)';
  if (uv <= 10) return '(Very High)';
  return '(Extreme)';
}

function changeBackground(code) {
  let tint;

  if (code === 0) {
    tint = 'rgba(255, 170, 60, 0.28)';
    showSun();
  } else if (code >= 1 && code <= 48) {
    tint = 'rgba(90, 100, 115, 0.5)';
    showClouds();
  } else if (code >= 51 && code <= 82) {
    tint = 'rgba(20, 60, 110, 0.55)';
    showRain();
  } else if (code >= 71 && code <= 77) {
    tint = 'rgba(150, 170, 190, 0.4)';
    showClouds();
  } else if (code >= 95 && code <= 99) {
    tint = 'rgba(20, 20, 30, 0.7)';
    showRain();
  } else {
    tint = 'rgba(10, 20, 40, 0.35)';
    clearEffects();
  }

  document.documentElement.style.setProperty('--overlay-tint', tint);
}

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      hideError();

      let locationName = 'Your Location';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        locationName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county ||
          'Your Location';
      } catch (error) {
          console.log('Reverse geocoding error:', error);
        // agar reverse geocoding fail ho, tou default 'Your Location' hi rahega
      }

      getWeather(lat, lon, locationName, '');
    },
    () => {
      showError('Unable to retrieve your location. Please allow location access.');
    }
  );
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});
const quotes = [
  "🌤️ Every sky tells a story.",
  "🌦️ Some days sunshine, some days rain — both are beautiful.",
  "🌍 Wherever you go, the sky follows.",
  "☁️ There's no bad weather, only different beauty.",
  "🌈 Chase the sun, dance in the rain."
];

let quoteIndex = 0;
const quoteText = document.getElementById('quoteText');

setInterval(() => {
  quoteText.style.opacity = 0;

  setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteText.textContent = quotes[quoteIndex];
    quoteText.style.opacity = 0.9;
  }, 600);

}, 3500);
const svgIcons = {
  sun: `<svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="14" fill="#FFC93C"/>
    <g stroke="#FFC93C" stroke-width="4" stroke-linecap="round">
      <line x1="32" y1="4" x2="32" y2="12"/>
      <line x1="32" y1="52" x2="32" y2="60"/>
      <line x1="4" y1="32" x2="12" y2="32"/>
      <line x1="52" y1="32" x2="60" y2="32"/>
      <line x1="12" y1="12" x2="17.5" y2="17.5"/>
      <line x1="46.5" y1="46.5" x2="52" y2="52"/>
      <line x1="12" y1="52" x2="17.5" y2="46.5"/>
      <line x1="46.5" y1="17.5" x2="52" y2="12"/>
    </g>
  </svg>`,
  cloud: `<svg viewBox="0 0 64 64">
    <path d="M46 44H18a12 12 0 1 1 2.5-23.7A14 14 0 0 1 47 24a10 10 0 0 1-1 20Z" fill="#EAF2FA" stroke="#B8CBDE" stroke-width="1.5"/>
  </svg>`,
  rain: `<svg viewBox="0 0 64 64">
    <path d="M46 36H18a12 12 0 1 1 2.5-23.7A14 14 0 0 1 47 16a10 10 0 0 1-1 20Z" fill="#CBD9E8"/>
    <g stroke="#4A90D9" stroke-width="3" stroke-linecap="round">
      <line x1="22" y1="46" x2="19" y2="54"/>
      <line x1="32" y1="46" x2="29" y2="54"/>
      <line x1="42" y1="46" x2="39" y2="54"/>
    </g>
  </svg>`,
  snow: `<svg viewBox="0 0 64 64">
    <path d="M46 34H18a12 12 0 1 1 2.5-23.7A14 14 0 0 1 47 14a10 10 0 0 1-1 20Z" fill="#DCE8F2"/>
    <g stroke="#7FB3E0" stroke-width="2.5" stroke-linecap="round">
      <line x1="22" y1="46" x2="22" y2="56"/>
      <line x1="17.5" y1="51" x2="26.5" y2="51"/>
      <line x1="32" y1="46" x2="32" y2="56"/>
      <line x1="27.5" y1="51" x2="36.5" y2="51"/>
      <line x1="42" y1="46" x2="42" y2="56"/>
      <line x1="37.5" y1="51" x2="46.5" y2="51"/>
    </g>
  </svg>`,
  thunder: `<svg viewBox="0 0 64 64">
    <path d="M46 32H18a12 12 0 1 1 2.5-23.7A14 14 0 0 1 47 12a10 10 0 0 1-1 20Z" fill="#9FB3C8"/>
    <polygon points="34,40 24,54 31,54 28,62 40,46 33,46" fill="#FFC93C"/>
  </svg>`,
  fog: `<svg viewBox="0 0 64 64">
    <path d="M16.7 8a5 5 0 1 1-.1 7.1"></path>
    <path d="M4 14.9A7 7 0 0 1 8 4a6.5 6.5 0 0 1 5.5 3"></path>
    <path d="M8 15h8"></path><path d="M4 19h16"></path>
  </svg>`
};
const weatherEffects = document.getElementById('weatherEffects');

function clearEffects() {
  weatherEffects.innerHTML = '';
}

function showRain() {
  clearEffects();
  for (let i = 0; i < 40; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    weatherEffects.appendChild(drop);
  }
}

function showClouds() {
  clearEffects();
  for (let i = 0; i < 5; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud-shape';
    const size = 80 + Math.random() * 100;
    cloud.style.width = `${size}px`;
    cloud.style.height = `${size * 0.5}px`;
    cloud.style.top = `${Math.random() * 40}%`;
    cloud.style.animationDuration = `${30 + Math.random() * 20}s`;
    cloud.style.animationDelay = `${Math.random() * 10}s`;
    weatherEffects.appendChild(cloud);
  }
}

function showSun() {
  clearEffects();
  const sun = document.createElement('div');
  sun.className = 'sun-glow';
  weatherEffects.appendChild(sun);
}