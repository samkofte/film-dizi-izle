import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, TrendingUp, Star, Calendar, Clock, Sparkles, Film, Tv } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import './Home.css';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredContent, setFeaturedContent] = useState(null);

  useEffect(() => {
    // Load recently watched from localStorage
    const loadRecentlyWatched = () => {
      try {
        const stored = localStorage.getItem('recentlyWatched');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecentlyWatched(parsed.slice(0, 10)); // Show max 10 items
        }
      } catch (error) {
        console.error('Error loading recently watched:', error);
      }
    };

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

    loadRecentlyWatched();
    fetchData();

    
    // Listen for storage changes to update recently watched
    const handleStorageChange = () => {
      loadRecentlyWatched();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
      {/* Modern Hero Section */}
      {featuredContent && (
        <section className="modern-hero">
          <div className="hero-background">
            <img 
              src={`https://image.tmdb.org/t/p/original${featuredContent.backdrop_path}`}
              alt={featuredContent.title}
            />
            <div className="hero-gradient"></div>
            <div className="hero-particles"></div>
          </div>
          
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Öne Çıkan İçerik</span>
              </div>
              <h1 className="hero-title">{featuredContent.title}</h1>
              <div className="hero-meta">
                <div className="meta-item">
                  <Star size={16} fill="#ffd700" color="#ffd700" />
                  <span>{featuredContent.vote_average?.toFixed(1)}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>{new Date(featuredContent.release_date).getFullYear()}</span>
                </div>
                <div className="meta-item quality">
                  <span>4K Ultra HD</span>
                </div>
              </div>
              <p className="hero-overview">
                {featuredContent.overview?.substring(0, 180)}...
              </p>
              <div className="hero-actions">
                <Link to={`/movie/${featuredContent.id}`} className="primary-btn">
                  <Play size={20} fill="white" />
                  <span>Şimdi İzle</span>
                </Link>
                <button className="secondary-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <span>Listeme Ekle</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recently Watched Section */}
      {recentlyWatched.length > 0 && (
        <section className="content-section recently-watched">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <Clock size={24} />
                Son İzlenenler
              </h2>
              <button 
                className="clear-history-btn"
                onClick={() => {
                  localStorage.removeItem('recentlyWatched');
                  setRecentlyWatched([]);
                }}
              >
                Geçmişi Temizle
              </button>
            </div>
            <div className="grid grid-5">
              {recentlyWatched.map((item, index) => (
                <MovieCard key={`${item.id}-${index}`} item={item} type={item.type || 'movie'} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Movies */}
      <section className="content-section trending-movies">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <div className="icon-wrapper trending">
                <TrendingUp size={24} />
              </div>
              Trend Filmler
            </h2>
            <Link to="/movies" className="section-link">
              <span>Tümünü Gör</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
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
      <section className="content-section trending-tv">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <div className="icon-wrapper trending">
                <Tv size={24} />
              </div>
              Trend Diziler
            </h2>
            <Link to="/tv" className="section-link">
              <span>Tümünü Gör</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
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
      <section className="content-section popular-movies">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <div className="icon-wrapper popular">
                <Film size={24} />
              </div>
              Popüler Filmler
            </h2>
            <Link to="/movies" className="section-link">
              <span>Tümünü Gör</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
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
      <section className="content-section popular-tv">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <div className="icon-wrapper popular">
                <Star size={24} />
              </div>
              Popüler Diziler
            </h2>
            <Link to="/tv" className="section-link">
              <span>Tümünü Gör</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
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