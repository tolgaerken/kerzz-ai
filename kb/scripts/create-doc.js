#!/usr/bin/env node

/**
 * KB Döküman Oluşturucu
 * Şablondan yeni döküman oluşturur
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const KB_ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(KB_ROOT, 'templates');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('\n📝 KB Döküman Oluşturucu\n');

  // Döküman tipi seç
  const types = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
  console.log('Döküman tipleri:');
  types.forEach((type, i) => {
    console.log(`  ${i + 1}) ${type.replace('.md', '')}`);
  });

  const typeIdx = await question('\nDöküman tipi seçin (1-5): ');
  const templateName = types[parseInt(typeIdx) - 1];
  
  if (!templateName) {
    console.log('❌ Geçersiz seçim');
    rl.close();
    return;
  }

  const docType = templateName.replace('.md', '');
  console.log(`\n✅ Seçilen tip: ${docType}\n`);

  // Döküman bilgilerini topla
  const title = await question('Döküman başlığı: ');
  const slug = await question(`Dosya adı (slug) [${slugify(title)}]: `) || slugify(title);
  const lang = await question('Dil (tr/en) [tr]: ') || 'tr';
  const module = await question('Modül (printing/payment/sync/order/...): ');
  const intent = await question('Intent (örn: printer_not_printing): ');
  const role = await question('Rol (user/technician/admin) [technician]: ') || 'technician';
  const priority = await question('Öncelik (high/medium/low) [medium]: ') || 'medium';
  const tags = await question('Etiketler (virgülle ayır): ');

  // ID oluştur
  const id = `kb_${lang}_${docType}_${slug}_v1`;

  // Template oku
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let content = fs.readFileSync(templatePath, 'utf8');

  // Template'i doldur
  const now = new Date().toISOString().split('T')[0];
  const tagArray = tags.split(',').map(t => `"${t.trim()}"`).join(', ');

  content = content
    .replace(/id: .+/, `id: ${id}`)
    .replace(/title: ".+"/, `title: "${title}"`)
    .replace(/lang: .+/, `lang: ${lang}`)
    .replace(/docType: .+/, `docType: ${docType}`)
    .replace(/intent: .+/, `intent: ${intent}`)
    .replace(/role: .+/, `role: ${role}`)
    .replace(/module: .+/, `module: ${module}`)
    .replace(/tags: \[.+\]/, `tags: [${tagArray}]`)
    .replace(/priority: .+/, `priority: ${priority}`)
    .replace(/updated_at: ".+"/, `updated_at: "${now}"`);

  // Hedef klasörü belirle
  const targetDir = path.join(KB_ROOT, lang, docType);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, `${slug}.md`);

  // Dosya zaten var mı kontrol et
  if (fs.existsSync(targetPath)) {
    const overwrite = await question(`\n⚠️  Dosya zaten mevcut: ${targetPath}\nÜzerine yaz? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ İptal edildi');
      rl.close();
      return;
    }
  }

  // Dosyayı kaydet
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ Döküman oluşturuldu!');
  console.log(`📄 ${targetPath}`);
  console.log(`🆔 ${id}`);
  console.log(`\nŞimdi dökümanı düzenleyebilirsin:`);
  console.log(`  nano ${targetPath}`);
  console.log(`  code ${targetPath}`);
  console.log(`\nVeya vector store'a senkronize et:`);
  console.log(`  curl -X POST http://localhost:3000/kb/sync`);

  rl.close();
}

main().catch(err => {
  console.error('❌ Hata:', err.message);
  rl.close();
  process.exit(1);
});
