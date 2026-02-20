# Test 1: PDF gerçek değerler vs API cevabı karşılaştırması

## Özet

| Durum | Adet | Açıklama |
|-------|------|----------|
| ✅ Doğru | ~40 | test adı, value, unit, refLow/refHigh PDF ile uyumlu |
| 🔴 Kritik hata | 2 | Serbest T3 / Serbest T4 yanlış parse → yanlış yorum |
| 🟠 Yanlış veri | 4+ | Birim hataları, bozuk test adı, saçma satır |
| 🟡 Junk / tekrar | 4 | Listede olmaması gereken veya tekrarlanan satırlar |

**Sonuç:** Kullanıcıya bazı parametrelerde **yanlış veri ve yanlış yorum** gösteriliyor. Özellikle Serbest T3/T4 ve analiz metni düzeltilmeli.

---

## 🔴 Kritik: Yanlış gösterilen / yorumlanan veriler

### 1. Serbest T3 ve Serbest T4 (tehlikeli)

| PDF (gerçek) | API'de dönen | Sorun |
|--------------|--------------|--------|
| **Serbest T3:** 3,01 pg/mL (1,58 - 3,91) | test: "Serbest T", value: **33.01**, unit: pg/mL | "3" ile "3,01" birleşmiş → 33.01 gösteriliyor |
| **Serbest T4:** 1,05 ng/dL (0,70 - 1,48) | test: "Serbest T", value: **41.05**, unit: L | "4" ile "1,05" birleşmiş → 41.05 gösteriliyor |

- Analiz metninde: "Serbest T: 33.01 pg/mL - yüksek" ve "Serbest T: 41.05 L - yüksek" deniyor.
- Gerçekte **ikisi de referans aralığında (normal)**. Kullanıcı yanlışlıkla “yüksek” bilgisi görüyor.

### 2. HIV 1/2

| PDF (gerçek) | API'de dönen |
|--------------|--------------|
| HIV 1/2: 0,10 Negatif COI (0 - 0.99) | test: "HIV 1/20,10 NegatifCOI", value: **0**, refLow: 0, refHigh: 0.99 |

- Test adı bozuk, **değer 0** gösteriliyor (doğrusu 0,10).

### 3. CRP (kantitatif)

| PDF (gerçek) | API'de dönen |
|--------------|--------------|
| CRP (kantitatif): **<0,5** mg/L (0 - 5) | test: "CRP (kantitatif)**<**", value: **0.5**, unit: **g/L** |

- Değer "<0,5" olmalı; birim **mg/L** olmalı (g/L değil). İsimde fazladan "<" var.

---

## 🟠 Birim (unit) hataları – kullanıcı yanlış birim görüyor

| Test | PDF birimi | API'de dönen | Not |
|------|------------|--------------|-----|
| CRP (kantitatif) | mg/L | g/L | Yanlış (ağırlık birimi hatası) |
| TSH | µIU/ml | ml | Birim neredeyse kayıp |
| HGB | g/dL | L | Yanlış |
| MCHC | g/dL | L | Yanlış |
| BASO, EOS#, LYM#, NEUT#, PLT, RBC, WBC | K/uL veya M/uL | Sadece "L" | K/uL veya M/uL kaybolmuş |
| APTT, Protrombin zamanı | sn | null | Saniye gösterilmiyor |
| Anti HCV, HBs Ag, INR | COI / - | null | Kabul edilebilir ama tutarsız |

---

## 🟡 Junk / tekrar – listede olmaması gerekenler

| test (API) | value | Sorun |
|------------|-------|--------|
| Değeri | 9.04 | Anlamsız satır (regex artefakt) |
| CKD-EPI formülüne göre hesaplanmıştır. | 60 | Açıklama metni; test değil (2 kez var) |
| eGFR | 119.89 | eGFR iki kez geçiyor (tekrarlı blok) |

Bu satırlar filtrelenmeli veya birleştirilip tek eGFR satırı + not olarak gösterilmeli.

---

## ✅ Doğru eşleşen parametreler (örnek)

Açlık Kan Şekeri (AKŞ), Albumin, ALT, Anti HBs, Anti HCV (değer), APTT, AST, BUN, HBs Ag, Kalsiyum, Kan Grubu ve Rh, Klor, Magnezyum, Potasyum, Sodyum, Üre, BASO, BASO %, EOS %, EOS#, HCT, LYM %, LYM#, MCH, MCV, MON %/MON#, MPV, NEUT %/NEUT#, PCT, PDW, PLT, RBC, RDW-CV, RDW-SD, WBC, Protrombin Aktivitesi, Protrombin zamanı, eGFR (bir tanesi), Kreatinin — **değerler** büyük oranda doğru (birim/junk ayrı).

---

## Neden: `reason: "Local regex extraction (LLM timeout)"`

Cevap **LLM yerine local regex** ile üretilmiş. Regex:

- "Serbest T3" / "Serbest T4" gibi **T + rakam** yapısını tek "Serbest T" + yanlış sayı olarak parse ediyor.
- Bazı birimleri (K/uL, g/dL, µIU/ml) tek "L" veya "ml"ye indirgiyor.
- Satır sonu / format farkları "HIV 1/2" ve "0,10"u bozuyor.
- Açıklama cümlelerini ("CKD-EPI formülüne göre...", "Değeri") test satırı gibi alıyor.

---

## Önerilen aksiyonlar

1. **Regex (fallback) iyileştirme (PdfAIServer)**  
   - "Serbest T3" / "Serbest T4" için özel pattern: test adında "T3"/"T4" ayrı tutulup değer birleştirilmesin.  
   - Birim eşlemesi: K/uL, M/uL, g/dL, µIU/ml, sn korunacak şekilde güncelle.  
   - "Değeri", "CKD-EPI formülüne göre...", "Negatif COI" gibi açıklama/junk satırları filtrele veya test adı allow-list’e göre elenecek.

2. **LLM timeout’u azaltmamak / retry**  
   - Mümkünse LLM cevabı kullan (confidence ve doğruluk daha iyi). Timeout veya retry artırılabilir.

3. **Client tarafı (güvenlik)**  
   - Aynı `test` adıyla gelen birden fazla satırda (örn. "Serbest T") **label** veya başka alanla T3/T4 ayrımı yoksa, birim + ref aralığına göre (pg/mL → T3, ng/dL → T4) ayrıştırma veya en azından "Serbest T3/T4 ayrıştırılamadı" uyarısı.

4. **Analiz metni**  
   - Analiz, API’den gelen `items` ile üretiliyor. Serbest T hataları düzeltilmeden **yorum üretilmemeli** veya "Belirsiz parametre" gibi not düşülmeli.

Bu doküman Test 1 karşılaştırması için referans olarak kullanılabilir; Test 2’de aynı maddelere göre kontrol yapılabilir.
