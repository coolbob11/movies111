const API_KEY = '6fd8b10fcdc6cce151cbe651716a0620';
const IMG = 'https://image.tmdb.org/t/p/';
let activeTmdbId = null;
let activeType = null;
let activeSeason = 1;
let activeEpisode = 1;
let activeSource = 0;

const SOURCES = [
    { name: 'VidLink',  movie: id      => `https://vidlink.pro/movie/${id}`,                 tv: (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
    { name: 'VidSrc',   movie: id      => `https://vidsrc.me/embed/movie?tmdb=${id}`,        tv: (id,s,e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
    { name: '2Embed',   movie: id      => `https://www.2embed.stream/embed/movie/${id}`,     tv: (id,s,e) => `https://www.2embed.stream/embed/tv/${id}/${s}/${e}` },
    { name: 'VidNest',  movie: id      => `https://vidnest.fun/movie/${id}`,                 tv: (id,s,e) => `https://vidnest.fun/tv/${id}/${s}/${e}` },
];

window.onload = loadTrending;

// ── API ──
async function api(path) {
    const res = await fetch(`https://api.themoviedb.org/3${path}?api_key=${API_KEY}`);
    return res.json();
}
async function apiQ(path, query) {
    const res = await fetch(`https://api.themoviedb.org/3${path}?api_key=${API_KEY}&${query}`);
    return res.json();
}

// ── LOAD TRENDING ──
async function loadTrending() {
    showHome();
    document.getElementById('top10Section').style.display = 'block';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('shelfTitle').innerText = 'Trending Now';

    const data = await apiQ('/trending/all/day', '');
    const results = data.results.filter(r => r.poster_path && r.backdrop_path);

    setHero(results[0]);
    renderShelf('trendingTrack', results);
    renderTop10(results.slice(0, 10));

    const track = document.getElementById('trendingTrack');
    document.getElementById('trendNext').onclick = () => track.scrollBy({ left: 520, behavior: 'smooth' });
    document.getElementById('trendPrev').onclick = () => track.scrollBy({ left: -520, behavior: 'smooth' });
}

// ── FILTER ──
async function filterByType(type) {
    showHome();
    document.getElementById('top10Section').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';

    const label = type === 'movie' ? 'Trending Movies' : 'Trending TV Shows';
    document.getElementById('shelfTitle').innerText = label;

    const endpoint = type === 'movie' ? '/trending/movie/week' : '/trending/tv/week';
    const data = await apiQ(endpoint, '');
    const results = data.results.filter(r => r.poster_path);

    setHero({ ...results[0], media_type: type });
    renderShelf('trendingTrack', results.map(r => ({ ...r, media_type: type })));
}

// ── SEARCH ──
async function searchMedia() {
    const query = document.getElementById('searchInput').value.trim();
    if (query.length < 2) { loadTrending(); return; }

    showHome();
    document.getElementById('trendingShelf').style.display = 'none';
    document.getElementById('top10Section').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('searchLabel').innerText = `Results for "${query}"`;

    const data = await apiQ('/search/multi', `query=${encodeURIComponent(query)}`);
    const results = data.results.filter(r => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'));

    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '';
    results.forEach(item => grid.appendChild(makeCard(item)));
}

// ── HERO ──
async function setHero(item) {
    document.getElementById('heroBg').style.backgroundImage = `url(${IMG}original${item.backdrop_path})`;
    document.getElementById('heroTitle').innerText = item.title || item.name;
    document.getElementById('heroOverview').innerText = item.overview
        ? item.overview.slice(0, 150) + (item.overview.length > 150 ? '…' : '')
        : '';

    const type = item.media_type || 'movie';
    try {
        const detail = await api(`/${type}/${item.id}`);
        const tags = document.getElementById('heroTags');
        tags.innerHTML = '';
        (detail.genres || []).slice(0, 3).forEach(g => {
            const t = document.createElement('span');
            t.className = 'hero-tag';
            t.innerText = g.name;
            tags.appendChild(t);
        });
        if (detail.vote_average) {
            const t = document.createElement('span');
            t.className = 'hero-tag';
            t.innerText = `⭐ ${detail.vote_average.toFixed(1)}`;
            tags.appendChild(t);
        }
    } catch(e) {}

    document.getElementById('heroMeta').innerText = type === 'tv' ? 'TV SHOW · TRENDING' : 'MOVIE · TRENDING';
    document.getElementById('heroPlayBtn').onclick = () => openPlayer(item.id, type);
    document.getElementById('heroInfoBtn').onclick  = () => openPlayer(item.id, type);
}

// ── RENDER SHELF ──
function renderShelf(trackId, items) {
    const track = document.getElementById(trackId);
    track.innerHTML = '';
    items.forEach(item => { if (item.poster_path) track.appendChild(makeCard(item)); });
}

function makeCard(item) {
    const type = item.media_type || 'movie';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img class="card-poster" src="${IMG}w342${item.poster_path}" loading="lazy" alt="${item.title || item.name}">
        <div class="card-overlay"><div class="play-circle"><i class="ph ph-play-fill"></i></div></div>
        <div class="card-info">
            <div class="card-title">${item.title || item.name}</div>
            <div class="card-type">${type === 'tv' ? 'TV Show' : 'Movie'}</div>
        </div>`;
    card.onclick = () => openPlayer(item.id, type);
    return card;
}

// ── TOP 10 ──
function renderTop10(items) {
    const grid = document.getElementById('top10Grid');
    grid.innerHTML = '';
    items.forEach((item, i) => {
        if (!item.poster_path) return;
        const type = item.media_type || 'movie';
        const div = document.createElement('div');
        div.className = 'top10-card';
        div.innerHTML = `
            <img src="${IMG}w342${item.poster_path}" loading="lazy" alt="${item.title || item.name}">
            <div class="top10-rank">${i + 1}</div>
            <div class="top10-card-overlay">
                <div class="top10-name">${item.title || item.name}</div>
                <button class="top10-play"><i class="ph ph-play-fill"></i> Play</button>
            </div>`;
        div.onclick = () => openPlayer(item.id, type);
        grid.appendChild(div);
    });
}

// ── SHOW / HIDE HOME ──
function showHome() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('playerPage').classList.remove('open');
    document.getElementById('trendingShelf').style.display = 'block';
    document.body.style.overflow = '';
}

function showPlayer() {
    document.getElementById('homePage').style.display = 'none';
    const pp = document.getElementById('playerPage');
    pp.classList.add('open');
    pp.scrollTop = 0;
    document.body.style.overflow = 'hidden';
}

// ── SOURCE SWITCHER ──
function renderSourceBtns() {
    const bar = document.getElementById('sourceBtns');
    bar.innerHTML = '';
    SOURCES.forEach((src, i) => {
        const btn = document.createElement('button');
        btn.className = 'source-btn' + (i === activeSource ? ' active' : '');
        btn.innerText = src.name;
        btn.onclick = () => switchSource(i);
        bar.appendChild(btn);
    });
}

function switchSource(i) {
    activeSource = i;
    renderSourceBtns();
    if (activeType === 'tv') {
        playEpisode(activeTmdbId, activeSeason, activeEpisode);
    } else {
        document.getElementById('videoPlayer').src = SOURCES[i].movie(activeTmdbId);
    }
}

// ── OPEN PLAYER ──
async function openPlayer(tmdbId, type) {
    activeTmdbId = tmdbId;
    activeType = type;
    activeSource = 0;

    showPlayer();
    renderSourceBtns();

    try {
        const detail = await api(`/${type}/${tmdbId}`);
        document.getElementById('playerShowTitle').innerText = detail.title || detail.name || 'Now Playing';
        document.getElementById('playerEpLabel').innerText = type === 'tv'
            ? `Season 1 · Episode 1`
            : `Movie · ${(detail.release_date || '').slice(0, 4)}`;
    } catch(e) {
        document.getElementById('playerShowTitle').innerText = 'Now Playing';
    }

    if (type === 'tv') {
        document.getElementById('tvControls').style.display = 'block';
        activeSeason = 1;
        activeEpisode = 1;
        await loadSeasons(tmdbId);
        playEpisode(tmdbId, 1, 1);
    } else {
        document.getElementById('tvControls').style.display = 'none';
        document.getElementById('videoPlayer').src = SOURCES[activeSource].movie(tmdbId);
    }
}

// ── SEASONS ──
async function loadSeasons(tmdbId) {
    const detail = await api(`/tv/${tmdbId}`);
    const count = detail.number_of_seasons;
    const tabs = document.getElementById('seasonTabs');
    tabs.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const btn = document.createElement('button');
        btn.className = 'season-tab' + (i === 1 ? ' active' : '');
        btn.innerText = `S${i}`;
        btn.onclick = () => switchSeason(tmdbId, i);
        tabs.appendChild(btn);
    }
    await loadEpisodes(tmdbId, 1);
}

async function switchSeason(tmdbId, season) {
    activeSeason = season;
    document.querySelectorAll('.season-tab').forEach((t, i) => t.classList.toggle('active', i + 1 === season));
    await loadEpisodes(tmdbId, season);
}

// ── EPISODES ──
async function loadEpisodes(tmdbId, season) {
    const data = await api(`/tv/${tmdbId}/season/${season}`);
    const panel = document.getElementById('episodesPanel');
    panel.innerHTML = '';

    data.episodes.forEach(ep => {
        const isPlaying = activeSeason === season && activeEpisode === ep.episode_number;
        const card = document.createElement('div');
        card.className = 'ep-card' + (isPlaying ? ' playing' : '');
        card.id = `ep-${season}-${ep.episode_number}`;

        const thumb = ep.still_path ? `${IMG}w300${ep.still_path}` : '';
        const thumbHtml = thumb
            ? `<img class="ep-thumb" src="${thumb}" loading="lazy" alt="Episode ${ep.episode_number}">`
            : `<div class="ep-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:18px;"><i class="ph ph-film-slate"></i></div>`;

        const runtime = ep.runtime ? ` · ${ep.runtime}m` : '';
        card.innerHTML = `
            <div class="ep-thumb-wrap">
                ${thumbHtml}
                <div class="ep-thumb-overlay"><div class="ep-play-btn"><i class="ph ph-play-fill"></i></div></div>
            </div>
            <div class="ep-info">
                <div class="ep-num">EP ${ep.episode_number}${runtime}</div>
                <div class="ep-name">${ep.name || 'Episode ' + ep.episode_number}</div>
                <div class="ep-overview">${ep.overview || 'No description available.'}</div>
            </div>
            <span class="playing-badge">PLAYING</span>`;

        card.onclick = () => {
            playEpisode(tmdbId, season, ep.episode_number);
            document.getElementById('playerScreen').scrollIntoView({ behavior: 'smooth' });
        };
        panel.appendChild(card);
    });
}

// ── PLAY EPISODE ──
function playEpisode(tmdbId, season, episode) {
    activeSeason = season;
    activeEpisode = episode;
    document.getElementById('videoPlayer').src = SOURCES[activeSource].tv(tmdbId, season, episode);
    document.getElementById('playerEpLabel').innerText = `Season ${season} · Episode ${episode}`;

    document.querySelectorAll('.ep-card').forEach(c => c.classList.remove('playing'));
    const active = document.getElementById(`ep-${season}-${episode}`);
    if (active) {
        active.classList.add('playing');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ── CLOSE ──
function closePlayer() {
    document.getElementById('videoPlayer').src = '';
    showHome();
}

// ── FULLSCREEN ──
function goFullscreen() {
    const iframe = document.getElementById('videoPlayer');
    if (iframe.requestFullscreen) iframe.requestFullscreen();
    else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
    else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
