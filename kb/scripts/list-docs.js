#!/usr/bin/env node

/**
 * KB Döküman Listesi
 * Tüm dökümanları tarar ve metadata'larını gösterir
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // npm install js-yaml gerekebilir

const KB_ROOT = path.join(__dirname, '..');
const LANGS = ['tr', 'en'];

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;
  
  try {
    return yaml.load(match[1]);
  } catch (e) {
    console.error('YAML parse error:', e.message);
    return null;
  }
}

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
      const content = fs.readFileSync(fullPath, 'utf8');
      const meta = extractFrontmatter(content);
      
      if (meta) {
        results.push({
          path: path.relative(KB_ROOT, fullPath),
          ...meta
        });
      }
    }
  }
  
  return results;
}

function main() {
  const docs = [];
  
  for (const lang of LANGS) {
    const langDir = path.join(KB_ROOT, lang);
    scanDirectory(langDir, docs);
  }
  
  // Filtreler (args'tan)
  const args = process.argv.slice(2);
  let filtered = docs;
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(docs, null, 2));
    return;
  }
  
  // Module filter
  const moduleIdx = args.indexOf('--module');
  if (moduleIdx !== -1 && args[moduleIdx + 1]) {
    const module = args[moduleIdx + 1];
    filtered = filtered.filter(d => d.module === module);
  }
  
  // DocType filter
  const typeIdx = args.indexOf('--type');
  if (typeIdx !== -1 && args[typeIdx + 1]) {
    const type = args[typeIdx + 1];
    filtered = filtered.filter(d => d.docType === type);
  }
  
  // Priority filter
  const priorityIdx = args.indexOf('--priority');
  if (priorityIdx !== -1 && args[priorityIdx + 1]) {
    const priority = args[priorityIdx + 1];
    filtered = filtered.filter(d => d.priority === priority);
  }
  
  // Sonuçları göster
  console.log(`\n📚 KB Dökümanları (${filtered.length} döküman)\n`);
  console.log('─'.repeat(80));
  
  const grouped = {};
  filtered.forEach(doc => {
    if (!grouped[doc.docType]) grouped[doc.docType] = [];
    grouped[doc.docType].push(doc);
  });
  
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`\n${type.toUpperCase()} (${items.length})`);
    console.log('─'.repeat(40));
    
    items.forEach(doc => {
      console.log(`\n📄 ${doc.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Module: ${doc.module} | Priority: ${doc.priority} | Role: ${doc.role}`);
      console.log(`   Path: ${doc.path}`);
      if (doc.tags?.length) {
        console.log(`   Tags: ${doc.tags.join(', ')}`);
      }
    });
  }
  
  console.log('\n' + '─'.repeat(80));
  console.log(`\nKullanım:`);
  console.log(`  node list-docs.js                    # Tümü`);
  console.log(`  node list-docs.js --type faq         # Sadece FAQ`);
  console.log(`  node list-docs.js --module printing  # Sadece printing modülü`);
  console.log(`  node list-docs.js --priority high    # Sadece yüksek öncelik`);
  console.log(`  node list-docs.js --json             # JSON output\n`);
}

main();
