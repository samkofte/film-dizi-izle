# Agora Video Chat Entegrasyonu

Bu proje, Agora.io kullanarak gerçek zamanlı video chat özelliği içerir. Watch party özelliği ile birlikte kullanıcılar hem film/dizi izleyebilir hem de video chat yapabilir.

## Kurulum

### 1. Agora Hesabı Oluşturma

1. [Agora.io](https://www.agora.io) adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'a giriş yapın
4. "New Project" butonuna tıklayın
5. Proje adını girin ve "Testing Mode: App ID" seçin
6. App ID'nizi kopyalayın

### 2. Ortam Değişkenlerini Ayarlama

1. `.env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   cp .env.example .env
   ```

2. `.env` dosyasını açın ve Agora App ID'nizi ekleyin:
   ```
   VITE_AGORA_APP_ID=your_actual_agora_app_id_here
   ```

### 3. Bağımlılıkları Yükleme

Agora SDK'ları zaten yüklenmiş durumda:
```bash
npm install agora-rtc-react agora-rtc-sdk-ng
```

## Kullanım

### Video Chat Başlatma

1. Bir watch party oluşturun veya mevcut bir party'ye katılın
2. Party açıldıktan sonra "Video Chat" butonuna tıklayın
3. "Video Chat'e Katıl" butonuna tıklayın
4. Kamera ve mikrofon izinlerini verin

### Video Chat Kontrolleri

- **Mikrofon**: Ses açma/kapama
- **Kamera**: Video açma/kapama  
- **Ayrıl**: Video chat'ten çıkma

### Özellikler

- ✅ Gerçek zamanlı video ve ses iletişimi
- ✅ Çoklu kullanıcı desteği (maksimum 4 kişi)
- ✅ Kamera ve mikrofon kontrolü
- ✅ Otomatik ses oynatma
- ✅ Responsive tasarım
- ✅ Watch party ile senkronize çalışma

## Güvenlik

### Production Ortamı İçin

**Önemli**: Bu entegrasyon şu anda test modunda çalışıyor. Production ortamında mutlaka token tabanlı kimlik doğrulama kullanın.

1. Agora Console'da projenizi "Secured Mode: App ID + Token" olarak değiştirin
2. Token server oluşturun
3. VideoChat bileşeninde token parametresini güncelleyin

### Token Server Örneği

```javascript
// server/agoraToken.js
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const generateToken = (channelName, uid) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 saat
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  return RtcTokenBuilder.buildTokenWithUid(
    appId, appCertificate, channelName, uid, role, privilegeExpiredTs
  );
};
```

## Sorun Giderme

### Yaygın Sorunlar

1. **Video görünmüyor**
   - Tarayıcı izinlerini kontrol edin
   - HTTPS bağlantısı kullandığınızdan emin olun
   - Agora App ID'nin doğru olduğunu kontrol edin

2. **Ses gelmiyor**
   - Mikrofon izinlerini kontrol edin
   - Ses seviyesini kontrol edin
   - Diğer uygulamaların mikrofonu kullanmadığından emin olun

3. **Bağlantı kurulamıyor**
   - İnternet bağlantınızı kontrol edin
   - Firewall ayarlarını kontrol edin
   - Agora App ID'nin aktif olduğunu kontrol edin

### Tarayıcı Desteği

- ✅ Chrome 58+
- ✅ Firefox 56+
- ✅ Safari 11+
- ✅ Edge 79+

## API Referansı

### VideoChat Bileşeni

```jsx
<VideoChat 
  partyId={string}        // Watch party ID'si
  displayName={string}    // Kullanıcı adı
  onClose={function}      // Kapatma callback'i
/>
```

### Props

- `partyId`: Video chat kanalı için kullanılan benzersiz ID
- `displayName`: Video chat'te görünecek kullanıcı adı
- `onClose`: Video chat kapatıldığında çağrılan fonksiyon

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Agora.io'nun kendi kullanım koşulları geçerlidir.