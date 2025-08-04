import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, ExternalLink, Users } from 'lucide-react';
import WatchParty from '../components/WatchParty';
import './Player.css';

const Player = () => {
  const { type, id, season, episode } = useParams();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamingData, setStreamingData] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [error, setError] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(season ? parseInt(season) : 1);
  const [selectedEpisode, setSelectedEpisode] = useState(episode ? parseInt(episode) : 1);
  const [streamingSources, setStreamingSources] = useState([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [showSubtitleUpload, setShowSubtitleUpload] = useState(false);
  const [watchProgress, setWatchProgress] = useState(null);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showWatchParty, setShowWatchParty] = useState(false);

  // Yeni player servisleri
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

  useEffect(() => {
    fetchContentDetails();
    if (type === 'tv') {
      fetchSeasons();
    }
    // Streaming kaynaklarını yükle
    loadStreamingSources();
    // Kaydedilmiş izleme ilerlemesini yükle
    loadSavedProgress();
  }, [type, id]);

  // İçerik yüklendiğinde altyazı ara
  useEffect(() => {
    if (content && content.title) {
      searchSubtitles();
    }
  }, [content, selectedSeason, selectedEpisode]);

  // Kaydedilmiş izleme ilerlemesini yükle
  const loadSavedProgress = () => {
    try {
      const storageKey = `watch_progress_${type}_${id}_${selectedSeason || 1}_${selectedEpisode || 1}`;
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setWatchProgress(progressData);
        console.log('Kaydedilmiş izleme ilerlemesi yüklendi:', progressData);
      }
    } catch (error) {
      console.error('İzleme ilerlemesi yüklenirken hata:', error);
    }
  };

  // Sezon/bölüm değişikliklerinde player'ı yeniden yükle
  useEffect(() => {
    if (type === 'tv' && selectedStream) {
      // Player URL'sini güncelle
      const currentSource = streamingSources.find(s => s.type === selectedStream);
      if (currentSource) {
        setSelectedStream(currentSource.type);
      }
    }
    // Yeni bölüm için kaydedilmiş ilerlemeyi yükle
    loadSavedProgress();
  }, [selectedSeason, selectedEpisode]);

  // Videasy player'dan gelen progress mesajlarını dinle
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // VidRock player'dan gelen mesajları kontrol et
        if (event.origin === 'https://vidrock.net') {
          // Player event'lerini işle
          if (event.data?.type === 'PLAYER_EVENT') {
            const { event: eventType, currentTime, duration, tmdbId, mediaType, season, episode } = event.data.data;
            console.log(`VidRock Player ${eventType} at ${currentTime}s of ${duration}s`);
            
            // Progress verisi varsa kaydet
            if (currentTime && duration) {
              const progressData = {
                currentTime,
                duration,
                progress: (currentTime / duration) * 100,
                tmdbId,
                mediaType,
                season,
                episode
              };
              
              setWatchProgress(progressData);
              
              // LocalStorage'a kaydet
              const storageKey = `watch_progress_${type}_${id}_${selectedSeason || 1}_${selectedEpisode || 1}`;
              localStorage.setItem(storageKey, JSON.stringify({
                ...progressData,
                lastWatched: new Date().toISOString()
              }));
            }
          }
          
          // Media data'yı işle
          if (event.data?.type === 'MEDIA_DATA') {
            const mediaData = event.data.data;
            localStorage.setItem('vidRockProgress', JSON.stringify(mediaData));
            console.log('VidRock media data saved:', mediaData);
          }
        }
        
        // Videasy player'dan gelen mesajları kontrol et (backward compatibility)
        if (typeof event.data === 'string') {
          const progressData = JSON.parse(event.data);
          
          // Progress verisi varsa kaydet
          if (progressData.id && progressData.progress !== undefined) {
            setWatchProgress(progressData);
            
            // LocalStorage'a kaydet
            const storageKey = `watch_progress_${type}_${id}_${selectedSeason || 1}_${selectedEpisode || 1}`;
            localStorage.setItem(storageKey, JSON.stringify({
              ...progressData,
              lastWatched: new Date().toISOString()
            }));
            
            console.log('İzleme ilerlemesi kaydedildi:', progressData);
          }
        }
      } catch (error) {
        // JSON parse hatası - normal mesaj, görmezden gel
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [type, id, selectedSeason, selectedEpisode]);

  // URL'den party parametresini kontrol et
  useEffect(() => {
    const partyId = searchParams.get('party');
    const autoJoin = searchParams.get('autoJoin');
    
    console.log('🔍 URL parametreleri kontrol ediliyor:', { partyId, autoJoin });
    
    if (partyId && autoJoin === 'true') {
      // Party ID ve autoJoin varsa otomatik olarak watch party'yi aç
      console.log('🚀 Otomatik party açılıyor:', partyId);
      setShowWatchParty(true);
      
      // VidRock player'ı otomatik olarak seç
      const vidRockService = PLAYER_SERVICES.find(service => service.type === 'vidrock');
      if (vidRockService) {
        console.log('🎬 VidRock player seçiliyor:', vidRockService.type);
        setSelectedStream(vidRockService.type);
        setCurrentPlayer(vidRockService.name);
      }
    } else if (partyId) {
      // Sadece party ID varsa normal şekilde watch party'yi aç
      console.log('🚪 Manuel party açılıyor:', partyId);
      setShowWatchParty(true);
    }
  }, [searchParams, type, id, selectedSeason, selectedEpisode]);

  const loadStreamingSources = async () => {
    try {
      // API endpoint'i olmadığı için direkt varsayılan kaynakları kullan
      const sources = PLAYER_SERVICES.map(service => ({
        name: service.name,
        url: service.type, // type'ı url olarak kullan
        type: service.type
      }));
      
      console.log('Streaming sources loaded:', sources);
      setStreamingSources(sources);
      setSelectedStream(sources[0].type); // İlk kaynağın type'ını seç
      setCurrentSourceIndex(0);
      console.log('Selected stream:', sources[0].type);
    } catch (error) {
      console.error('Error loading streaming sources:', error);
      // Hata durumunda varsayılan kaynakları kullan
      const defaultSources = PLAYER_SERVICES.map(service => ({
        name: service.name,
        url: service.type,
        type: service.type
      }));
      setStreamingSources(defaultSources);
      setSelectedStream(defaultSources[0].type);
    }
  };

  const fetchContentDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${type}/${id}`);
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching content details:', error);
      setError('İçerik bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamingData = async () => {
    try {
      const response = await fetch(`/api/stream/${type}/${id}`);
      const data = await response.json();
      setStreamingData(data.streamingData);
    } catch (error) {
      console.error('Error fetching streaming data:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await fetch(`/api/tv/${id}/seasons`);
      const data = await response.json();
      setSeasons(data.seasons || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const getPlayerUrlByType = (serviceType) => {
    const serviceConfig = PLAYER_SERVICES.find(s => s.type === serviceType);
    if (!serviceConfig) return '';

    console.log('Getting player URL for type:', serviceType, 'Config:', serviceConfig);

    switch (serviceConfig.type) {
      case 'vidfast':
        // VidFast için URL oluştur
        if (type === 'tv') {
          return `https://vidfast.pro/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidfast.pro/movie/${id}`;
      
      case 'vidjoy':
        // VidJoy için URL oluştur
        if (type === 'tv') {
          return `https://vidjoy.pro/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidjoy.pro/embed/movie/${id}`;
      
      case '111movies':
        // 111Movies için URL oluştur
        if (type === 'tv') {
          return `https://111movies.com/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://111movies.com/movie/${id}`;
      
      case 'vidrock':
        // VidRock için URL oluştur
        if (type === 'tv') {
          return `https://vidrock.net/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidrock.net/embed/movie/${id}`;
      
      case 'vidsrc':
        // VidSrc için URL oluştur
        if (type === 'tv') {
          return `https://vidsrc.cc/v2/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidsrc.cc/v2/embed/movie/${id}`;
      
      case 'vidlink':
        // VidLink için URL oluştur
        if (type === 'tv') {
          return `https://vidlink.pro/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidlink.pro/movie/${id}`;
      
      case 'mappletv':
        // MappleTV için URL oluştur
        if (type === 'tv') {
          return `https://mappletv.uk/watch/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://mappletv.uk/watch/movie/${id}`;
      
      case 'vidora':
        // Vidora için URL oluştur
        if (type === 'tv') {
          return `https://vidora.su/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidora.su/embed/movie/${id}`;
      
      case 'vidzee':
        // VidZee için URL oluştur
        if (type === 'tv') {
          return `https://player.vidzee.wtf/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://player.vidzee.wtf/embed/movie/${id}`;
      
      case 'videasy':
        // Videasy için gelişmiş URL formatı - Videasy.net dokümantasyonuna göre
        if (type === 'tv') {
          const params = new URLSearchParams({
            dub: 'true',
            nextEpisode: 'true',
            autoplayNextEpisode: 'true',
            episodeSelector: 'true',
            color: '8B5CF6' // Purple theme
          });
          return `https://player.videasy.net/tv/${id}/${selectedSeason}/${selectedEpisode}?${params.toString()}`;
        }
        const movieParams = new URLSearchParams({
          color: '8B5CF6' // Purple theme
        });
        return `https://player.videasy.net/movie/${id}?${movieParams.toString()}`;
      
      case 'superembed':
        // SuperEmbed için TMDB ID ile URL oluştur
        if (type === 'tv') {
          return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}`;
        }
        return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      
      case 'moviesapi':
        // MoviesAPI için URL oluştur
        if (type === 'tv') {
          return `https://moviesapi.club/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://moviesapi.club/movie/${id}`;
      
      default:
        return '';
    }
  };

  const getPlayerUrl = (service) => {
    const serviceConfig = PLAYER_SERVICES.find(s => s.url === service);
    if (!serviceConfig) return '';

    switch (serviceConfig.type) {
      case 'vidfast':
        // VidFast için URL oluştur
        if (type === 'tv') {
          return `https://vidfast.pro/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidfast.pro/movie/${id}`;
      
      case 'vidjoy':
        // VidJoy için URL oluştur
        if (type === 'tv') {
          return `https://vidjoy.pro/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidjoy.pro/embed/movie/${id}`;
      
      case '111movies':
        // 111Movies için URL oluştur
        if (type === 'tv') {
          return `https://111movies.com/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://111movies.com/movie/${id}`;
      
      case 'vidrock':
        // VidRock için URL oluştur
        if (type === 'tv') {
          return `https://vidrock.net/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidrock.net/embed/movie/${id}`;
      
      case 'vidsrc':
        // VidSrc için URL oluştur
        if (type === 'tv') {
          return `https://vidsrc.cc/v2/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidsrc.cc/v2/embed/movie/${id}`;
      
      case 'vidlink':
        // VidLink için URL oluştur
        if (type === 'tv') {
          return `https://vidlink.pro/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidlink.pro/movie/${id}`;
      
      case 'mappletv':
        // MappleTV için URL oluştur
        if (type === 'tv') {
          return `https://mappletv.uk/watch/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://mappletv.uk/watch/movie/${id}`;
      
      case 'vidora':
        // Vidora için URL oluştur
        if (type === 'tv') {
          return `https://vidora.su/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://vidora.su/embed/movie/${id}`;
      
      case 'vidzee':
        // VidZee için URL oluştur
        if (type === 'tv') {
          return `https://player.vidzee.wtf/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `https://player.vidzee.wtf/embed/movie/${id}`;
      
      case 'videasy':
        // Videasy için gelişmiş URL formatı - Videasy.net dokümantasyonuna göre
        if (type === 'tv') {
          const params = new URLSearchParams({
            dub: 'true',
            nextEpisode: 'true',
            autoplayNextEpisode: 'true',
            episodeSelector: 'true',
            color: '8B5CF6' // Purple theme
          });
          return `https://player.videasy.net/tv/${id}/${selectedSeason}/${selectedEpisode}?${params.toString()}`;
        }
        const movieParams = new URLSearchParams({
          color: '8B5CF6' // Purple theme
        });
        return `https://player.videasy.net/movie/${id}?${movieParams.toString()}`;
      
      case 'superembed':
        // SuperEmbed için TMDB ID ile URL oluştur
        if (type === 'tv') {
          return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}`;
        }
        return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      
      case 'moviesapi':
        // MoviesAPI için URL oluştur
        if (type === 'tv') {
          return `${service}/tv/${id}/${selectedSeason}/${selectedEpisode}`;
        }
        return `${service}/movie/${id}`;
      
      default:
        return service;
    }
  };

  // VIP player kontrolü (SuperEmbed için)
  const checkVipAvailability = async (service) => {
    const serviceConfig = PLAYER_SERVICES.find(s => s.url === service);
    if (serviceConfig?.type === 'superembed') {
      try {
        const checkUrl = type === 'tv' 
          ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}&check=1`
          : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&check=1`;
        
        const response = await fetch(checkUrl);
        const result = await response.text();
        return result === '1';
      } catch (error) {
        console.error('VIP availability check failed:', error);
        return false;
      }
    }
    return true;
  };

  const handleStreamChange = (serviceType) => {
    setSelectedStream(serviceType);
    setError(null);
    
    // currentPlayer'ı güncelle
    const selectedService = PLAYER_SERVICES.find(service => service.type === serviceType);
    if (selectedService) {
      setCurrentPlayer(selectedService.name);
    }
    console.log('Stream changed to:', serviceType);
  };

  const tryNextSource = () => {
    if (streamingSources.length > 0) {
      const nextIndex = (currentSourceIndex + 1) % streamingSources.length;
      const nextSource = streamingSources[nextIndex];
      
      console.log(`Sonraki kaynak deneniyor: ${nextSource.name} (${nextIndex + 1}/${streamingSources.length})`);
      setCurrentSourceIndex(nextIndex);
      setSelectedStream(nextSource.type);
      setError(null);
      
      // Eğer tüm kaynaklar denendiyse hata mesajı göster
      if (nextIndex === 0 && currentSourceIndex > 0) {
        setError('Tüm streaming kaynakları denendi. Lütfen daha sonra tekrar deneyin.');
      }
    }
  };

  // SRT'yi VTT'ye dönüştür
  const convertSrtToVtt = (srtContent) => {
    let vttContent = 'WEBVTT\n\n';
    
    // SRT formatını VTT formatına dönüştür
    const lines = srtContent.split('\n');
    let currentSubtitle = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Zaman damgası satırını kontrol et (00:00:00,000 --> 00:00:00,000)
      if (line.includes('-->')) {
        // Virgülleri nokta ile değiştir (SRT'den VTT'ye)
        const vttTimeline = line.replace(/,/g, '.');
        vttContent += vttTimeline + '\n';
      }
      // Boş satır veya sayı satırı değilse, alt yazı metni
      else if (line && !line.match(/^\d+$/)) {
        vttContent += line + '\n';
      }
      // Boş satır alt yazı bloğunu sonlandırır
      else if (!line && currentSubtitle) {
        vttContent += '\n';
        currentSubtitle = '';
      }
    }
    
    return vttContent;
  };

  // OpenSubtitles API entegrasyonu
  const searchSubtitles = async () => {
    setLoadingSubtitles(true);
    try {
      // TMDB ID'sini kullanarak OpenSubtitles'dan altyazı ara
      const query = type === 'tv' 
        ? `${content?.name || content?.title} S${selectedSeason.toString().padStart(2, '0')}E${selectedEpisode.toString().padStart(2, '0')}`
        : content?.title || content?.name;
      
      // OpenSubtitles API proxy endpoint'i (CORS sorunu için backend üzerinden)
      const response = await fetch(`http://localhost:5000/api/subtitles/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          tmdb_id: id,
          type: type,
          season: type === 'tv' ? selectedSeason : undefined,
          episode: type === 'tv' ? selectedEpisode : undefined
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSubtitles(data.subtitles || []);
      } else {
        console.error('Altyazı arama başarısız:', response.statusText);
        setAvailableSubtitles([]);
      }
    } catch (error) {
      console.error('Altyazı arama hatası:', error);
      setAvailableSubtitles([]);
    } finally {
      setLoadingSubtitles(false);
    }
  };

  // Altyazıyı Videasy player'a gönder
  const loadSubtitleToPlayer = async (subtitleUrl, language) => {
    try {
      // Altyazı dosyasını indir
      const response = await fetch(`http://localhost:5000/api/subtitles/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: subtitleUrl })
      });
      
      if (response.ok) {
        const subtitleContent = await response.text();
        
        // Videasy player'a postMessage ile altyazı gönder
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'loadSubtitle',
            subtitle: {
              content: subtitleContent,
              language: language,
              label: language.toUpperCase()
            }
          }, '*');
        }
        
        setSelectedSubtitle({ url: subtitleUrl, language });
      }
    } catch (error) {
      console.error('Altyazı yükleme hatası:', error);
    }
  };

  // Alt yazı yönetim fonksiyonları
  const handleSubtitleUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.vtt') || file.name.endsWith('.srt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        
        // SRT dosyasını VTT'ye dönüştür
        if (file.name.endsWith('.srt')) {
          content = convertSrtToVtt(content);
        }
        
        // VTT içeriğinden blob oluştur
        const blob = new Blob([content], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        
        const newSubtitle = {
          id: Date.now(),
          name: file.name.replace(/\.(vtt|srt)$/, ''),
          language: 'tr', // Türkçe olarak varsayılan
          url: url,
          content: content
        };
        setSubtitles(prev => [...prev, newSubtitle]);
        setSelectedSubtitle(newSubtitle);
        setShowSubtitleUpload(false);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const loadDefaultSubtitles = () => {
    // Varsayılan Türkçe alt yazı
    const defaultSubtitles = [
      {
        id: 'turkish-default',
        name: 'Türkçe (Otomatik)',
        language: 'tr',
        url: null,
        isDefault: true
      }
    ];
    setSubtitles(defaultSubtitles);
    setSelectedSubtitle(defaultSubtitles[0]);
  };

  const selectSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle);
  };

  const removeSubtitle = (subtitleId) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== subtitleId));
    if (selectedSubtitle && selectedSubtitle.id === subtitleId) {
      setSelectedSubtitle(null);
    }
  };

  // Sayfa yüklendiğinde varsayılan alt yazıları yükle
  useEffect(() => {
    loadDefaultSubtitles();
  }, []);

  // Video yükleme durumunu kontrol et
  // Otomatik kaynak değiştirme devre dışı bırakıldı
  // useEffect(() => {
  //   if (selectedStream) {
  //     const timer = setTimeout(() => {
  //       // 10 saniye sonra hala video yüklenmediyse sonraki kaynağa geç
  //       if (!error && selectedStream) {
  //         console.log('Video yükleme zaman aşımı, sonraki kaynağa geçiliyor...');
  //         tryNextSource();
  //       }
  //     }, 10000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [selectedStream, currentSourceIndex]);

  const getContentTitle = () => {
    if (!content) return '';
    return content.title || content.name || 'Bilinmeyen İçerik';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="error-page">
        <h2>İçerik bulunamadı</h2>
        <p>{error || 'İçerik yüklenemedi'}</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={20} />
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* Header */}
      <div className="player-header">
        <div className="container">
          <div className="player-header-content">
            <Link to={`/${type}/${id}`} className="back-btn">
              <ArrowLeft size={24} />
              Geri Dön
            </Link>
            <h1 className="content-title">{getContentTitle()}</h1>
            <div className="header-buttons">
              <button 
                className="watch-party-btn"
                onClick={() => setShowWatchParty(true)}
              >
                <Users size={20} />
                Birlikte İzle
              </button>
              <button 
                className="streaming-btn"
                onClick={fetchStreamingData}
              >
                <ExternalLink size={20} />
                Streaming Linkleri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Player Container */}
      <div className="player-container">
        <div className="container">
          <div className="player-content">
            {/* Video Player */}
            <div className="video-player">
              {selectedStream ? (
                <div className="video-container">
                  <iframe
                    src={getPlayerUrlByType(selectedStream)}
                    title={getContentTitle()}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 1
                    }}
                    loading="eager"
                  />
                </div>
              ) : (
                <div className="player-placeholder">
                  <Play size={64} />
                  <p>Player yükleniyor...</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="player-error">
                <h3>Video Yüklenemedi</h3>
                <p>{error}</p>
                <div className="error-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={tryNextSource}
                  >
                    Sonraki Kaynak Dene
                  </button>
                  <Link to={`/${type}/${id}`} className="btn btn-secondary">
                    Detay Sayfasına Dön
                  </Link>
                </div>
              </div>
            )}

            {/* Sezon ve Bölüm Seçimi (Sadece TV için) */}
            {type === 'tv' && seasons.length > 0 && (
              <div className="season-episode-selector">
                <h3>Sezon ve Bölüm Seçin</h3>
                <div className="selector-controls">
                  <div className="season-selector">
                    <label>Sezon:</label>
                    <select 
                      value={selectedSeason} 
                      onChange={(e) => {
                        setSelectedSeason(parseInt(e.target.value));
                        setSelectedEpisode(1);
                      }}
                    >
                      {seasons.map((season) => (
                        <option key={season.season_number} value={season.season_number}>
                          Sezon {season.season_number} ({season.episode_count} Bölüm)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="episode-selector">
                    <label>Bölüm:</label>
                    <select 
                      value={selectedEpisode} 
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                    >
                      {seasons.find(s => s.season_number === selectedSeason)?.episodes.map((episode) => (
                        <option key={episode.episode_number} value={episode.episode_number}>
                          Bölüm {episode.episode_number}: {episode.name}
                        </option>
                      )) || []}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming Options */}
            <div className="streaming-options">
              <h3>Streaming Kaynakları</h3>
              <div className="stream-sources">
                {streamingSources.map((source, index) => (
                  <button
                    key={source.type}
                    className={`stream-source ${selectedStream === source.type ? 'active' : ''} ${index === currentSourceIndex ? 'current' : ''}`}
                    onClick={() => handleStreamChange(source.type)}
                  >
                    <span className="source-name">{source.name}</span>
                    {index === currentSourceIndex && <span className="current-indicator">●</span>}
                    {source.type === 'vidfast' && <span className="recommended">(Hızlı Yükleme)</span>}
                    {source.type === 'vidjoy' && <span className="recommended">(HD Kalite)</span>}
                    {source.type === '111movies' && <span className="recommended">(Çoklu Kaynak)</span>}
                    {source.type === 'vidrock' && <span className="recommended">(Stabil)</span>}
                    {source.type === 'vidsrc' && <span className="recommended">(Premium)</span>}
                    {source.type === 'vidlink' && <span className="recommended">(Hızlı)</span>}
                    {source.type === 'mappletv' && <span className="recommended">(4K Destekli)</span>}
                    {source.type === 'vidora' && <span className="recommended">(Güvenli)</span>}
                    {source.type === 'vidzee' && <span className="recommended">(Yüksek Kalite)</span>}
                    {source.type === 'videasy' && <span className="recommended">(Otomatik Sonraki Bölüm + İlerleme Takibi)</span>}
                    {source.type === 'superembed' && <span className="recommended">(VIP Kalite)</span>}
                    {source.type === 'moviesapi' && <span className="recommended">(Hızlı)</span>}
                  </button>
                ))}
              </div>
              <div className="streaming-info">
                <p>Mevcut kaynak: <strong>{streamingSources[currentSourceIndex]?.name || 'Yükleniyor...'}</strong></p>
                <button className="btn btn-secondary" onClick={tryNextSource}>
                  Sonraki Kaynak Dene
                </button>
              </div>
            </div>

            {/* Content Info */}
            <div className="content-info">
              <div className="content-poster">
                <img 
                  src={`https://image.tmdb.org/t/p/w300${content.poster_path}`}
                  alt={getContentTitle()}
                />
              </div>
              <div className="content-details">
                <h2>{getContentTitle()}</h2>
                <p className="content-overview">{content.overview}</p>
                <div className="content-meta">
                  <span className="content-year">
                    {new Date(content.release_date || content.first_air_date).getFullYear()}
                  </span>
                  {content.vote_average && (
                    <span className="content-rating">
                      ⭐ {content.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Watch Progress Indicator */}
            {watchProgress && (
              <div className="watch-progress-info">
                <h3>İzleme İlerlemesi</h3>
                <div className="progress-details">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${watchProgress.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    <span>%{Math.round(watchProgress.progress || 0)} tamamlandı</span>
                    {watchProgress.timestamp && watchProgress.duration && (
                      <span>
                        {Math.floor(watchProgress.timestamp / 60)}:{String(Math.floor(watchProgress.timestamp % 60)).padStart(2, '0')} / 
                        {Math.floor(watchProgress.duration / 60)}:{String(Math.floor(watchProgress.duration % 60)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* External Streaming Links */}
            {streamingData && (
              <div className="external-streaming">
                <h3>Alternatif Streaming Linkleri</h3>
                <div className="external-links">
                  {streamingData.map((stream, index) => (
                    <a
                      key={index}
                      href={stream.domain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      <ExternalLink size={16} />
                      {new URL(stream.domain).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Subtitle Controls */}
            <div className="subtitle-controls">
              <h3>Alt Yazı Ayarları</h3>
              
              {/* OpenSubtitles Altyazı Arama */}
              <div className="opensubtitles-section">
                <div className="subtitle-search-header">
                  <h4>OpenSubtitles'dan Altyazı Ara</h4>
                  <button
                    className="btn btn-secondary"
                    onClick={searchSubtitles}
                    disabled={loadingSubtitles}
                  >
                    {loadingSubtitles ? 'Aranıyor...' : 'Altyazı Ara'}
                  </button>
                </div>
                
                {availableSubtitles.length > 0 && (
                  <div className="available-subtitles">
                    <label>Bulunan Altyazılar:</label>
                    <div className="subtitle-results">
                      {availableSubtitles.map((subtitle, index) => (
                        <div key={index} className="subtitle-result">
                          <div className="subtitle-info">
                            <span className="subtitle-lang">{subtitle.language?.toUpperCase() || 'TR'}</span>
                            <span className="subtitle-name">{subtitle.filename || 'Altyazı'}</span>
                            {subtitle.downloads && (
                              <span className="subtitle-downloads">({subtitle.downloads} indirme)</span>
                            )}
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => loadSubtitleToPlayer(subtitle.url, subtitle.language || 'tr')}
                          >
                            Yükle
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!loadingSubtitles && availableSubtitles.length === 0 && content && (
                  <div className="no-subtitles">
                    <p>Bu içerik için altyazı bulunamadı.</p>
                  </div>
                )}
              </div>
              
              <div className="subtitle-options">
                <div className="subtitle-list">
                  <label>Mevcut Alt Yazılar:</label>
                  <div className="subtitle-items">
                    <button
                      className={`subtitle-item ${!selectedSubtitle ? 'active' : ''}`}
                      onClick={() => setSelectedSubtitle(null)}
                    >
                      Alt yazı yok
                    </button>
                    {subtitles.map((subtitle) => (
                      <div key={subtitle.id} className="subtitle-item-wrapper">
                        <button
                          className={`subtitle-item ${selectedSubtitle?.id === subtitle.id ? 'active' : ''}`}
                          onClick={() => selectSubtitle(subtitle)}
                        >
                          {subtitle.name} ({subtitle.language.toUpperCase()})
                          {subtitle.isDefault && <span className="default-badge">Varsayılan</span>}
                        </button>
                        {!subtitle.isDefault && (
                          <button
                            className="remove-subtitle"
                            onClick={() => removeSubtitle(subtitle.id)}
                            title="Alt yazıyı kaldır"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="subtitle-upload">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowSubtitleUpload(!showSubtitleUpload)}
                  >
                    {showSubtitleUpload ? 'İptal' : 'Alt Yazı Yükle'}
                  </button>
                  
                  {showSubtitleUpload && (
                    <div className="upload-area">
                      <label className="upload-label">
                        <input
                          type="file"
                          accept=".vtt,.srt"
                          onChange={handleSubtitleUpload}
                          className="upload-input"
                        />
                        <span className="upload-text">
                          .vtt veya .srt dosyası seçin
                        </span>
                      </label>
                      <p className="upload-info">
                        Desteklenen formatlar: .vtt, .srt
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSubtitle && (
                <div className="selected-subtitle-info">
                  <p>
                    <strong>Seçili Alt Yazı:</strong> {selectedSubtitle.name}
                    {selectedSubtitle.isDefault && ' (Otomatik Türkçe)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Watch Party Modal */}
      {showWatchParty && (
        <WatchParty
          onClose={() => setShowWatchParty(false)}
          contentId={id}
          contentType={type}
          season={selectedSeason}
          episode={selectedEpisode}
          currentPlayer={currentPlayer}
          initialPartyId={searchParams.get('party')}
        />
      )}
    </div>
  );
};

export default Player;