# Frontend Testing Guide

## 🧪 UI Test Prosedürü

### Gereksinimler

1. **MetaMask Cüzdan**: Chrome/Firefox extension
2. **Test Network**: Sepolia veya local Hardhat node
3. **Test ETH**: Sepolia faucet'tan alınabilir

### Adım Adım Test

#### 1. Development Server Başlat

```bash
cd /workspaces/FHE-BANK/frontend
npm run dev
```

Server çalışacak: http://localhost:3000

#### 2. Tarayıcıda Aç

- Chrome/Firefox'ta http://localhost:3000 aç
- MetaMask extension kurulu olmalı

#### 3. Cüzdan Bağlantısı

**Test Senaryosu 1: İlk Bağlantı**
```
1. "Connect MetaMask" butonuna tıkla
2. MetaMask popup açılacak
3. Cüzdanı seç ve "Connect" tıkla
4. Başarılı: Adres görünmeli (0x1234...5678)
```

**Beklenen Sonuç:**
- ✅ Wallet adresi görüntüleniyor
- ✅ Status: "✅ Wallet connected!"
- ✅ Deposit ve Transfer formları aktif

#### 4. Encrypted Deposit Test

**Test Senaryosu 2: Para Yatırma**
```
1. "Amount to deposit" kutusuna "100" gir
2. "🔐 Encrypted Deposit" butonuna tıkla
3. İşlem simülasyonu 1.5 saniye sürer
```

**Beklenen Sonuç:**
- ✅ Status: "📝 Preparing encrypted deposit..."
- ✅ Sonra: "✅ Deposited 100 tokens (encrypted)!"
- ✅ Input temizlenir

#### 5. Encrypted Transfer Test

**Test Senaryosu 3: Transfer**
```
1. "Recipient address" kutusuna geçerli Ethereum adresi gir
   Örnek: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
2. "Amount to transfer" kutusuna "50" gir
3. "🔐 Encrypted Transfer" butonuna tıkla
```

**Beklenen Sonuç:**
- ✅ Adres validasyonu çalışıyor
- ✅ Geçersiz adres: "❌ Error: Invalid Ethereum address"
- ✅ Geçerli adres: "✅ Transferred 50 tokens to 0x7099...!"

#### 6. Dark Mode Test

**Test Senaryosu 4: Tema Değişimi**
```
1. İşletim sistemi ayarlarından dark mode aç/kapat
2. Sayfa otomatik tema değiştirecek
```

**Beklenen Sonuç:**
- ✅ Dark mode: Siyah arka plan, beyaz yazı
- ✅ Light mode: Mavi gradyan, siyah yazı

#### 7. Responsive Design Test

**Test Senaryosu 5: Mobil Görünüm**
```
1. F12 tuşuna bas (DevTools)
2. Device toolbar aç (Ctrl+Shift+M)
3. Farklı cihazları seç (iPhone, iPad, vs.)
```

**Beklenen Sonuç:**
- ✅ Mobil'de düzgün görünüyor
- ✅ Tablet'te düzgün görünüyor
- ✅ Desktop'ta düzgün görünüyor

### 🔍 İleri Seviye Test (Opsiyonel)

#### Smart Contract Entegrasyonu

**Şu anki durum:** Frontend mock (simülasyon) çalışıyor

**Gerçek contract ile test için:**

1. **Local Hardhat Node Başlat:**
```bash
cd /workspaces/FHE-BANK/fhevm-hardhat-template
npx hardhat node
```

2. **Contract Deploy Et:**
```bash
npx hardhat deploy --network localhost
```

3. **Frontend'i Contract'a Bağla:**
   - `frontend/app/page.tsx` dosyasında contract adresi güncelle
   - ethers.js ile gerçek işlem gönder

### 📊 Test Checklist

- [ ] MetaMask bağlantısı çalışıyor
- [ ] Wallet adresi görünüyor
- [ ] Deposit formu çalışıyor
- [ ] Transfer formu çalışıyor
- [ ] Adres validasyonu çalışıyor
- [ ] Status mesajları görünüyor
- [ ] Dark mode çalışıyor
- [ ] Responsive tasarım çalışıyor
- [ ] Loading states görünüyor
- [ ] Error handling çalışıyor

### 🐛 Bilinen Sınırlamalar

1. **Mock İşlemler**: Gerçek blockchain işlemi yok, sadece UI demo
2. **Balance Gösterimi**: "***" sabit (gerçek decrypt gerekir)
3. **Network**: Herhangi bir network'te çalışır (sadece cüzdan bağlantısı)

### 🎥 Video İçin Test Senaryosu

```
1. Sayfa açılışı (3 sn)
2. "Connect MetaMask" tıkla (5 sn)
3. MetaMask'ta cüzdanı seç (3 sn)
4. Deposit: 100 token (5 sn)
5. Transfer: 0x7099...C8 adresine 50 token (5 sn)
6. Dark mode toggle göster (3 sn)
7. Mobile view göster (3 sn)
TOPLAM: ~27 saniye
```

### ⚡ Hızlı Sorun Giderme

| Sorun | Çözüm |
|-------|--------|
| MetaMask buton görünmüyor | Sayfa yenile (F5) |
| "Please install MetaMask" | MetaMask extension kur |
| Bağlantı olmuyor | MetaMask'ta siteyi onayla |
| Status mesajları kaybolmuyor | 3 saniye sonra otomatik kaybolur |
| Dark mode çalışmıyor | Browser dark mode ayarını kontrol et |

---

**Not:** Bu bir DEMO frontend'dir. Production için:
- Gerçek contract deployment
- @zama-fhe/relayer-sdk ile encryption
- Error boundary ekle
- Loading spinner ekle
- Transaction hash göster
