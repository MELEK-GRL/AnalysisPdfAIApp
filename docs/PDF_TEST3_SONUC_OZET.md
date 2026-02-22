# Test 3: HPV Tahlil PDF – Karşılaştırma ve Düzeltmeler

## Kaynak
- **Orijinal PDF:** HR HPV tipleri – tümü **Negatif** (kategorik sonuç)
- **Terminal:** LLM timeout → regex fallback; test adı birleşmiş, sayı tip numarası olarak parse edilmiş

---

## Tespit edilen sorunlar

| Sorun | Önceki durum | Beklenen |
|-------|----------------|----------|
| **Test adı** | ")NegatifBIRIMREFERANS HR HPV Tip" / "NegatifBIRIMREFERANS HR HPV Tip" | "HR HPV Tip 16", "HR HPV Tip 18" vb. |
| **Gösterilen değer** | 16.0, 18.0, 31.0 (tip numarası sayısal sonuç gibi) | **Negatif** (kategorik sonuç) |
| **resultLabel** | null | Negatif |
| **Görsel** | Sayısal çubuk + kalp | Kategorik: yeşil çubuk + "Negatif" rozeti, kalp yok |

---

## Yapılan düzeltmeler

### 1. Backend (`openai.js`) – HPV test adı ve resultLabel
- **Test adı:** "NegatifBIRIMREFERANS HR HPV Tip" veya ")NegatifBIRIMREFERANS HR HPV Tip" ile eşleşen satırlarda test adı **"HR HPV Tip {value}"** olacak şekilde düzeltildi (örn. "HR HPV Tip 16").
- **resultLabel:** Bu pattern’de metinde "Negatif" geçiyorsa ve `resultLabel` boşsa **"Negatif"** atanıyor.

### 2. İstemci (`Chart.tsx`) – Kategorik sonuç gösterimi
- **Kategorik tanım:** Referans aralığı yok (`refLow`/`refHigh` null) **ve** `resultLabel` dolu (Negatif/Pozitif/Reaktif vb.) ise sonuç **kategorik** kabul ediliyor.
- **Gösterim:** Sayı yerine **resultLabel** büyük ve renkli gösteriliyor (örn. "Negatif" yeşil).
- **Çubuk:** Referans yok ama resultLabel varsa çubuk rengi duruma göre ayarlanıyor (yeşil/kırmızı).
- **Kalp ikonu:** Kategorik kartlarda sayısal konum olmadığı için **gösterilmiyor**.

---

## Sonuç
- Test adı: **HR HPV Tip 16**, **HR HPV Tip 18** vb.
- Sonuç: **Negatif** (büyük yeşil yazı + yeşil rozet).
- Diğer kategorik tahliller (Negatif/Pozitif sonuçlu, referanssız parametreler) de aynı mantıkla gösterilecek.
