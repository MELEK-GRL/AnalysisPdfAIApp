# Test 4: İdrar + Hemogram + Biyokimya PDF (tekrar) – LLM timeout + Junk

## Kaynak
- **Orijinal PDF:** Test 1 ile aynı (İdrar tetkiki + Hemogram + Biyokimya)
- **Terminal:** `[API ERR] Network Error | ERR_NETWORK | /upload` + cevap yine geldi (confidence 0.35, "Local regex extraction (LLM timeout)")

## Durum
- Upload sırasında **network hatası** göründü; büyük ihtimalle istek gecikince **LLM timeout** oldu ve **regex fallback** devreye girdi.
- Regex bu PDF düzeninde az sayıda satır yakaladı ve bazı satırlar **birim/junk** olarak parse edildi.

## API’den dönen 5 madde (önceki)

| # | test | value | Sorun |
|---|------|--------|--------|
| 1 | BIRIM | 1.005 | Junk – birim adı; 1.005 muhtemelen Dansite refLow |
| 2 | BIRIMREFERANS NitritNeg... Non-Skuamoz Epitel (...) | 0 HPF (0-8) | Birleşik başlık; asıl test: Non-Skuamoz Epitel |
| 3 | pg | 27 | Junk – birim (MCH’ye ait) |
| 4 | g/dL | 32 | Junk – birim (MCHC’ye ait) |
| 5 | ALT - ALANIN AMINOTRANSFERAZ (ACIL) | 23 IU/L (0-33) | Doğru |

## Yapılan düzeltmeler

### 1. Junk filtre (birim = test adı)
- **isJunkLabLabel** genişletildi: Test adı **sadece birim** ise (BIRIM, pg, g/dL, mg/dL, mmol/L, IU/L, fL, sn, %, HPF, x10^3/uL vb.) **junk** kabul edilip listeden **çıkarılıyor**.

### 2. BIRIMREFERANS + Non-Skuamoz Epitel temizliği
- "BIRIMREFERANS ... Non-Skuamoz Epitel (Yassı olmayan Epitel)" gibi birleşik test adları **"Non-Skuamoz Epitel (Yassı olmayan Epitel)"** olacak şekilde kısaltılıyor.
- Metinde "Negatif" geçiyorsa **resultLabel = "Negatif"** atanıyor.

## Sonuç
- **BIRIM**, **pg**, **g/dL** artık listede görünmeyecek.
- **Non-Skuamoz Epitel** düzgün isimle ve (varsa) Negatif etiketiyle gösterilecek.
- **Tam ve doğru sonuç** için LLM’in cevap vermesi gerekiyor; **ağ stabil** olunca timeout olasılığı azalır. Gerekirse sunucu tarafında timeout/retry artırılabilir.

## Öneri
- Aynı PDF’i **iyi bağlantıda** tekrar yükleyip deneyin; LLM cevap verirse Test 1’deki gibi tüm parametreler gelir.
- Sunucuda **OPENAI timeout** veya **retry** artırılabilir (özellikle büyük/idrar+hemogram+biyokimya karışık PDF’ler için).
