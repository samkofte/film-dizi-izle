import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Star, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamingData, setStreamingData] = useState(null);
  const [streamingLoading, setStreamingLoading] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/movie/${id}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamingData = async () => {
    setStreamingLoading(true);
    try {
      const response = await fetch(`/api/stream/movie/${id}`);
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

  const formatBudget = (budget) => {
    if (!budget || budget === 0) return 'Bilinmiyor';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="error-page">
        <h2>Film bulunamadı</h2>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={20} />
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="movie-detail-page fade-in">
      {/* Backdrop */}
      <div className="movie-backdrop">
        <img 
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
          alt={movie.title}
        />
        <div className="backdrop-overlay"></div>
      </div>

      <div className="container">
        <div className="movie-detail-content">
          {/* Poster and Basic Info */}
          <div className="movie-header">
            <div className="movie-poster">
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
              />
            </div>
            
            <div className="movie-info">
              <div className="movie-title-section">
                <h1 className="movie-title">{movie.title}</h1>
                <div className="movie-meta">
                  <span className="movie-year">
                    <Calendar size={16} />
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="movie-runtime">
                    <Clock size={16} />
                    {formatRuntime(movie.runtime)}
                  </span>
                  <span className="movie-rating">
                    <Star size={16} fill="currentColor" />
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="movie-actions">
                <Link to={`/watch/movie/${movie.id}`} className="btn btn-primary">
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

              <div className="movie-tags">
                {movie.genres?.map((genre) => (
                  <span key={genre.id} className="genre-tag">
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="movie-overview">{movie.overview}</p>
            </div>
          </div>

          {/* Cast Section */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <div className="cast-section">
              <h3>Oyuncular</h3>
              <div className="cast-grid">
                {movie.credits.cast.slice(0, 10).map((actor) => (
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
          {movie.credits?.crew && movie.credits.crew.length > 0 && (
            <div className="crew-section">
              <h3>Yönetmen & Ekip</h3>
              <div className="crew-grid">
                {movie.credits.crew
                  .filter(member => ['Director', 'Producer', 'Writer', 'Screenplay'].includes(member.job))
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

          {/* Similar Movies */}
          {movie.similar && movie.similar.length > 0 && (
            <div className="similar-section">
              <h3>Benzer Filmler</h3>
              <div className="similar-grid">
                {movie.similar.slice(0, 6).map((similarMovie) => (
                  <Link 
                    key={similarMovie.id} 
                    to={`/movie/${similarMovie.id}`}
                    className="similar-movie"
                  >
                    <div className="similar-poster">
                      <img 
                        src={similarMovie.poster_path 
                          ? `https://image.tmdb.org/t/p/w200${similarMovie.poster_path}`
                          : '/placeholder-poster.jpg'
                        }
                        alt={similarMovie.title}
                        onError={(e) => {
                          e.target.src = '/placeholder-poster.jpg';
                        }}
                      />
                    </div>
                    <div className="similar-info">
                      <h4>{similarMovie.title}</h4>
                      <p>{new Date(similarMovie.release_date).getFullYear()}</p>
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
          <div className="movie-details">
            <div className="details-grid">
              <div className="detail-item">
                <h4>Yayın Tarihi</h4>
                <p>{formatDate(movie.release_date)}</p>
              </div>
              
              <div className="detail-item">
                <h4>Bütçe</h4>
                <p>{formatBudget(movie.budget)}</p>
              </div>
              
              <div className="detail-item">
                <h4>Hasılat</h4>
                <p>{formatBudget(movie.revenue)}</p>
              </div>
              
              <div className="detail-item">
                <h4>Orijinal Dil</h4>
                <p>{movie.original_language?.toUpperCase()}</p>
              </div>
              
              <div className="detail-item">
                <h4>Durum</h4>
                <p>{movie.status}</p>
              </div>
              
              <div className="detail-item">
                <h4>Oylama</h4>
                <p>{movie.vote_count} oy</p>
              </div>
            </div>
          </div>

          {/* Production Companies */}
          {movie.production_companies && movie.production_companies.length > 0 && (
            <div className="production-section">
              <h3>Yapım Şirketleri</h3>
              <div className="production-companies">
                {movie.production_companies.map((company) => (
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
        </div>
      </div>
    </div>
  );
};

export default MovieDetail; 