const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const ImprovedWatchPartyServer = require('./src/server/improvedWatchPartyServer');
require('dotenv').config(); // Environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Güvenlik ayarları
const SECURITY_CONFIG = {
  // Zararlı script'leri engelleyen filtreler
  blockedScripts: [
    'f59d610a61063c7ef3ccdc1fd40d2ae6.js',
    'ads.js',
    'tracker.js',
    'malware.js',
    'redirect.js',
    'popup.js',
    'js15_as.js',
    'beacon.min.js',
    'base64.js',
    'sources.js',
    'reporting.js',
    'sbx.js'
  ],
  // Zararlı domain'ler
  blockedDomains: [
    'cloudflareinsights.com',
    'pixel.embed.su',
    'ainouzaudre.net',
    'cloudnestra.com',
    'static.cloudflareinsights.com',
    'js15_as.js',
    'f59d610a61063c7ef3ccdc1fd40d2ae6.js'
  ],
  // Güvenli domain'ler
  safeDomains: [
    'vidfast.pro',
    'vidjoy.pro',
    '111movies.com',
    'vidrock.net',
    'vidsrc.cc',
    'vidlink.pro',
    'mappletv.uk',
    'vidora.su',
    'vidzee.wtf',
    'videasy.net',
    'multiembed.mov',
    'moviesapi.club',
    'superembed.stream',
    'vidsrc.pro'
  ],
  // Güvenli header'lar
  safeHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};

// Güvenli script filtreleme fonksiyonu
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return html;
  
  const $ = cheerio.load(html);
  
  // Sadece en zararlı script'leri kaldır
  $('script').each((i, elem) => {
    const src = $(elem).attr('src');
    const content = $(elem).html();
    
    if (src) {
      // Sadece en zararlı script'leri engelle
      const isExtremelyMalicious = src.includes('f59d610a61063c7ef3ccdc1fd40d2ae6.js') ||
                                  src.includes('js15_as.js');
      
      if (isExtremelyMalicious) {
        $(elem).remove();
        console.log(`🚫 Blocked extremely malicious script: ${src}`);
      }
    }
    
    // İçerikte sadece en zararlı kod varsa kaldır
    if (content && (
      content.includes('f59d610a61063c7ef3ccdc1fd40d2ae6') ||
      content.includes('js15_as')
    )) {
      $(elem).remove();
      // Console log kaldırıldı - spam'i önlemek için
    }
  });
  
  // iframe'leri tamamen serbest bırak - sadece video player için gerekli
  // $('iframe').remove(); // Bu satırı kaldırdık - artık iframe'leri engellemiyoruz
  
  // Meta refresh'leri artık engellemiyoruz - otomatik açılmaya izin ver
  // $('meta[http-equiv="refresh"]').remove();
  
  // Link'leri artık engellemiyoruz - otomatik açılmaya izin ver
  // $('a[href*="ads"], a[href*="tracker"], a[href*="popup"], a[href*="cloudflareinsights"], a[href*="pixel.embed.su"], a[href*="ainouzaudre.net"], a[href*="cloudnestra.com"]').remove();
  
  // Zararlı CSS dosyalarını kaldır
  $('link[rel="stylesheet"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href && (
      href.includes('cloudflareinsights') ||
      href.includes('pixel.embed.su') ||
      href.includes('ainouzaudre.net') ||
      href.includes('cloudnestra.com')
    )) {
      $(elem).remove();
      console.log(`🚫 Blocked malicious CSS: ${href}`);
    }
  });
  
  // Zararlı img tag'lerini kaldır
  $('img').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src && (
      src.includes('cloudflareinsights') ||
      src.includes('pixel.embed.su') ||
      src.includes('ainouzaudre.net') ||
      src.includes('cloudnestra.com')
    )) {
      $(elem).remove();
      console.log(`🚫 Blocked malicious image: ${src}`);
    }
  });
  
  return $.html();
}

