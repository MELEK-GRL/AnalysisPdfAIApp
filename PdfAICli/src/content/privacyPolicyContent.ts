/**
 * Gizlilik politikası metni – TR ve EN
 * Play Store için URL’e konulacak içerikle uyumlu tutulmalı.
 */
export const PRIVACY_POLICY_CONTENT = {
    tr: {
        sections: [
            {
                title: '1. Toplanan Veriler',
                paragraphs: [
                    'Bu gizlilik politikası, PDF Tahlil Analizi uygulamasının kullanıcı verilerini nasıl topladığını, işlediğini ve koruduğunu açıklar.',
                ],
                bullets: [
                    'Hesap bilgileri: Ad soyad, e-posta, şifre (şifrelenmiş)',
                    'Sağlık verisi (KVKK md. 6): Tahlil PDF metni, parametreler – açık rızanız ile işlenir',
                    'Teknik veriler: Cihaz bilgisi, kurulum kimliği',
                ],
            },
            {
                title: '2. Verilerin Kullanım Amaçları',
                bullets: [
                    'Tahlil sonuçlarının yapay zekâ ile analiz edilmesi',
                    'Hesap yönetimi',
                    'Hizmetin iyileştirilmesi',
                ],
            },
            {
                title: '3. OpenAI Aktarımı',
                paragraphs: [
                    'Tahlil raporlarınızdan çıkarılan metin, ABD merkezli OpenAI Inc. hizmetlerine gönderilir. Bu aktarım açık rızanız dahilindedir. Analiz geçmişiniz sunucularımızda saklanır; hesap silindiğinde veya talep edildiğinde silinir.',
                ],
            },
            {
                title: '4. Güvenlik Önlemleri',
                bullets: [
                    'JWT, bcrypt, rate limiting, HTTPS',
                    'Helmet, CORS vb. güvenlik araçları',
                ],
            },
            {
                title: '5. KVKK md. 11 Haklarınız',
                bullets: [
                    'Bilgi talep etme, düzeltme, silme, itiraz, şikâyet',
                    'Başvurularınızı veri sorumlusuna yazılı iletebilirsiniz.',
                ],
            },
            {
                title: '6. Veri Sorumlusu',
                paragraphs: [
                    'Uygulama verilerinin sorumlusu uygulama geliştiricisidir. İletişim için uygulama içi ayarlar kullanılabilir.',
                ],
            },
            {
                title: '7. Tıbbi İddia Uyarısı',
                paragraphs: [
                    'Bu uygulama bilgilendirme amaçlıdır. Tıbbi tanı, teşhis veya tedavi hizmeti sunmaz. Sonuçlarınızın nihai yorumu için mutlaka doktorunuza danışın.',
                ],
            },
        ],
    },
    en: {
        sections: [
            {
                title: '1. Data Collected',
                paragraphs: [
                    'This privacy policy describes how the PDF Lab Analysis app collects, processes, and protects your data.',
                ],
                bullets: [
                    'Account info: Name, email, password (encrypted)',
                    'Health data (special category): Lab PDF text, parameters – processed with your explicit consent',
                    'Technical data: Device info, installation ID',
                ],
            },
            {
                title: '2. Purposes of Data Use',
                bullets: [
                    'AI analysis of lab results',
                    'Account management',
                    'Service improvement',
                ],
            },
            {
                title: '3. OpenAI Transfer',
                paragraphs: [
                    'Text extracted from your lab reports is sent to OpenAI Inc. (US) for analysis. This transfer is covered by your explicit consent. Your analysis history is stored on our servers; it is deleted when you delete your account or upon request.',
                ],
            },
            {
                title: '4. Security Measures',
                bullets: [
                    'JWT, bcrypt, rate limiting, HTTPS',
                    'Helmet, CORS, and other security tools',
                ],
            },
            {
                title: '5. Your Rights (KVKK Art. 11)',
                bullets: [
                    'Right to request information, correction, deletion, objection, and complaint',
                    'You may submit requests to the data controller in writing.',
                ],
            },
            {
                title: '6. Data Controller',
                paragraphs: [
                    'The data controller is the app developer. You may contact via in-app settings.',
                ],
            },
            {
                title: '7. Medical Disclaimer',
                paragraphs: [
                    'This app is for informational purposes only. It does not provide medical diagnosis, treatment, or advice. Always consult your doctor for final interpretation of your results.',
                ],
            },
        ],
    },
};
