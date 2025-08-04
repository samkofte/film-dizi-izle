# 🎬 Film & Dizi İzle -  Streaming Platform

Modern ve kullanıcı dostu bir film ve dizi izleme platformu. TMDB API entegrasyonu ile güncel içerikler ve çoklu streaming servisleri desteği.

## ✨ Özellikler

- 🎭 **Geniş İçerik Kütüphanesi**: Filmler ve TV dizileri
- 🔍 **Gelişmiş Arama**: Başlık, tür ve yıla göre filtreleme
- 📱 **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- 🎨 **Modern UI/UX**: Temiz ve sezgisel arayüz
- 🌐 **Çoklu Dil Desteği**: Türkçe içerik ve arayüz
- ⚡ **Hızlı Yükleme**: Optimize edilmiş performans
- 🎯 **Kategori Filtreleme**: Türlere göre içerik keşfi
- 📄 **Sayfalama**: Kolay navigasyon

## 🚀 Teknolojiler

### Frontend
- **React 18** - Modern UI kütüphanesi
- **Vite** - Hızlı geliştirme ortamı
- **CSS3** - Responsive tasarım
- **Axios** - HTTP istekleri

### Backend
- **Node.js** - Server-side JavaScript
- **Express.js** - Web framework
- **TMDB API** - Film ve dizi verileri
- **Cheerio** - HTML parsing
- **CORS** - Cross-origin resource sharing

## 📦 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- TMDB API anahtarı

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/samkofte/film-dizi-izle.git
cd film-dizi-izle
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables'ları ayarlayın**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# TMDB Configuration
TMDB_API_KEY=your_tmdb_api_key_here

# Server Configuration
PORT=5000

# Agora Configuration (opsiyonel)
VITE_AGORA_APP_ID=your_agora_app_id_here
```

4. **Uygulamayı başlatın**
```bash
npm run dev
```

## 🌐 Render.com Deployment

### Otomatik Deployment

1. **GitHub'a push edin**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Render.com'da yeni servis oluşturun**
   - Repository'nizi bağlayın
   - `render.yaml` dosyası otomatik olarak algılanacak
   - Environment variables'ları ayarlayın:
     - `TMDB_API_KEY`: TMDB API anahtarınız
     - `NODE_ENV`: production
     - `PORT`: 10000 (Render otomatik ayarlar)

3. **Deploy edin**
   - Render otomatik olarak build ve deploy işlemini başlatacak
   - Build komutu: `npm run render-build`
   - Start komutu: `npm start`

### Manuel Deployment

```bash
# Production build oluşturun
npm run build

# Sunucuyu başlatın
npm start
```

### Environment Variables (Render)

Render dashboard'unda aşağıdaki environment variables'ları ayarlayın:

```env
TMDB_API_KEY=your_tmdb_api_key_here
NODE_ENV=production
PORT=10000
VITE_AGORA_APP_ID=your_agora_app_id_here
```

3. **Ortam değişkenlerini ayarlayın**
`.env` dosyası oluşturun:
```env
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_ACCESS_TOKEN=your_tmdb_access_token_here
PORT=5000
```

4. **Uygulamayı başlatın**
```bash
npm run dev
```

5. **Tarayıcıda açın**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔧 API Endpoints

### Filmler
- `GET /api/trending` - Trend filmler ve diziler
- `GET /api/movie/:id` - Film detayları
- `GET /api/movies/genre/:genreId` - Türe göre filmler
- `GET /api/search` - Arama

### TV Dizileri
- `GET /api/tv/:id` - Dizi detayları
- `GET /api/tv/:id/seasons` - Sezon bilgileri
- `GET /api/tv/genre/:genreId` - Türe göre diziler

### Streaming
- `GET /api/proxy/:type/:id` - Güvenli streaming proxy
- `GET /api/subtitles/:query` - Altyazı arama

## 📁 Proje Yapısı

```
film-dizi-izle/
├── src/
│   ├── components/          # React bileşenleri
│   │   ├── Header.jsx       # Ana navigasyon
│   │   └── MovieCard.jsx    # Film/dizi kartları
│   ├── pages/               # Sayfa bileşenleri
│   │   ├── Home.jsx         # Ana sayfa
│   │   ├── Movies.jsx       # Filmler sayfası
│   │   ├── TVSeries.jsx     # Diziler sayfası
│   │   ├── Search.jsx       # Arama sayfası
│   │   ├── MovieDetail.jsx  # Film detay sayfası
│   │   ├── TVDetail.jsx     # Dizi detay sayfası
│   │   └── Player.jsx       # Video oynatıcı
│   ├── App.jsx              # Ana uygulama bileşeni
│   └── main.jsx             # Giriş noktası
├── public/                  # Statik dosyalar
├── server.js                # Express server
├── package.json             # Proje bağımlılıkları
└── vite.config.js           # Vite konfigürasyonu
```

## 🎨 Özellik Detayları

### Ana Sayfa
- Trend filmler ve diziler
- Kategorilere göre öne çıkan içerikler
- Hızlı erişim menüsü

### Film/Dizi Sayfaları
- Tür bazlı filtreleme
- Sayfalama ile kolay gezinme
- Arama ve sıralama seçenekleri

### Detay Sayfaları
- Kapsamlı film/dizi bilgileri
- Oyuncu kadrosu ve ekip
- Fragmanlar ve görseller
- Benzer içerik önerileri

### Video Oynatıcı
- Çoklu streaming servisi desteği
- Güvenli proxy sistemi
- Altyazı desteği
- Responsive tasarım

## 🔒 Güvenlik

- HTML sanitization
- CORS koruması
- Güvenli proxy sistemi
- Zararlı script filtreleme

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- GitHub: [@samkofte](https://github.com/samkofte)
- Proje Linki: [https://github.com/samkofte/film-dizi-izle](https://github.com/samkofte/film-dizi-izle)

## 🙏 Teşekkürler

- [TMDB](https://www.themoviedb.org/) - Film ve dizi verileri için
- [React](https://reactjs.org/) - UI kütüphanesi için
- [Vite](https://vitejs.dev/) - Geliştirme ortamı için

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!