// TMDB API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || '9515f860fd35914108939e6540119a07'; // TMDB API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Yeni Player Servisleri Configuration
const PLAYER_SERVICES = [
  {
    name: 'VidFast',
    url: 'https://vidfast.pro',
    type: 'vidfast'
  },
  {
    name: 'VidJoy',
    url: 'https://vidjoy.pro/embed',
    type: 'vidjoy'
  },
  {
    name: '111Movies',
    url: 'https://111movies.com',
    type: '111movies'
  },
  {
    name: 'VidRock',
    url: 'https://vidrock.net',
    type: 'vidrock'
  },
  {
    name: 'VidSrc',
    url: 'https://vidsrc.cc/v2/embed',
    type: 'vidsrc'
  },
  {
    name: 'VidLink',
    url: 'https://vidlink.pro',
    type: 'vidlink'
  },
  {
    name: 'MappleTV',
    url: 'https://mappletv.uk/watch',
    type: 'mappletv'
  },
  {
    name: 'Vidora',
    url: 'https://vidora.su',
    type: 'vidora'
  },
  {
    name: 'VidZee',
    url: 'https://player.vidzee.wtf/embed',
    type: 'vidzee'
  },
  {
    name: 'Videasy',
    url: 'https://www.videasy.net/player',
    type: 'videasy'
  },
  {
    name: 'SuperEmbed',
    url: 'https://multiembed.mov',
    type: 'superembed'
  },
  {
    name: 'MoviesAPI',
    url: 'https://moviesapi.club',
    type: 'moviesapi'
  }
];

// Helper function to get TMDB data
async function fetchTMDBData(endpoint) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}?language=tr-TR`, {
      headers: {
        'Authorization': `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB API Error:', error.message);
    throw error;
  }
}

// Helper function to get VidSrc streaming data with security
async function fetchPlayerData(type, id, season = 1, episode = 1) {
  const promises = PLAYER_SERVICES.map(async (service) => {
    try {
      let url;
      
      switch (service.type) {
        case 'vidfast':
          // VidFast için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'vidjoy':
          // VidJoy için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case '111movies':
          // 111Movies için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'vidrock':
          // VidRock için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/embed/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/embed/movie/${id}`;
          }
          break;
        
        case 'vidsrc':
          // VidSrc için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'vidlink':
          // VidLink için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'mappletv':
          // MappleTV için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'vidora':
          // Vidora için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/embed/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/embed/movie/${id}`;
          }
          break;
        
        case 'vidzee':
          // VidZee için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        case 'videasy':
          // Videasy için TMDB ID kullan
          url = `${service.url}?tmdb=${id}`;
          break;
        
        case 'superembed':
          // SuperEmbed için TMDB ID ile URL oluştur
          if (type === 'tv') {
            url = `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
          } else {
            url = `https://multiembed.mov/?video_id=${id}&tmdb=1`;
          }
          break;
        
        case 'moviesapi':
          // MoviesAPI için URL oluştur
          if (type === 'tv') {
            url = `${service.url}/tv/${id}/${season}/${episode}`;
          } else {
            url = `${service.url}/movie/${id}`;
          }
          break;
        
        default:
          url = service.url;
      }
      
      const response = await axios.get(url, {
        timeout: 15000, // 15 saniye timeout (yeni servisler için daha uzun)
        headers: SECURITY_CONFIG.safeHeaders,
        maxRedirects: 5, // Daha fazla yönlendirmeye izin ver
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      
      // Medya müsaitlik kontrolü
      if (response.data && typeof response.data === 'string' && 
          (response.data.includes('This media is unavailable') ||
           response.data.includes('Media is unavailable') ||
           response.data.includes('Content not available') ||
           response.data.includes('Not Found'))) {
        // console.log(`❌ Media unavailable on ${service.name}`);
        return { service: service.name, error: 'Media unavailable' };
      }
      
      // HTML'i güvenli hale getir
      const sanitizedData = sanitizeHtml(response.data);
      
      return { service: service.name, url: service.url, data: sanitizedData };
    } catch (error) {
      // Sadece kritik hataları logla
      if (error.response?.status !== 404) {
        // console.log(`❌ Error fetching from ${service.name}: ${error.message}`);
      }
      return { service: service.name, error: error.message };
    }
  });

  const results = await Promise.all(promises);
  const validResults = results.filter(result => !result.error);
  
  // Eğer hiç geçerli sonuç yoksa, en azından ilk servisi döndür
  if (validResults.length === 0) {
    return [{ service: PLAYER_SERVICES[0].name, url: PLAYER_SERVICES[0].url, data: null }];
  }
  
  return validResults;
}

