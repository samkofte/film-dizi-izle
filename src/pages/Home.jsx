import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, TrendingUp, Star, Calendar } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import './Home.css';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredContent, setFeaturedContent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          moviesResponse,
          tvResponse,
          popularMoviesResponse,
          popularTVResponse
        ] = await Promise.all([
          fetch('/api/trending/movies'),
          fetch('/api/trending/tv'),
          fetch('/api/movies/popular'),
          fetch('/api/tv/popular')
        ]);

        const moviesData = await moviesResponse.json();
        const tvData = await tvResponse.json();
        const popularMoviesData = await popularMoviesResponse.json();
        const popularTVData = await popularTVResponse.json();

        setTrendingMovies(moviesData.results || []);
        setTrendingTV(tvData.results || []);
        setPopularMovies(popularMoviesData.results || []);
        setPopularTV(popularTVData.results || []);

        // Set featured content (first trending movie)
        if (moviesData.results && moviesData.results.length > 0) {
          setFeaturedContent(moviesData.results[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home fade-in">
      {/* Netflix-style Hero Section */}
      {featuredContent && (
        <section className="netflix-hero">
          <div className="hero-background">
            <img 
              src={`https://image.tmdb.org/t/p/original${featuredContent.backdrop_path}`}
              alt={featuredContent.title}
            />
            <div className="hero-gradient"></div>
          </div>
          
          <div className="container">
            <div className="hero-content">
              <div className="netflix-logo-badge">VidSrc Original</div>
              <h1 className="netflix-hero-title">{featuredContent.title}</h1>
              <div className="hero-meta">
                <span className="match-score">98% Eşleşme</span>
                <span className="hero-year">
                  {new Date(featuredContent.release_date).getFullYear()}
                </span>
                <span className="age-rating">13+</span>
                <span className="duration">2s 14dk</span>
                <span className="quality-badge">HD</span>
              </div>
              <p className="netflix-hero-overview">
                {featuredContent.overview?.substring(0, 150)}...
              </p>
              <div className="netflix-hero-actions">
                <Link to={`/movie/${featuredContent.id}`} className="netflix-play-btn">
                  <Play size={24} fill="black" />
                  Oynat
                </Link>
                <button className="netflix-info-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Daha Fazla Bilgi
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Movies */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={24} />
              Trend Filmler
            </h2>
            <Link to="/movies" className="section-link">
              Tümünü Gör
            </Link>
          </div>
          <div className="grid grid-5">
            {trendingMovies.slice(0, 10).map((movie) => (
              <MovieCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>
        </div>
      </section>

      {/* Trending TV Series */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={24} />
              Trend Diziler
            </h2>
            <Link to="/tv" className="section-link">
              Tümünü Gör
            </Link>
          </div>
          <div className="grid grid-5">
            {trendingTV.slice(0, 10).map((tv) => (
              <MovieCard key={tv.id} item={tv} type="tv" />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Movies */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <Star size={24} />
              Popüler Filmler
            </h2>
            <Link to="/movies" className="section-link">
              Tümünü Gör
            </Link>
          </div>
          <div className="grid grid-5">
            {popularMovies.slice(0, 10).map((movie) => (
              <MovieCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>
        </div>
      </section>

      {/* Popular TV Series */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <Star size={24} />
              Popüler Diziler
            </h2>
            <Link to="/tv" className="section-link">
              Tümünü Gör
            </Link>
          </div>
          <div className="grid grid-5">
            {popularTV.slice(0, 10).map((tv) => (
              <MovieCard key={tv.id} item={tv} type="tv" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;