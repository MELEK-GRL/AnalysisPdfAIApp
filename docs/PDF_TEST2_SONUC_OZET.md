# Test 2: İkinci Tahlil PDF – Karşılaştırma Özeti

## Kaynak
- **Orijinal PDF:** Biyokimya + Hemogram + Koagülasyon + eGFR/Kreatinin
- **Terminal çıktısı:** API cevabı (46 satır) + uygulamada gösterilen lab değerleri

---

## Genel sonuç: Büyük oranda doğru

Çoğu parametre **değer, birim ve referans aralığı** ile PDF ile uyumlu. Serbest T3 / Serbest T4 bu PDF’de **doğru** parse edilmiş (3,01 ve 1,05; Test 1’deki gibi birleşme hatası yok).

---

## PDF ↔ API karşılaştırma tablosu

### Doğru eşleşenler (örnekler)

| PDF | API | Durum |
|-----|-----|--------|
| Açlık Kan Şekeri (AKŞ): 86 mg/dL (70-100) | 86, 70-100 | ✅ |
| Albumin: 47 g/L (35-52) | 47, 35-52 | ✅ |
| ALT: 20 U/L (0-33) | 20, 0-33 | ✅ |
| Anti HCV: 0,06 Negatif COI (0-0.99) | 0.06, Negatif | ✅ |
| APTT: 28,7 sn (26-38) | 28.7, 26-38 | ✅ |
| AST: 21 U/L (0-32) | 21, 0-32 | ✅ |
| BUN: 12,62 mg/dL (6-23) | 12.62, 6-23 | ✅ |
| HBs Ag: 0,18 Negatif COI | 0.18, Negatif | ✅ |
| HIV 1/2: 0,10 Negatif COI | 0.1, Negatif | ✅ |
| Kalsiyum: 8,9 mg/dL (8.6-10) | 8.9, 8.6-10 | ✅ |
| Klor: 106 mmol/L (95-107) | 106, 95-107 | ✅ |
| Magnezyum: 1,83 mg/dL (1.6-2.6) | 1.83, 1.6-2.6 | ✅ |
| Potasyum: 4,5 mmol/L (3.5-5.1) | 4.5, 3.5-5.1 | ✅ |
| **Serbest T3: 3,01 pg/mL (1,58-3,91)** | **3.01, 1.58-3.91** | ✅ |
| **Serbest T4: 1,05 ng/dL (0,70-1,48)** | **1.05, 0.7-1.48** | ✅ |
| Sodyum: 138 mmol/L (136-145) | 138, 136-145 | ✅ |
| TSH: 1,37 µIU/ml (0,35-4,94) | 1.37, 0.35-4.94 | ✅ |
| Üre: 27 mg/dL (16.6-48.5) | 27, 16.6-48.5 | ✅ |
| BASO / BASO %: 0,2 | 0.2 (her iki birim de) | ✅ |
| HCT, HGB, LYM%, LYM#, MCH, MCHC, MCV, MON#, MON%, NEUT%, NEUT#, PCT, PDW, PLT, RBC, RDW-CV, RDW-SD, WBC | Değer ve ref’ler uyumlu | ✅ |
| INR: 1,10 (0.8-1.2) | 1.1, 0.8-1.2 | ✅ |
| Protrombin Aktivitesi: 92,3 % (70-130) | 92.3, 70-130 | ✅ |
| Protrombin zamanı: 13,7 sn (11.5-15) | 13.7, 11.5-15 | ✅ |
| Kreatinin: 0,65 mg/dL (0.5-0.9) | 0.65, 0.5-0.9 | ✅ |

---

## Tespit edilen farklar / eksikler

### 1. CRP (kantitatif): "<0,5" gösterimi
- **PDF:** **<0,5** mg/L (0 - 5) — yani “ölçüm sınırının altında”.
- **API:** value **0.5**, ref 0–5.
- **Durum:** Sayısal olarak 0.5 kullanılması mantıklı, ancak raporda **&lt;0,5** yazması daha doğru. İsteğe bağlı: API’de `valueDisplay: "<0.5"` gibi bir alan eklenip uygulamada bu metin gösterilebilir.

### 2. MPV referans aralığı
- **PDF:** MPV: 9,2 fl **(9.4 - 12.3)**
- **API:** MPV: 9.2 fl, ref **9 - 19**
- **Durum:** Referans aralığı yanlış; 9–19 PDW’ye ait. Model muhtemelen MPV ile PDW ref’lerini karıştırdı. Düzeltme için prompt/çıktı kontrolü gerekir; backend’de otomatik kural zor.

### 3. Eksik parametreler (PDF’de var, API’de yok)
- **Anti HBs:** 9,25 IU/L (<10 Negatif, >=10 Pozitif) — API’de yok.
- **Kan Grubu ve Rh:** 0 RH(+) — sayısal tahlil listesine genelde alınmıyor; bilinçli atlama olabilir.
- **eGFR:** 119,89 (>60 normal kabul edilir) — tek taraflı aralık (>60); schema refLow/refHigh ile tam uyumlu olmayabilir, bu yüzden atlanmış olabilir.

### 4. Analiz metni – “Öne çıkan bulgular”
- Metinde **Kalsiyum: 8.9 mg/dL** “öne çıkan” olarak sayılmış; oysa 8.6–10 aralığında, yani **normal**. Referans dışına çıkan bir değer yok; bu madde kaldırılabilir veya “Tüm değerler referans içinde” denebilir.

---

## Özet tablo

| Kategori | Adet | Açıklama |
|----------|------|----------|
| ✅ Doğru | 43+ | Değer, birim, ref PDF ile uyumlu |
| ⚠️ Küçük fark | 1 | CRP: sayı 0.5 doğru, ekranda “<0.5” gösterimi tercih edilebilir |
| 🔴 Hata | 1 | MPV ref aralığı 9.4–12.3 olmalı, 9–19 değil |
| 📋 Eksik | 2–3 | Anti HBs; isteğe bağlı Kan Grubu, eGFR |

---

## Öneriler
1. **CRP &lt;0,5:** İstersen API’ye `valueDisplay` (veya benzeri) alanı eklenip uygulamada “<0.5” gösterilebilir.
2. **MPV ref:** Prompt’ta “Her parametre için sadece o satırdaki referans aralığını kullan; başka parametrenin ref’ini yazma” vurgusu güçlendirilebilir.
3. **Anti HBs / eGFR:** Prompt’ta “IU/L birimli ve <10 Negatif gibi ifadeli tüm parametreleri ekle” ve “Sadece alt sınır varsa (örn. >60) refLow kullan, refHigh null bırak” kuralları netleştirilebilir.

Test 2 için karşılaştırma özeti bu şekilde. İstersen bir sonraki adımda CRP için `valueDisplay` ve prompt iyileştirmelerini birlikte uygulayabiliriz.