// Helper function to get player URL for new services
function getPlayerUrl(service, type, id, season = 1, episode = 1) {
  const serviceConfig = PLAYER_SERVICES.find(s => s.name === service);
  if (!serviceConfig) return '';

  switch (serviceConfig.type) {
    case 'videasy':
      // Videasy için doğru URL formatı
      if (type === 'tv') {
        return `https://player.videasy.net/tv/${id}/${season}/${episode}`;
      }
      return `https://player.videasy.net/movie/${id}`;
    
    case 'superembed':
      if (type === 'tv') {
        return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    
    case 'moviesapi':
      if (type === 'tv') {
        return `${serviceConfig.url}/tv/${id}/${season}/${episode}`;
      }
      return `${serviceConfig.url}/movie/${id}`;
    
    default:
      return serviceConfig.url;
  }
}

// API Routes

// Get trending movies
app.get('/api/trending/movies', async (req, res) => {
  try {
    const data = await fetchTMDBData('/trending/movie/week');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// Get trending TV series
app.get('/api/trending/tv', async (req, res) => {
  try {
    const data = await fetchTMDBData('/trending/tv/week');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending TV series' });
  }
});

// Get popular movies
app.get('/api/movies/popular', async (req, res) => {
  try {
    const data = await fetchTMDBData('/movie/popular');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

// Get popular TV series
app.get('/api/tv/popular', async (req, res) => {
  try {
    const data = await fetchTMDBData('/tv/popular');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular TV series' });
  }
});

// Search movies and TV series
app.get('/api/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const [movies, tv] = await Promise.all([
      fetchTMDBData(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`),
      fetchTMDBData(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`)
    ]);

    res.json({
      movies: {
        results: movies.results,
        total_pages: movies.total_pages,
        total_results: movies.total_results,
        page: movies.page
      },
      tv: {
        results: tv.results,
        total_pages: tv.total_pages,
        total_results: tv.total_results,
        page: tv.page
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Ayrı film arama endpoint'i
app.get('/api/search/movies', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await fetchTMDBData(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Ayrı dizi arama endpoint'i
app.get('/api/search/tv', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await fetchTMDBData(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search TV shows' });
  }
});

// Get movie details with credits, videos, and similar movies
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [movie, credits, videos, similar] = await Promise.all([
      fetchTMDBData(`/movie/${id}`),
      fetchTMDBData(`/movie/${id}/credits`),
      fetchTMDBData(`/movie/${id}/videos`),
      fetchTMDBData(`/movie/${id}/similar`)
    ]);
    
    res.json({
      ...movie,
      credits,
      videos,
      similar: similar.results || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Get TV series details with credits, videos, and similar shows
app.get('/api/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [tvShow, credits, videos, similar] = await Promise.all([
      fetchTMDBData(`/tv/${id}`),
      fetchTMDBData(`/tv/${id}/credits`),
      fetchTMDBData(`/tv/${id}/videos`),
      fetchTMDBData(`/tv/${id}/similar`)
    ]);
    
    res.json({
      ...tvShow,
      credits,
      videos,
      similar: similar.results || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV series details' });
  }
});

// Get streaming links for movie
app.get('/api/stream/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const streamingData = await fetchPlayerData('movie', id);
    res.json({ streamingData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streaming data' });
  }
});

// Get TV series seasons and episodes
app.get('/api/tv/:id/seasons', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchTMDBData(`/tv/${id}`);
    const seasons = data.seasons || [];
    
    // Her sezon için bölüm sayısını al
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        try {
          const seasonData = await fetchTMDBData(`/tv/${id}/season/${season.season_number}`);
          return {
            ...season,
            episodes: seasonData.episodes || []
          };
        } catch (error) {
          return {
            ...season,
            episodes: []
          };
        }
      })
    );
    
    res.json({ seasons: seasonsWithEpisodes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seasons data' });
  }
});

// Get streaming links for TV series with season and episode
app.get('/api/stream/tv/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const streamingData = await fetchPlayerData('tv', id, parseInt(season), parseInt(episode));
    res.json({ streamingData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streaming data' });
  }
});

// Get streaming links for TV series (default to first episode)
app.get('/api/stream/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const streamingData = await fetchPlayerData('tv', id, 1, 1);
    res.json({ streamingData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streaming data' });
  }
});

// Güvenli proxy endpoint'i
app.get('/api/proxy/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { season, episode, domain } = req.query;
  
  try {
    // Eğer belirli bir domain isteniyorsa, onu kullan
    if (domain && SECURITY_CONFIG.safeDomains.includes(domain.replace('https://', ''))) {
      let url;
      if (type === 'tv') {
        url = `${domain}/embed/${type}/${id}/${season || 1}/${episode || 1}`;
      } else {
        url = `${domain}/embed/${type}/${id}`;
      }
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: SECURITY_CONFIG.safeHeaders,
        maxRedirects: 3,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      
      // HTML'i güvenli hale getir
      const sanitizedData = sanitizeHtml(response.data);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Proxy-Source', domain);
      res.setHeader('X-Security-Filtered', 'true');
      
      res.send(sanitizedData);
      return;
    }
    
    // Varsayılan olarak ilk player servisini dene
    const firstService = PLAYER_SERVICES[0];
    const playerUrl = getPlayerUrl(firstService.name, type, id, season, episode);
    
    const response = await axios.get(playerUrl, {
      timeout: 15000,
      headers: SECURITY_CONFIG.safeHeaders,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });
    
    // HTML'i güvenli hale getir
    const sanitizedData = sanitizeHtml(response.data);
    
    // Content-Type'ı ayarla
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Proxy-Source', firstService.name);
    res.setHeader('X-Security-Filtered', 'true');
    
    res.send(sanitizedData);
  } catch (error) {
    console.log(`❌ Proxy error for embed.su: ${error.message}`);
    
    // Fallback olarak diğer player servislerini dene
    try {
      const playerData = await fetchPlayerData(type, id, season, episode);
      const firstValid = playerData.find(result => result.data);
      
      if (firstValid) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Proxy-Source', firstValid.service);
        res.setHeader('X-Security-Filtered', 'true');
        res.send(firstValid.data);
      } else {
        res.status(404).json({ error: 'No valid streaming source found' });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: 'Streaming service unavailable' });
    }
  }
});

// Güvenli proxy endpoint'i (sezon/bölüm ile)
app.get('/api/proxy/:type/:id/:season/:episode', async (req, res) => {
  const { type, id, season, episode } = req.params;
  
  try {
    // Önce ilk player servisini dene
    const firstService = PLAYER_SERVICES[0];
    const playerUrl = getPlayerUrl(firstService.name, type, id, season, episode);
    
    const response = await axios.get(playerUrl, {
      timeout: 15000,
      headers: SECURITY_CONFIG.safeHeaders,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });
    
    // HTML'i güvenli hale getir
    const sanitizedData = sanitizeHtml(response.data);
    
    // Content-Type'ı ayarla
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Proxy-Source', firstService.name);
    res.setHeader('X-Security-Filtered', 'true');
    
    res.send(sanitizedData);
  } catch (error) {
    console.log(`❌ Proxy error for ${PLAYER_SERVICES[0].name}: ${error.message}`);
    
    // Fallback olarak diğer player servislerini dene
    try {
      const playerData = await fetchPlayerData(type, id, season, episode);
      const firstValid = playerData.find(result => result.data);
      
      if (firstValid) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Proxy-Source', firstValid.service);
        res.setHeader('X-Security-Filtered', 'true');
        res.send(firstValid.data);
      } else {
        res.status(404).json({ error: 'No valid streaming source found' });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: 'Streaming service unavailable' });
    }
  }
});

// Player URL endpoints artık gerekli değil - frontend doğrudan URL'leri oluşturuyor

// Get movie genres
app.get('/api/genres/movies', async (req, res) => {
  try {
    const data = await fetchTMDBData('/genre/movie/list');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie genres' });
  }
});

// Get TV genres
app.get('/api/genres/tv', async (req, res) => {
  try {
    const data = await fetchTMDBData('/genre/tv/list');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV genres' });
  }
});

// Get movies by genre
app.get('/api/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const data = await fetchTMDBData(`/discover/movie?with_genres=${genreId}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies by genre' });
  }
});

