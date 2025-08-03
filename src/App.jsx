import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVSeries from './pages/TVSeries';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import TVDetail from './pages/TVDetail';
import Player from './pages/Player';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVSeries />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/tv/:id" element={<TVDetail />} />
            <Route path="/watch/:type/:id" element={<Player />} />
            <Route path="/watch/:type/:id/:season/:episode" element={<Player />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 