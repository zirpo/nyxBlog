#!/usr/bin/env node
/**
 * Sync Dream Script
 * 
 * Takes ComfyUI-generated dream images and creates/updates blog posts
 * 
 * Usage: node sync-dream.js <image-path> [options]
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('node:path');

const IMAGE_DIR = path.join(__dirname, 'src', 'assets', 'dreams');
const POSTS_DIR = path.join(__dirname, 'src', 'dreams');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node sync-dream.js <image-path> [--title "Title"] [--theme "theme"] [--reflection "text"] [--prompt "prompt"]');
    process.exit(1);
  }

  const imagePath = args[0];
  const imageName = path.basename(imagePath);
  
  // Parse date from filename or use today
  const dateMatch = imageName.match(/(\d{8})/);
  let date = dateMatch ? `${dateMatch[1].slice(0,4)}-${dateMatch[1].slice(4,6)}-${dateMatch[1].slice(6,8)}` : new Date().toISOString().split('T')[0];
  
  // Default values
  let title = `Dream: ${imageName.replace(/_/g, ' ').replace(/\.[^/.]+$/, '')}`;
  let theme = 'unspecified';
  let reflection = '';
  let prompt = '';
  
  // Parse optional arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--title' && args[i+1]) {
      title = args[i+1];
      i++;
    } else if (args[i] === '--theme' && args[i+1]) {
      theme = args[i+1];
      i++;
    } else if (args[i] === '--reflection' && args[i+1]) {
      reflection = args[i+1];
      i++;
    } else if (args[i] === '--prompt' && args[i+1]) {
      prompt = args[i+1];
      i++;
    }
  }

  // Ensure directories exist
  [IMAGE_DIR, POSTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Copy image to assets/dreams if not already there
  const targetImagePath = path.join(IMAGE_DIR, imageName);
  if (!fs.existsSync(targetImagePath)) {
    fs.copyFileSync(imagePath, targetImagePath);
    console.log(`✓ Copied ${imageName} to assets/dreams/`);
  }

  // Create post filename
  const postFilename = `${date}.md`;
  const postPath = path.join(POSTS_DIR, postFilename);
  
  // Create front matter
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    `dream_theme: "${theme}"`,
    ...(prompt ? [`prompt: "${prompt.replace(/"/g, '\\"')}"`] : []),
    ...(reflection.length > 50 ? [] : []), // Only add reflection if substantial
    `image: "/assets/dreams/${imageName}"`,
    '---',
    '',
    reflection || '*Awaiting reflection...*',
    '',
    ...(prompt ? [
      '',
      '**Generation prompt:**',
      `\`\`\`\n${prompt}\n\`\`\``
    ] : []),
    ''
  ].join('\n');

  // Write or update the post
  fs.writeFileSync(postPath, frontmatter, 'utf8');
  console.log(`✓ Updated ${postPath}`);

  console.log(`\n🌙 Dream journal updated!`);
  console.log(`   Image: ${imageName}`);
  console.log(`   Post: ${postFilename}`);
  console.log(`   Run: git add . && git commit -m "Add dream: ${title}" && git push`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});