// Get TV series by genre
app.get('/api/tv/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const data = await fetchTMDBData(`/discover/tv?with_genres=${genreId}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV series by genre' });
  }
});

// Get streaming providers
app.get('/api/providers', async (req, res) => {
  try {
    // Use hardcoded popular streaming providers for now
    const providers = [
      { provider_id: 8, provider_name: "Netflix", logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg" },
      { provider_id: 337, provider_name: "Disney Plus", logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" },
      { provider_id: 15, provider_name: "Hulu", logo_path: "/giwM8XX4V2AQb9vsoN7yti82tKK.jpg" },
      { provider_id: 9, provider_name: "Amazon Prime Video", logo_path: "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" },
      { provider_id: 384, provider_name: "HBO Max", logo_path: "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" },
      { provider_id: 350, provider_name: "Apple TV Plus", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg" }
    ];
    
    console.log('Hardcoded Providers:', providers.length);
    res.json({ results: providers });
  } catch (error) {
    console.error('Provider fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch streaming providers' });
  }
});

// Get movies by streaming provider
app.get('/api/movies/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1 } = req.query;
    const data = await fetchTMDBData(`/discover/movie?with_watch_providers=${providerId}&watch_region=TR&page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies by provider' });
  }
});

// Get TV series by streaming provider
app.get('/api/tv/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1 } = req.query;
    const data = await fetchTMDBData(`/discover/tv?with_watch_providers=${providerId}&watch_region=TR&page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV series by provider' });
  }
});

// Get combined content by streaming provider
app.get('/api/content/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, type = 'all' } = req.query;
    
    if (type === 'movie') {
      const data = await fetchTMDBData(`/discover/movie?with_watch_providers=${providerId}&watch_region=TR&page=${page}`);
      res.json(data);
    } else if (type === 'tv') {
      const data = await fetchTMDBData(`/discover/tv?with_watch_providers=${providerId}&watch_region=TR&page=${page}`);
      res.json(data);
    } else {
      // Both movies and TV series
      const [movies, tv] = await Promise.all([
        fetchTMDBData(`/discover/movie?with_watch_providers=${providerId}&watch_region=TR&page=${page}`),
        fetchTMDBData(`/discover/tv?with_watch_providers=${providerId}&watch_region=TR&page=${page}`)
      ]);
      
      // Combine and sort by popularity
      const combined = [
        ...movies.results.map(item => ({ ...item, media_type: 'movie' })),
        ...tv.results.map(item => ({ ...item, media_type: 'tv' }))
      ].sort((a, b) => b.popularity - a.popularity);
      
      res.json({
        results: combined,
        total_pages: Math.max(movies.total_pages, tv.total_pages),
        total_results: movies.total_results + tv.total_results,
        page: parseInt(page)
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content by provider' });
  }
});

// OpenSubtitles API Integration
app.post('/api/subtitles/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.json({ subtitles: [] });
    }
    
    // Basit mock altyazı verisi döndür (test için)
    const mockSubtitles = [
      {
        filename: `${query} - Türkçe Altyazı 1`,
        language: 'tr',
        url: 'https://example.com/subtitle1.srt',
        downloads: 1250,
        rating: 4.5
      },
      {
        filename: `${query} - Türkçe Altyazı 2`,
        language: 'tr',
        url: 'https://example.com/subtitle2.srt',
        downloads: 890,
        rating: 4.2
      },
      {
        filename: `${query} - English Subtitle`,
        language: 'en',
        url: 'https://example.com/subtitle3.srt',
        downloads: 2100,
        rating: 4.8
      }
    ];
    
    res.json({ subtitles: mockSubtitles });
  } catch (error) {
    console.error('Subtitle search error:', error.message);
    res.json({ subtitles: [] });
  }
});

