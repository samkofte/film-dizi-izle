import React, { useState, useEffect } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import './TVSeries.css';

const TVSeries = () => {
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchTVShows();
  }, [page, selectedGenre]);

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres/tv');
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchTVShows = async () => {
    setLoading(true);
    try {
      const url = selectedGenre 
        ? `/api/tv/genre/${selectedGenre}?page=${page}`
        : `/api/tv/popular?page=${page}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setTVShows(data.results || []);
      setTotalPages(data.total_pages || 0);
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading && tvShows.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tv-series-page fade-in">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Diziler</h1>
          <div className="page-controls">
            <button 
              className="filter-btn"
              onClick={toggleFilters}
            >
              <Filter size={20} />
              Filtreler
            </button>
            <div className="view-mode">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-section">
            <div className="genre-filters">
              <h3>Kategoriler</h3>
              <div className="genre-buttons">
                <button 
                  className={`genre-btn ${selectedGenre === '' ? 'active' : ''}`}
                  onClick={() => handleGenreChange('')}
                >
                  Tümü
                </button>
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    className={`genre-btn ${selectedGenre === genre.id.toString() ? 'active' : ''}`}
                    onClick={() => handleGenreChange(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TV Shows Grid */}
        <div className={`tv-shows-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
          {tvShows.map((tvShow) => (
            <MovieCard key={tvShow.id} item={tvShow} type="tv" />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Önceki
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${pageNum === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Sonraki
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-more">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVSeries; 