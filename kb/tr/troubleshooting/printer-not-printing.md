---
id: kb_tr_printing_printer_not_printing_v1
title: "Mutfak/Bar/Birim yazıcısı yazdırmıyor"
lang: tr
docType: troubleshooting
intent: printer_not_printing
role: technician
product: kerzz_pos
module: printing
version: { min: null, max: null }
tags: ["yazıcı", "mutfak", "bar", "birim"]
priority: high
updated_at: "2026-01-28"
---

## Amaç

Bu akış, yazıcının neden yazdırmadığını hızlıca teşhis edip doğru aksiyonu seçmek içindir.

## Triage Soruları (ÖNCE SOR)

> Kullanıcıdan aşağıdakileri netleştirmeden kesin çözüm söyleme.

1) Yazıcı bağlantısı nedir? (Ethernet / USB / Wi-Fi)
2) Hiç mi yazdırmıyor, yoksa bazı ürünlerde mi?
3) POS'ta sipariş gönderince hata mesajı var mı? "Gönderildi" görünüyor mu?
4) Sorun ne zamandır var? Daha önce çalışıyor muydu?

## Belirtiye Göre Eleme (Decision Tree)

### Senaryo A — Hiç yazdırmıyor + Ethernet

**Kontrol adımları:**
1) Yazıcının açık ve "ready" durumda olduğunu kontrol et.
2) Ethernet kablosu yazıcıda ve switch/router'da takılı mı kontrol et.
3) Yazıcının IP alıp almadığını kontrol et (DHCP / statik).
4) Aynı ağda başka cihazlar yazıcıyı görüyor mu kontrol et.

**Beklenen sonuç:** Yazıcı online ve erişilebilir olmalı.

### Senaryo B — Sadece bazı ürünlerde yazdırmıyor

**Kontrol adımları:**
1) Yazdırmayan ürünlerde yazıcı tanımı/route var mı kontrol et.
2) Ürün kategorisinin yönlendirildiği yazıcı doğru mu kontrol et.
3) Ürün "mutfak" yerine "bar" gibi yanlış birime atanmış olabilir.

**Beklenen sonuç:** İlgili ürünler doğru yazıcıya yönlenmeli.

### Senaryo C — POS hata veriyor / gönderilemiyor

**Kontrol adımları:**
1) Hata mesajını aynen not al.
2) Hata mesajına göre ilgili kılavuz/known issue kaydını kontrol et.
3) Gerekirse ticket aç (ekran görüntüsü + zaman bilgisi).

## Ticket / Escalation Kriteri

- Kullanıcı triage sorularına cevap veremiyorsa (şu an cihaz başında değil) → ticket aç
- Adımlar tamamlandı ama sorun devam ediyorsa → ticket aç
- Birden fazla şube aynı anda etkileniyorsa → escalate

## Gerekli Bilgiler (Ticket için)

- Yazıcı türü (mutfak/bar/birim/fiş/rapor)
- Bağlantı türü (Ethernet/USB/Wi-Fi)
- Sorunun kapsamı (hiç / bazı ürünlerde)
- Hata mesajı (varsa)
- Şube adı + tarih/saat
