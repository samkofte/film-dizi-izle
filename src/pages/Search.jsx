import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    movies: { total_pages: 0, total_results: 0, page: 1 },
    tv: { total_pages: 0, total_results: 0, page: 1 }
  });

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setMovies([]);
      setTVShows([]);
      setHasSearched(false);
      setPagination({
        movies: { total_pages: 0, total_results: 0, page: 1 },
        tv: { total_pages: 0, total_results: 0, page: 1 }
      });
    }
  }, [query, currentPage]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&page=${currentPage}`);
      const data = await response.json();

      setMovies(data.movies?.results || []);
      setTVShows(data.tv?.results || []);
      setPagination({
        movies: {
          total_pages: data.movies?.total_pages || 0,
          total_results: data.movies?.total_results || 0,
          page: data.movies?.page || 1
        },
        tv: {
          total_pages: data.tv?.total_pages || 0,
          total_results: data.tv?.total_results || 0,
          page: data.tv?.page || 1
        }
      });
    } catch (error) {
      console.error('Error performing search:', error);
      setMovies([]);
      setTVShows([]);
      setPagination({
        movies: { total_pages: 0, total_results: 0, page: 1 },
        tv: { total_pages: 0, total_results: 0, page: 1 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentPagination = () => {
    if (activeTab === 'movies') return pagination.movies;
    if (activeTab === 'tv') return pagination.tv;
    
    // 'all' tab için en yüksek sayfa sayısını kullan
    return {
      total_pages: Math.max(pagination.movies.total_pages, pagination.tv.total_pages),
      total_results: pagination.movies.total_results + pagination.tv.total_results,
      page: currentPage
    };
  };

  const renderPagination = () => {
    const paginationData = getCurrentPagination();
    const { total_pages, page } = paginationData;
    
    if (total_pages <= 1) return null;

    const maxVisiblePages = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button 
          className="pagination-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={20} />
          Önceki
        </button>
        
        {startPage > 1 && (
          <>
            <button 
              className="pagination-number"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="pagination-dots">...</span>}
          </>
        )}
        
        {pages.map(pageNum => (
          <button
            key={pageNum}
            className={`pagination-number ${pageNum === page ? 'active' : ''}`}
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        
        {endPage < total_pages && (
          <>
            {endPage < total_pages - 1 && <span className="pagination-dots">...</span>}
            <button 
              className="pagination-number"
              onClick={() => handlePageChange(total_pages)}
            >
              {total_pages}
            </button>
          </>
        )}
        
        <button 
          className="pagination-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= total_pages}
        >
          Sonraki
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const getTotalResults = () => {
    return movies.length + tvShows.length;
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Aranıyor...</p>
        </div>
      );
    }

    if (!hasSearched) {
      return (
        <div className="search-placeholder">
          <SearchIcon size={64} />
          <h3>Arama yapmak için bir şeyler yazın</h3>
          <p>Film veya dizi adı ile arama yapabilirsiniz</p>
        </div>
      );
    }

    if (getTotalResults() === 0) {
      return (
        <div className="no-results">
          <SearchIcon size={64} />
          <h3>Sonuç bulunamadı</h3>
          <p>"{query}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.</p>
        </div>
      );
    }

    return (
      <div className="search-results">
        <div className="results-header">
          <h3>"{query}" için {getTotalResults()} sonuç bulundu</h3>
          <div className="results-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tümü ({getTotalResults()})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
              onClick={() => setActiveTab('movies')}
            >
              <Film size={16} />
              Filmler ({movies.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'tv' ? 'active' : ''}`}
              onClick={() => setActiveTab('tv')}
            >
              <Tv size={16} />
              Diziler ({tvShows.length})
            </button>
          </div>
        </div>

        <div className="results-content">
          {activeTab === 'all' && (
            <>
              {movies.length > 0 && (
                <div className="results-section">
                  <h4>Filmler ({pagination.movies.total_results} sonuç)</h4>
                  <div className="grid grid-5">
                    {movies.map((movie) => (
                      <MovieCard key={movie.id} item={movie} type="movie" />
                    ))}
                  </div>
                </div>
              )}
              
              {tvShows.length > 0 && (
                <div className="results-section">
                  <h4>Diziler ({pagination.tv.total_results} sonuç)</h4>
                  <div className="grid grid-5">
                    {tvShows.map((tvShow) => (
                      <MovieCard key={tvShow.id} item={tvShow} type="tv" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'movies' && movies.length > 0 && (
            <div className="grid grid-5">
              {movies.map((movie) => (
                <MovieCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          )}

          {activeTab === 'tv' && tvShows.length > 0 && (
            <div className="grid grid-5">
              {tvShows.map((tvShow) => (
                <MovieCard key={tvShow.id} item={tvShow} type="tv" />
              ))}
            </div>
          )}
        </div>
        
        {/* Sayfalama */}
        {hasSearched && getTotalResults() > 0 && renderPagination()}
      </div>
    );
  };

  return (
    <div className="search-page fade-in">
      <div className="container">
        <div className="search-header">
          <h1 className="search-title">
            <SearchIcon size={32} />
            Arama Sonuçları
          </h1>
          {query && (
            <p className="search-query">"{query}" için arama sonuçları</p>
          )}
        </div>

        {renderResults()}
      </div>
    </div>
  );
};

export default Search;