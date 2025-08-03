import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Play, Filter } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showPlatformFilter, setShowPlatformFilter] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const platforms = [
    { id: 'all', name: 'Tümü', color: '#667eea' },
    { id: 'netflix', name: 'Netflix', color: '#e50914' },
    { id: 'disney', name: 'Disney+', color: '#113ccf' },
    { id: 'prime', name: 'Prime Video', color: '#00a8e1' },
    { id: 'hbo', name: 'HBO Max', color: '#8b5cf6' },
    { id: 'apple', name: 'Apple TV+', color: '#000000' }
  ];

  // Anlık arama fonksiyonu
  const performInstantSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`/api/search/movies?q=${encodeURIComponent(query)}&page=1`),
        fetch(`/api/search/tv?q=${encodeURIComponent(query)}&page=1`)
      ]);

      const moviesData = await moviesResponse.json();
      const tvData = await tvResponse.json();

      const combinedResults = [
        ...(moviesData.results || []).slice(0, 3).map(item => ({ ...item, type: 'movie' })),
        ...(tvData.results || []).slice(0, 3).map(item => ({ ...item, type: 'tv' }))
      ];

      setSearchResults(combinedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Arama input değişikliği
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    performInstantSearch(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  const handleResultClick = (result) => {
    navigate(`/${result.type}/${result.id}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Dışarı tıklama ile sonuçları gizle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <Play size={32} />
            <span>VidSrc</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link to="/" className="nav-link">Ana Sayfa</Link>
            <Link to="/movies" className="nav-link">Filmler</Link>
            <Link to="/tv" className="nav-link">Diziler</Link>
          </nav>

          {/* Platform Filter */}
          <div className="platform-filter">
            <button 
              className="platform-btn"
              onClick={() => setShowPlatformFilter(!showPlatformFilter)}
            >
              <Filter size={18} />
              <span>{platforms.find(p => p.id === selectedPlatform)?.name}</span>
            </button>
            {showPlatformFilter && (
              <div className="platform-dropdown">
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    className={`platform-option ${selectedPlatform === platform.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      setShowPlatformFilter(false);
                    }}
                    style={{ '--platform-color': platform.color }}
                  >
                    <span className="platform-indicator"></span>
                    {platform.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="search-container" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Film veya dizi ara..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                />
              </div>
            </form>
            
            {/* Instant Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="search-result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <img
                      src={result.poster_path 
                        ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                        : '/placeholder-poster.jpg'
                      }
                      alt={result.title || result.name}
                      className="result-poster"
                    />
                    <div className="result-info">
                      <h4>{result.title || result.name}</h4>
                      <span className="result-type">
                        {result.type === 'movie' ? 'Film' : 'Dizi'}
                      </span>
                      <span className="result-year">
                        {new Date(result.release_date || result.first_air_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="search-result-more">
                  <button onClick={handleSearch} className="see-all-btn">
                    Tüm sonuçları gör
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="nav-mobile">
            <Link to="/" className="nav-link" onClick={toggleMobileMenu}>
              Ana Sayfa
            </Link>
            <Link to="/movies" className="nav-link" onClick={toggleMobileMenu}>
              Filmler
            </Link>
            <Link to="/tv" className="nav-link" onClick={toggleMobileMenu}>
              Diziler
            </Link>
            <form onSubmit={handleSearch} className="mobile-search-form">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Film veya dizi ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;