const API_KEY = '6fd8b10fcdc6cce151cbe651716a0620';
let activeImdbId = '';

window.onload = loadTrending;

// 1. Fetching Data
async function loadTrending() {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`);
    const data = await res.json();
    setHero(data.results[0]);
    displayGrid(data.results);
    displayTopTen(data.results.slice(0, 10));
}

async function searchMedia() {
    const query = document.getElementById('searchInput').value;
    if (query.length < 2) return;
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();
    displayGrid(data.results);
    document.getElementById('gridHeader').innerText = `Results for "${query}"`;
}

// 2. Rendering UI
function displayGrid(items) {
    const grid = document.getElementById('movieGrid');
    grid.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<img src="https://image.tmdb.org/t/p/w342${item.poster_path}"><p>${item.title || item.name}</p>`;
        card.onclick = () => openPlayer(item.id, item.media_type || 'movie');
        grid.appendChild(card);
    });
}

function displayTopTen(items) {
    const topList = document.getElementById('topList');
    topList.innerHTML = items.map((item, i) => `
        <div style="display:flex; gap:15px; margin-bottom:15px; cursor:pointer;" onclick="openPlayer(${item.id}, '${item.media_type}')">
            <span style="font-size:1.5rem; font-weight:bold; color:#444;">${i+1}</span>
            <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" style="width:45px; border-radius:4px;">
            <p style="font-size:0.8rem; margin:0;">${item.title || item.name}</p>
        </div>
    `).join('');
}

function setHero(item) {
    const hero = document.getElementById('hero');
    hero.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.9), transparent), url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;
    document.getElementById('heroTitle').innerText = item.title || item.name;
    document.getElementById('heroPlayBtn').onclick = () => openPlayer(item.id, item.media_type || 'movie');
}

// 3. Player Logic
async function openPlayer(tmdbId, type) {
    const idRes = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${API_KEY}`);
    const ids = await idRes.json();
    activeImdbId = ids.imdb_id;

    if (!activeImdbId) return alert("No IMDb ID found for this title.");

    const controls = document.getElementById('controlsContainer');
    if (type === 'tv' || type === 'show') {
        controls.style.display = 'block';
        const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${API_KEY}`);
        const tvData = await tvRes.json();
        setupSeasons(tvData.number_of_seasons, tmdbId);
        changeSource(1, 1);
    } else {
        controls.style.display = 'none';
        changeSource();
    }
    document.getElementById('videoOverlay').style.display = 'block';
}

function setupSeasons(count, tmdbId) {
    const select = document.getElementById('seasonSelect');
    select.innerHTML = '';
    for(let i=1; i<=count; i++) select.innerHTML += `<option value="${i}">Season ${i}</option>`;
    select.dataset.tmdbId = tmdbId;
    loadEpisodes();
}

async function loadEpisodes() {
    const tmdbId = document.getElementById('seasonSelect').dataset.tmdbId;
    const s = document.getElementById('seasonSelect').value;
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${s}?api_key=${API_KEY}`);
    const data = await res.json();
    
    const grid = document.getElementById('episodeGrid');
    grid.innerHTML = data.episodes.map(ep => `
        <button class="ep-btn" onclick="changeSource(${s}, ${ep.episode_number})">Ep ${ep.episode_number}</button>
    `).join('');
}

function changeSource(s=null, e=null) {
    const p = document.getElementById('videoPlayer');
    p.src = s ? `https://vidsrc.cc/v2/embed/tv/${activeImdbId}/${s}/${e}` : `https://vidsrc.cc/v2/embed/movie/${activeImdbId}`;
}

function closePlayer() {
    document.getElementById('videoOverlay').style.display = 'none';
    document.getElementById('videoPlayer').src = '';
}
