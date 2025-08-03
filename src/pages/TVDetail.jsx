import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Star, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import './TVDetail.css';

const TVDetail = () => {
  const { id } = useParams();
  const [tvShow, setTVShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamingData, setStreamingData] = useState(null);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  useEffect(() => {
    fetchTVDetails();
    fetchSeasons();
  }, [id]);

  const fetchTVDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tv/${id}`);
      const data = await response.json();
      setTVShow(data);
    } catch (error) {
      console.error('Error fetching TV show details:', error);
    } finally {
      setLoading(false);
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

  const fetchStreamingData = async () => {
    setStreamingLoading(true);
    try {
      const response = await fetch(`/api/stream/tv/${id}/${selectedSeason}/${selectedEpisode}`);
      const data = await response.json();
      setStreamingData(data.streamingData);
    } catch (error) {
      console.error('Error fetching streaming data:', error);
    } finally {
      setStreamingLoading(false);
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'Bilinmiyor';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="error-page">
        <h2>Dizi bulunamadı</h2>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={20} />
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="tv-detail-page fade-in">
      {/* Backdrop */}
      <div className="tv-backdrop">
        <img 
          src={`https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`}
          alt={tvShow.name}
        />
        <div className="backdrop-overlay"></div>
      </div>

      <div className="container">
        <div className="tv-detail-content">
          {/* Poster and Basic Info */}
          <div className="tv-header">
            <div className="tv-poster">
              <img 
                src={`https://image.tmdb.org/t/p/w500${tvShow.poster_path}`}
                alt={tvShow.name}
              />
            </div>
            
            <div className="tv-info">
              <div className="tv-title-section">
                <h1 className="tv-title">{tvShow.name}</h1>
                <div className="tv-meta">
                  <span className="tv-year">
                    <Calendar size={16} />
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </span>
                  <span className="tv-runtime">
                    <Clock size={16} />
                    {formatRuntime(tvShow.episode_run_time?.[0])}
                  </span>
                  <span className="tv-rating">
                    <Star size={16} fill="currentColor" />
                    {tvShow.vote_average?.toFixed(1)}
                  </span>
                  <span className="tv-seasons">
                    <Users size={16} />
                    {tvShow.number_of_seasons} Sezon
                  </span>
                </div>
              </div>

              <div className="tv-actions">
                <Link to={`/watch/tv/${tvShow.id}/${selectedSeason}/${selectedEpisode}`} className="btn btn-primary">
                  <Play size={20} />
                  İzle (embed.su)
                </Link>
                <button 
                  className="btn btn-secondary"
                  onClick={fetchStreamingData}
                  disabled={streamingLoading}
                >
                  {streamingLoading ? 'Yükleniyor...' : 'Streaming Linkleri'}
                </button>
              </div>

              {/* Sezon ve Bölüm Seçimi */}
              {seasons.length > 0 && (
                <div className="season-episode-selector">
                  <h4>Sezon ve Bölüm Seçin</h4>
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

              <div className="tv-tags">
                {tvShow.genres?.map((genre) => (
                  <span key={genre.id} className="genre-tag">
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="tv-overview">{tvShow.overview}</p>
            </div>
          </div>

          {/* Cast Section */}
          {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
            <div className="cast-section">
              <h3>Oyuncular</h3>
              <div className="cast-grid">
                {tvShow.credits.cast.slice(0, 10).map((actor) => (
                  <div key={actor.id} className="cast-member">
                    <div className="cast-photo">
                      <img 
                        src={actor.profile_path 
                          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                          : '/placeholder-actor.jpg'
                        }
                        alt={actor.name}
                        onError={(e) => {
                          e.target.src = '/placeholder-actor.jpg';
                        }}
                      />
                    </div>
                    <div className="cast-info">
                      <h4>{actor.name}</h4>
                      <p>{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crew Section */}
          {tvShow.credits?.crew && tvShow.credits.crew.length > 0 && (
            <div className="crew-section">
              <h3>Yönetmen & Ekip</h3>
              <div className="crew-grid">
                {tvShow.credits.crew
                  .filter(member => ['Director', 'Producer', 'Writer', 'Screenplay', 'Creator'].includes(member.job))
                  .slice(0, 8)
                  .map((member) => (
                    <div key={member.id} className="crew-member">
                      <div className="crew-photo">
                        <img 
                          src={member.profile_path 
                            ? `https://image.tmdb.org/t/p/w200${member.profile_path}`
                            : '/placeholder-actor.jpg'
                          }
                          alt={member.name}
                          onError={(e) => {
                            e.target.src = '/placeholder-actor.jpg';
                          }}
                        />
                      </div>
                      <div className="crew-info">
                        <h4>{member.name}</h4>
                        <p>{member.job}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Similar TV Shows */}
          {tvShow.similar && tvShow.similar.length > 0 && (
            <div className="similar-section">
              <h3>Benzer Diziler</h3>
              <div className="similar-grid">
                {tvShow.similar.slice(0, 6).map((similarShow) => (
                  <Link 
                    key={similarShow.id} 
                    to={`/tv/${similarShow.id}`}
                    className="similar-show"
                  >
                    <div className="similar-poster">
                      <img 
                        src={similarShow.poster_path 
                          ? `https://image.tmdb.org/t/p/w200${similarShow.poster_path}`
                          : '/placeholder-poster.jpg'
                        }
                        alt={similarShow.name}
                        onError={(e) => {
                          e.target.src = '/placeholder-poster.jpg';
                        }}
                      />
                    </div>
                    <div className="similar-info">
                      <h4>{similarShow.name}</h4>
                      <p>{new Date(similarShow.first_air_date).getFullYear()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Streaming Data */}
          {streamingData && (
            <div className="streaming-section">
              <h3>Streaming Linkleri</h3>
              <div className="streaming-links">
                {streamingData.map((stream, index) => (
                  <div key={index} className="streaming-link">
                    <h4>{new URL(stream.domain).hostname}</h4>
                    <a 
                      href={stream.domain} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      İzle
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="tv-details">
            <div className="details-grid">
              <div className="detail-item">
                <h4>İlk Yayın Tarihi</h4>
                <p>{formatDate(tvShow.first_air_date)}</p>
              </div>
              
              <div className="detail-item">
                <h4>Son Yayın Tarihi</h4>
                <p>{formatDate(tvShow.last_air_date)}</p>
              </div>
              
              <div className="detail-item">
                <h4>Sezon Sayısı</h4>
                <p>{tvShow.number_of_seasons}</p>
              </div>
              
              <div className="detail-item">
                <h4>Bölüm Sayısı</h4>
                <p>{tvShow.number_of_episodes}</p>
              </div>
              
              <div className="detail-item">
                <h4>Orijinal Dil</h4>
                <p>{tvShow.original_language?.toUpperCase()}</p>
              </div>
              
              <div className="detail-item">
                <h4>Durum</h4>
                <p>{tvShow.status}</p>
              </div>
              
              <div className="detail-item">
                <h4>Oylama</h4>
                <p>{tvShow.vote_count} oy</p>
              </div>
              
              <div className="detail-item">
                <h4>Tür</h4>
                <p>{tvShow.type}</p>
              </div>
            </div>
          </div>

          {/* Production Companies */}
          {tvShow.production_companies && tvShow.production_companies.length > 0 && (
            <div className="production-section">
              <h3>Yapım Şirketleri</h3>
              <div className="production-companies">
                {tvShow.production_companies.map((company) => (
                  <div key={company.id} className="production-company">
                    {company.logo_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                      />
                    ) : (
                      <span className="company-name">{company.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Networks */}
          {tvShow.networks && tvShow.networks.length > 0 && (
            <div className="networks-section">
              <h3>Yayın Ağları</h3>
              <div className="networks">
                {tvShow.networks.map((network) => (
                  <div key={network.id} className="network">
                    {network.logo_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${network.logo_path}`}
                        alt={network.name}
                      />
                    ) : (
                      <span className="network-name">{network.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVDetail; 