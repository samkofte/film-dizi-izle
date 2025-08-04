import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Calendar } from 'lucide-react';
import './MovieCard.css';

const MovieCard = ({ item, type = 'movie' }) => {
  const {
    id,
    title,
    name,
    poster_path,
    backdrop_path,
    vote_average,
    release_date,
    first_air_date,
    overview,
    season,
    episode
  } = item;

  const displayTitle = title || name;
  const displayDate = release_date || first_air_date;
  const imagePath = poster_path || backdrop_path;
  const imageUrl = imagePath 
    ? `https://image.tmdb.org/t/p/w500${imagePath}`
    : '/placeholder-poster.jpg';

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih bilgisi yok';
    return new Date(dateString).getFullYear();
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="movie-card card">
      <div className="movie-card-image">
        <img 
          src={imageUrl} 
          alt={displayTitle}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/placeholder-poster.jpg';
          }}
        />
        <div className="movie-card-overlay">
          <Link 
            to={type === 'tv' && season && episode ? `/watch/${type}/${id}?season=${season}&episode=${episode}` : `/watch/${type}/${id}`} 
            className="play-button"
            title={type === 'tv' && season && episode ? `${displayTitle} S${season}E${episode} izle` : `${displayTitle} izle (embed.su)`}
          >
            <Play size={24} />
          </Link>
        </div>
        <div className="movie-card-rating">
          <Star size={14} fill="currentColor" />
          <span>{vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
      
      <div className="movie-card-content">
        <Link to={`/${type}/${id}`} className="movie-card-title">
          {displayTitle}
        </Link>
        
        <div className="movie-card-meta">
          <span className="movie-card-year">
            <Calendar size={14} />
            {formatDate(displayDate)}
          </span>
          {type === 'tv' && season && episode && (
            <span className="movie-card-episode">
              S{season}E{episode}
            </span>
          )}
        </div>
        
        {overview && (
          <p className="movie-card-overview">
            {truncateText(overview, 80)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;