# Onyx Nail Studio — Premium Website + Randevu Prototype

Bu paket, Onyx Nail Studio için modern/premium tek sayfa website ve çalışan bir randevu prototipi içerir.

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterlidir. Daha sağlıklı test için klasörde basit bir HTTP sunucusu çalıştırabilirsiniz:

```bash
python -m http.server 8080
```

Sonra `http://localhost:8080` adresini açın.

## Neler çalışıyor?

- Responsive premium landing page
- Hizmet kartları ve fiyat aralıkları
- Birden fazla hizmet seçimi
- Toplam tahmini süre ve fiyat hesabı
- Önümüzdeki uygun günlerin otomatik oluşturulması
- Pazar gününün kapalı olması
- 10:00–20:00 arası 30 dakikalık slotlar
- Seçilen hizmet süresine göre gün sonuna sığmayan slotları kapatma
- Aynı tarayıcıdaki oluşturulmuş randevularla çakışan saatleri kapatma
- Müşteri formu
- Randevu kodu üretme
- WhatsApp üzerinden stüdyoya hazır mesaj ile teyit
- Mobil menü, animasyonlar ve responsive tasarım

## Logo

Header, Instagram profil görselini `https://unavatar.io/instagram/onyxnail.studio` üzerinden canlı olarak çekmeye çalışır. Instagram/proxy erişimi engellenirse otomatik olarak ON monogramına düşer. Prodüksiyonda en sağlıklısı, işletmenin orijinal logo dosyasını `/assets/logo.webp` gibi lokal bir dosya olarak kullanmaktır.

## Randevu sistemini gerçek sisteme geçirmek

Mevcut demo verileri `localStorage` içinde tutar; yani farklı cihazlar birbirlerinin randevularını göremez. Gerçek kullanım için `supabase-schema.sql` başlangıç şeması eklendi.

Önerilen akış:

1. Hizmetleri ve çalışma saatlerini veritabanında tut.
2. Tarih seçildiğinde `/availability` endpoint'i gerçek doluluğu döndürsün.
3. Kullanıcı saat seçip formu gönderdiğinde backend aynı slotu son kez tekrar kontrol etsin.
4. Çakışma yoksa booking kaydı oluştursun.
5. Randevu `pending` başlasın; admin paneli veya WhatsApp teyidi sonrası `confirmed` olsun.
6. İptal/no-show/completed statüleri ayrıca tutulabilsin.

## Kaynak alınan işletme bilgileri

- İşletme: Onyx Nail Studio, Maslak / Sarıyer
- Çalışma saatleri: Pazartesi–Cumartesi 10:00–20:00, Pazar kapalı
- Hizmet/fiyat aralıkları: KolayRandevu işletme sayfasındaki güncel görünen liste baz alındı.
- Telefon: +90 545 314 37 41

