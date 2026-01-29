# Knowledge Base (KB)

kerzz-ai için bilgi bankası ve dökümentasyon sistemi.

## Yapı

```
kb/
├── templates/           # Döküman şablonları
│   ├── troubleshooting.md
│   ├── faq.md
│   ├── howto.md
│   ├── release-note.md
│   └── known-issue.md
│
├── tr/                  # Türkçe dökümanlar
│   ├── troubleshooting/
│   ├── faq/
│   ├── howto/
│   └── release-notes/
│
└── en/                  # İngilizce dökümanlar (gelecekte)
    └── ...
```

## Döküman Tipleri

### 1. Troubleshooting
Sorun giderme kılavuzları. Decision-tree yaklaşımıyla adım adım teşhis.

**Kullanım:**
- Teknik destek ekibi için
- Yaygın problemlerin sistematik çözümü
- Triage soruları → senaryo bazlı çözüm

### 2. FAQ
Sıkça sorulan sorular ve kısa cevaplar.

**Kullanım:**
- Hızlı bilgi erişimi
- Kullanıcı ve destek ekibi için
- Basit, direkt cevaplar

### 3. How-to
Adım adım görev talimatları.

**Kullanım:**
- Belirli bir işi nasıl yapacağını anlatan kılavuzlar
- Yeni özellik kullanımı
- Kurulum ve konfigürasyon

### 4. Release Notes
Versiyon sürüm notları.

**Kullanım:**
- Yeni özellikler, iyileştirmeler, hata düzeltmeleri
- Breaking changes
- Upgrade talimatları

### 5. Known Issues
Bilinen sorunlar ve workaround'lar.

**Kullanım:**
- Henüz düzeltilmemiş sorunlar
- Geçici çözümler
- Etki alanı ve ETA takibi

## Metadata Yapısı

Her döküman başında YAML frontmatter:

```yaml
---
id: kb_tr_[type]_[slug]_v1          # Unique identifier
title: "[Başlık]"                    # İnsan okunabilir başlık
lang: tr                             # Dil kodu
docType: troubleshooting             # Döküman tipi
intent: [identifier]                 # AI'ın eşleştirmesi için intent
role: [technician|user|admin]        # Kimin için
product: kerzz_pos                   # Ürün
module: [printing|payment|...]       # Modül
version: { min: null, max: null }    # Versiyon kısıtı
tags: ["tag1", "tag2"]               # Arama için
priority: [high|medium|low]          # Öncelik
updated_at: "YYYY-MM-DD"             # Son güncelleme
---
```

## Yeni Döküman Ekleme

1. `templates/` klasöründen uygun şablonu kopyala
2. `tr/[docType]/` altına kaydet (dosya adı: `[slug].md`)
3. Metadata'yı doldur
4. İçeriği yaz
5. Git commit + push

## Arama & Kullanım

AI, dökümanları şu kriterlere göre bulur:
- **intent** → kullanıcı sorusunun amacı
- **tags** → anahtar kelimeler
- **module** → hangi modülle ilgili
- **role** → kim için
- **priority** → önem sırası

## Örnek Dosya Adı Kuralları

```
troubleshooting/
  printer-not-printing.md
  payment-timeout.md
  sync-failed.md

faq/
  how-to-reset-printer.md
  what-is-kerzz-pos.md

howto/
  setup-ethernet-printer.md
  configure-payment-terminal.md

release-notes/
  v1-5-0.md
  v1-4-2.md

known-issues/
  ethernet-printer-occasional-timeout.md
```

## Versiyonlama

- Döküman versiyonları `id` içinde: `_v1`, `_v2`...
- Major değişikliklerde yeni versiyon oluştur (eski versionu sil ya da archive'a taşı)
- Minor güncellemelerde `updated_at` tarihini güncelle

## Katkıda Bulunma

1. Yeni döküman eklerken şablonu kullan
2. Metadata'yı eksiksiz doldur
3. Açık, net, adım adım yaz
4. Gerçek hayat örnekleri ekle
5. Commit mesajında döküman id'sini belirt

## İletişim

Sorular için: [ekip kanalı/mail]
