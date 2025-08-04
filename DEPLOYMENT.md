# 🚀 Render.com Deployment Rehberi

Bu rehber, Film & Dizi İzle uygulamasını Render.com'da nasıl deploy edeceğinizi adım adım açıklar.

## 📋 Ön Gereksinimler

- GitHub hesabı
- Render.com hesabı
- TMDB API anahtarı
- Agora App ID (opsiyonel, watch party özelliği için)

## 🔧 Hazırlık

### 1. Repository'yi GitHub'a Push Edin

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. TMDB API Anahtarı Alın

1. [TMDB](https://www.themoviedb.org/) hesabı oluşturun
2. API bölümünden API anahtarınızı alın
3. API anahtarını not edin

## 🌐 Render.com'da Deployment

### Adım 1: Yeni Web Service Oluşturun

1. [Render.com](https://render.com) hesabınıza giriş yapın
2. "New +" butonuna tıklayın
3. "Web Service" seçeneğini seçin
4. GitHub repository'nizi bağlayın

### Adım 2: Service Ayarlarını Yapın

**Temel Ayarlar:**
- **Name**: `vidsrc-streaming-site` (veya istediğiniz isim)
- **Environment**: `Node`
- **Region**: Size en yakın bölge
- **Branch**: `main`
- **Build Command**: `npm run render-build`
- **Start Command**: `npm start`

### Adım 3: Environment Variables Ekleyin

Aşağıdaki environment variables'ları ekleyin:

```env
TMDB_API_KEY=your_tmdb_api_key_here
NODE_ENV=production
PORT=10000
VITE_AGORA_APP_ID=your_agora_app_id_here
```

**Önemli:** `TMDB_API_KEY` mutlaka gereklidir!

### Adım 4: Deploy Edin

1. "Create Web Service" butonuna tıklayın
2. Render otomatik olarak build işlemini başlatacak
3. Build tamamlandığında uygulamanız canlıya alınacak

## 📊 Build Süreci

Render aşağıdaki adımları otomatik olarak gerçekleştirir:

1. **Dependencies**: `npm install`
2. **Frontend Build**: `npm run build`
3. **Server Start**: `npm start`

## 🔍 Troubleshooting

### Build Hatası

**Problem**: Build sırasında hata alıyorsanız

**Çözüm**:
1. Logs bölümünden hata mesajını kontrol edin
2. `package.json` dosyasındaki dependencies'leri kontrol edin
3. Environment variables'ların doğru ayarlandığından emin olun

### TMDB API Hatası

**Problem**: "API key is required" hatası

**Çözüm**:
1. Environment variables bölümünde `TMDB_API_KEY` değişkenini kontrol edin
2. API anahtarının geçerli olduğundan emin olun
3. TMDB hesabınızın aktif olduğunu doğrulayın

### Port Hatası

**Problem**: "Port already in use" hatası

**Çözüm**:
1. `PORT` environment variable'ını `10000` olarak ayarlayın
2. Render otomatik olarak port ataması yapacaktır

## 🎯 Production Optimizasyonları

Uygulama aşağıdaki optimizasyonlarla gelir:

- **Minification**: JavaScript ve CSS dosyaları sıkıştırılır
- **Code Splitting**: Vendor ve route bazlı chunk'lara ayrılır
- **Caching**: Static dosyalar için browser caching
- **Compression**: Gzip sıkıştırma
- **Security**: CORS ve güvenlik başlıkları

## 📈 Monitoring

### Render Dashboard

- **Metrics**: CPU, Memory, Network kullanımı
- **Logs**: Real-time application logs
- **Events**: Deployment ve restart geçmişi

### Health Check

Render otomatik olarak health check yapar:
- **Endpoint**: `/`
- **Interval**: 30 saniye
- **Timeout**: 10 saniye

## 🔄 Otomatik Deployment

GitHub'a her push yaptığınızda:

1. Render otomatik olarak yeni deployment başlatır
2. Build işlemi gerçekleşir
3. Başarılı olursa yeni versiyon canlıya alınır
4. Hata varsa önceki versiyon aktif kalır

## 💡 İpuçları

- **Free Plan**: Render free plan ile başlayabilirsiniz
- **Custom Domain**: Kendi domain'inizi bağlayabilirsiniz
- **SSL**: Otomatik SSL sertifikası sağlanır
- **CDN**: Global CDN ile hızlı erişim
- **Backup**: Otomatik backup ve rollback

## 📞 Destek

Sorun yaşarsanız:

1. [Render Documentation](https://render.com/docs)
2. [Render Community](https://community.render.com)
3. GitHub Issues bölümü

---

✅ **Deployment tamamlandı!** Uygulamanız artık canlıda ve kullanıma hazır.