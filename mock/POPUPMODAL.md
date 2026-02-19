# PopupModal Bileşeni

Uyarı, bilgi, hata ve başarı mesajları için kullanılan popup modal bileşeni.

## Konum

```
PdfAICli/src/components/Modals/PopupModal.tsx
```

## Kullanım

```tsx
import PopupModal from '../../components/Modals/PopupModal';

<PopupModal
    visible={modalVisible}
    title="Uyarı"
    message="Devam etmek istediğinize emin misiniz?"
    type="warning"
    rightButtonText="Tamam"
    onRightPress={() => setModalVisible(false)}
/>
```

## Props

| Prop              | Tip                    | Varsayılan | Açıklama                                   |
|-------------------|------------------------|------------|--------------------------------------------|
| `visible`         | `boolean`              | -          | Modal görünürlüğü                          |
| `title`           | `string`               | type'a göre| Başlık (type: info→Bilgi, warning→Uyarı, vb.) |
| `message`         | `string`               | `''`       | Ana mesaj metni                            |
| `type`            | `'info' \| 'warning' \| 'error' \| 'success'` | `'info'` | Renk/stil tipi |
| `leftButtonText`  | `string`               | -          | Sol buton metni (İptal vb.)                |
| `rightButtonText` | `string`               | -          | Sağ buton metni (Tamam, Anladım vb.)       |
| `onLeftPress`     | `() => void`           | -          | Sol buton tıklama                          |
| `onRightPress`    | `() => void`           | -          | Sağ buton tıklama                          |

## Type Renkleri

| type     | Accent rengi | Varsayılan başlık |
|----------|--------------|-------------------|
| `info`   | Mavi (#3B82F6) | Bilgi            |
| `warning`| Turuncu (#F59E0B) | Uyarı         |
| `error`  | Kırmızı (#EF4444) | Hata          |
| `success`| Yeşil (#10B981)  | Tamam          |

## Önerilen Kullanım Alanları

- **Uyarı:** Sözleşme onayı, limit aşımı, dikkat gerektiren durumlar
- **Hata:** Giriş hatası, yükleme hatası, validation
- **Bilgi:** Bilgilendirme mesajları
- **Başarı:** İşlem tamamlandı onayı

## Örnekler

```tsx
// Rate limit aşımı
<PopupModal
    visible={rateLimitModalVisible}
    title="Analiz Hakkı Doldu"
    message="24 saat içinde en fazla 2 kez PDF analizi yapabilirsiniz."
    type="warning"
    rightButtonText="Anladım"
    onRightPress={() => setRateLimitModalVisible(false)}
/>

// Hata
<PopupModal
    visible={errorVisible}
    title="Hata"
    message={errorMessage}
    type="error"
    rightButtonText="Tamam"
    onRightPress={() => setErrorVisible(false)}
/>

// Onay (İptal / Tamam)
<PopupModal
    visible={confirmVisible}
    title="Emin misiniz?"
    message="Bu işlem geri alınamaz."
    type="warning"
    leftButtonText="İptal"
    rightButtonText="Evet"
    onLeftPress={() => setConfirmVisible(false)}
    onRightPress={handleConfirm}
/>
```