// Download subtitle file
app.post('/api/subtitles/download', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    // Mock VTT altyazı içeriği döndür (test için)
    const mockVttContent = `WEBVTT

00:00:01.000 --> 00:00:05.000
Bu içerik için altyazı bulunamadı.

00:00:06.000 --> 00:00:10.000
Mock altyazı verisi gösteriliyor.

00:00:11.000 --> 00:00:15.000
Gerçek altyazı entegrasyonu için API geliştirmesi gerekiyor.`;
    
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.send(mockVttContent);
  } catch (error) {
    console.error('Subtitle download error:', error.message);
    res.status(500).json({ error: 'Failed to download subtitle' });
  }
});

// API olmayan route'lar için 404 döndür
app.get('*', (req, res) => {
  // Eğer API route'u değilse, frontend'e yönlendir
  if (!req.path.startsWith('/api/')) {
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://src-movie.onrender.com' 
      : 'http://localhost:3000';
    res.status(404).json({ 
      error: 'Route not found', 
      message: `This is a backend API server. Please use the frontend at ${frontendUrl}`,
      frontend: frontendUrl
    });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(PORT, () => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://src-movie.onrender.com' 
    : 'http://localhost:3000';
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? `https://src-movie.onrender.com/api` 
    : `http://localhost:${PORT}/api`;
  
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: ${frontendUrl}`);
  console.log(`Backend API: ${backendUrl}`);
});

// Start Improved Watch Party Server
// Production'da aynı port kullan, development'da farklı port
const watchPartyPort = process.env.NODE_ENV === 'production' ? PORT : 8080;
const watchPartyServer = new ImprovedWatchPartyServer(watchPartyPort);
console.log(`Improved Watch Party Server started on port ${watchPartyPort}`);