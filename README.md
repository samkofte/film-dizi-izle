# VidSrc - Film ve Dizi İzleme Sitesi

Modern, responsive bir film ve dizi izleme web sitesi. TMDB API'si ile içerik bilgilerini ve VidSrc API'si ile streaming linklerini kullanır.

## 🚀 Özellikler

- **Modern UI/UX**: Koyu tema ile modern ve responsive tasarım
- **Film ve Dizi Kataloğu**: TMDB API entegrasyonu ile güncel içerik
- **Streaming Entegrasyonu**: VidSrc API ile çoklu streaming kaynağı
- **Arama Sistemi**: Gelişmiş film ve dizi arama
- **Kategori Filtreleme**: Tür bazında filtreleme
- **Responsive Tasarım**: Mobil ve desktop uyumlu
- **Detaylı Sayfalar**: Film/dizi detay sayfaları
- **Player Entegrasyonu**: Gömülü video player

## 🛠️ Teknolojiler

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool
- **Lucide React** - Icon library
- **CSS3** - Styling

### APIs
- **TMDB API** - Film ve dizi verileri
- **VidSrc API** - Streaming linkleri

## 📦 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd vidsrc-streaming-site
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. TMDB API Key Ayarlama
`server.js` dosyasında API key'i ayarlayın:

```javascript
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Buraya TMDB API key'inizi yazın
```

**TMDB API Key almak için:**
1. [TMDB](https://www.themoviedb.org/) sitesine gidin
2. Hesap oluşturun
3. Settings > API bölümünden API key alın
4. Aldığınız key'i `server.js` dosyasındaki `TMDB_API_KEY` değişkenine yazın

### 4. Geliştirme Sunucusunu Başlatın

**Backend (Terminal 1):**
```bash
npm start
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

### 5. Tarayıcıda Açın
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Proje Yapısı

```
vidsrc-streaming-site/
├── src/
│   ├── components/          # React bileşenleri
│   │   ├── Header.jsx      # Navigasyon header
│   │   ├── MovieCard.jsx   # Film/dizi kartı
│   │   └── ...
│   ├── pages/              # Sayfa bileşenleri
│   │   ├── Home.jsx        # Ana sayfa
│   │   ├── Movies.jsx      # Filmler sayfası
│   │   ├── TVSeries.jsx    # Diziler sayfası
│   │   ├── Search.jsx      # Arama sayfası
│   │   ├── MovieDetail.jsx # Film detay sayfası
│   │   ├── TVDetail.jsx    # Dizi detay sayfası
│   │   ├── Player.jsx      # Video player sayfası
│   │   └── ...
│   ├── App.jsx             # Ana uygulama bileşeni
│   └── main.jsx            # Uygulama giriş noktası
├── server.js               # Express backend server
├── package.json            # Proje bağımlılıkları
├── vite.config.js          # Vite konfigürasyonu
└── README.md               # Proje dokümantasyonu
```

## 🔧 API Endpoints

### TMDB API Endpoints
- `GET /api/trending/movies` - Trend filmler
- `GET /api/trending/tv` - Trend diziler
- `GET /api/movies/popular` - Popüler filmler
- `GET /api/tv/popular` - Popüler diziler
- `GET /api/search` - Film/dizi arama
- `GET /api/movie/:id` - Film detayları
- `GET /api/tv/:id` - Dizi detayları
- `GET /api/genres/movies` - Film türleri
- `GET /api/genres/tv` - Dizi türleri
- `GET /api/movies/genre/:genreId` - Tür bazında filmler
- `GET /api/tv/genre/:genreId` - Tür bazında diziler

### VidSrc API Endpoints
- `GET /api/stream/movie/:id` - Film streaming linkleri
- `GET /api/stream/tv/:id` - Dizi streaming linkleri

## 🎨 Özellikler Detayı

### Ana Sayfa
- Hero section ile öne çıkan içerik
- Trend filmler ve diziler
- Popüler içerikler
- Responsive grid layout

### Filmler/Diziler Sayfaları
- Grid ve liste görünümü
- Kategori filtreleme
- Sayfalama
- Arama entegrasyonu

### Detay Sayfaları
- Kapsamlı içerik bilgileri
- Streaming linkleri
- Yapım şirketleri
- Oyuncu bilgileri

### Player Sayfası
- Gömülü video player
- Çoklu streaming kaynağı
- Alternatif linkler
- Responsive tasarım

### Arama Sistemi
- Gerçek zamanlı arama
- Film ve dizi ayrımı
- Sonuç filtreleme
- Tab bazlı görünüm

## 📱 Responsive Tasarım

- **Desktop**: Tam özellikli deneyim
- **Tablet**: Optimize edilmiş layout
- **Mobile**: Touch-friendly arayüz

## 🚀 Production Build

```bash
# Frontend build
npm run build

# Production sunucusu başlat
npm start
```

## 🔒 Güvenlik

- CORS koruması
- API key güvenliği
- Input validation
- Error handling

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- [TMDB](https://www.themoviedb.org/) - Film ve dizi verileri için
- [VidSrc](https://vidsrc.me/) - Streaming API'si için
- [Lucide](https://lucide.dev/) - İkonlar için

## 📞 İletişim

Proje ile ilgili sorularınız için issue açabilirsiniz.

---

**Not**: Bu proje eğitim amaçlı geliştirilmiştir. Telif hakkı korumalı içeriklerin kullanımı için gerekli izinleri almanız gerekir. 