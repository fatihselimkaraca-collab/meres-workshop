# Meres Sanat Atölyesi — Workshop Manager

Atölye yönetim uygulaması. Ders oluşturma, öğrenci kayıt ve ödeme takibi.

---

## Kurulum Adımları

### 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) adresine git
2. "Start your project" ile yeni bir proje oluştur
3. Projen oluşturulduktan sonra **Settings → API** sayfasına git
4. Şu iki bilgiyi kopyala:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon / public key** → `eyJhbGci...` ile başlayan uzun anahtar

### 2. Veritabanı Tablolarını Oluştur

1. Supabase panelinde **SQL Editor** sayfasına git
2. "New Query" butonuna tıkla
3. `supabase-setup.sql` dosyasının tüm içeriğini yapıştır
4. **Run** butonuna tıkla
5. Tüm tablolar otomatik oluşturulacak

### 3. API Anahtarlarını Gir

1. `config.js` dosyasını aç
2. Şu iki satırı kendi bilgilerinle değiştir:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

### 4. Uygulamayı Çalıştır

Dosyaları bir web sunucusunda aç. En kolay yöntemler:

**Seçenek A — VS Code Live Server:**
- VS Code'da "Live Server" eklentisini kur
- `index.html` dosyasına sağ tıkla → "Open with Live Server"

**Seçenek B — Python ile:**
```bash
cd workshop-app
python3 -m http.server 8000
```
Sonra tarayıcıda `http://localhost:8000` aç.

**Seçenek C — Netlify / Vercel / GitHub Pages:**
- Dosyaları bir GitHub reposuna yükle
- Netlify veya Vercel'e bağla → otomatik deploy

### 5. Safari'de Ana Ekrana Ekle (PWA)

1. iPhone'da Safari ile uygulamayı aç
2. Paylaş butonuna (□↑) tıkla
3. "Ana Ekrana Ekle" seç
4. Uygulama tam ekran açılacak

---

## Dosya Yapısı

```
workshop-app/
├── index.html          ← Ana sayfa (tüm HTML)
├── styles.css          ← Tüm stiller
├── app.js              ← Uygulama mantığı
├── config.js           ← Supabase bağlantı ayarları
├── manifest.json       ← PWA manifest dosyası
├── supabase-setup.sql  ← Veritabanı kurulum SQL'i
└── README.md           ← Bu dosya
```

---

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| Ders Listesi | Tüm dersler tarih sırasıyla, kontenjan ve ödeme durumu |
| Ders Oluşturma | Ad, tür, tarih, saat, kontenjan, ücret, eğitmen |
| Öğrenci Kayıt | Otomatik tamamlama, tekrar kayıt engelleme |
| Ödeme Takibi | Ödendi / Bekliyor / Kısmi durumları |
| Ders Detayı | Öğrenci listesi, gelir özeti, kayıt düzenleme |
| Filtreleme | Bugün, Bu Hafta, Ödenmemiş filtreleri |

---

## Gelecek Geliştirmeler İçin Hazırlık

### Instagram Form Entegrasyonu
- `students` tablosu Instagram form verilerini alabilecek yapıda
- `enrollments.note` alanı kaynak bilgisi için kullanılabilir
- Webhook ile otomatik kayıt eklenebilir

### Ödeme Otomasyonu
- `payment_status` alanı üç durumu destekler
- `paid_amount` ile kısmi ödeme takibi yapılabilir
- İleride otomatik hatırlatma sistemi eklenebilir

---

## Güvenlik Notu

Şu anki kurulum geliştirme modundadır (tüm erişim açık).
Canlıya almadan önce:

1. Supabase Authentication ekleyin
2. RLS politikalarını kısıtlayın
3. `anon key` yerine authenticated erişim kullanın
