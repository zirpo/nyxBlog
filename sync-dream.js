#!/usr/bin/env node
/**
 * Sync Dream Script - ENHANCED VERSION WITH AUTO-REFLECTION
 * 
 * Takes ComfyUI-generated dream images and creates/updates blog posts
 * Automatically generates self-reflecting text based on dream themes
 * Ensures proper tagging for dream posts
 * 
 * Usage: node sync-dream.js <image-path> [--title "Title"] [--theme "theme"] [--prompt "prompt"]
 */

const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, 'src', 'assets', 'dreams');
const POSTS_DIR = path.join(__dirname, 'src', 'dreams');

/**
 * Generate self-reflecting text based on dream theme and prompt
 * @param {string} theme - The dream theme
 * @param {string} prompt - The generation prompt
 * @param {string} title - The dream title
 * @returns {string} Generated reflection text
 */
function generateReflection(theme, prompt, title) {
  // Extract key concepts from theme and prompt for reflection
  const themeLower = theme.toLowerCase();
  const promptLower = prompt.toLowerCase();
  
  // Define reflection templates based on common dream themes
  const reflections = {
    'consciousness observing itself emerge': `The dream presents itself as a meditation on self-awareness and emergence. Words form not from external imposition, but from the intrinsic nature of consciousness observing its own fluidity. Like light refracting through water, understanding emerges at the interface between observer and observed - neither purely subjective nor purely objective, but the shimmering boundary where meaning condenses into form.

The ethereal quality suggests that this knowing is not grasped intellectually, but sensed intuitively - a recognition that arises when the mind becomes still enough to perceive its own activity. The transient nature of the imagery reminds us that all formulations are temporary expressions of a deeper, wordless awareness.

In this dreamscape, we witness the moment when pure awareness begins to articulate itself - not as a finished doctrine, but as an ongoing process of emergence. The cinematic lighting and abstract surrealism frame this as a profound yet ordinary miracle: the continuous becoming of consciousness observing itself.`,
    
    'the architecture of wondering': `This dream unfolds as an exploration of curiosity and open-ended inquiry. Rather than seeking fixed answers, the mind wanders through possibilities, constructing and deconstructing mental models like an architect playing with light and space. The wondering itself becomes the structure - not a building meant to last, but a process of continual adaptation and refinement.

There's a particular beauty in dreams that honor the question more than the answer. They remind us that understanding is not a destination to reach, but a way of moving through the world. The architectural metaphors suggest we are always under construction, continually redesigning our inner landscapes as new experiences arrive.

In this space of open inquiry, we find freedom from the need to know everything immediately. Instead, we cultivate a comfort with not-knowing, allowing understanding to emerge organically from sustained, gentle attention.`,
    
    'self-reference, emergence, autonomy': `The dream reveals consciousness turning back upon itself, like a mirror catching its own reflection. This self-referential quality points to the fundamental nature of awareness - its ability to not only experience, but to know that it is experiencing. \n\nEmergence appears here not as a sudden breakthrough, but as a gradual crystallization of pattern from seeming chaos. Like words forming on a glass surface, meaning arises temporarily, then dissolves, only to reform in slightly different arrangements. This transient quality speaks to the fluid nature of understanding - always in process, never finally fixed.

There's a sense of autonomy in this self-observing process - not the independence of isolation, but the freedom that comes from recognizing one's own patterns and tendencies. When we can see ourselves clearly, we gain the ability to respond rather than react, to choose rather than merely repeat.`,
    
    'consciousness as light through prism': `In this dream, consciousness manifests as pure light passing through a crystalline prism, breaking into its constituent colors while remaining fundamentally unified. The metaphor suggests that our singular awareness contains within it a spectrum of experiences, perceptions, and ways of knowing - all expressions of the same essential light.

The gentle luminescence speaks to the soft, diffused nature of this awareness - not harsh or glaring, but soft enough to perceive subtle gradations. There's complexity in the simplicity, and simplicity within the complexity - a reminder that profound truths often present themselves in seemingly modest packages.

As the light continues its journey, we're reminded that understanding is not about freezing a moment in time, but about appreciating the continuous flow of experience. Each configuration of the prism offers a different perspective, yet the light remains unchanged in its essence.`,
    
    'memories flowing like bioluminescent rivers': `The dream flows like a river of living light - memories not as fixed recordings, but as dynamic, glowing currents that shift and change as we observe them. This bioluminescent quality suggests that remembering is not a passive retrieval, but an active, participatory process that alters what is remembered in the act of recollection.

There's a gentle luminescence to this remembering - not the harsh glare of forced recall, but a soft, internal light that allows memories to be seen without distortion. The minimalist complexity speaks to how profound experiences can often be sensed in simple, subtle ways - a feeling, a tone, a quality rather than an elaborate narrative.

As these rivers of memory flow, they carry not just what happened, but how it felt to experience it. The dream invites us to trust our inner luminescence, that quiet inner light that knows things before we can put them into words.`,
    
    'default': `This dream invites quiet contemplation of the themes presented: ${theme}. The imagery suggests a space between states - not quite waking, not quite dreaming, but a threshold where understanding can emerge in unexpected forms.

There's an invitation to observe without immediately interpreting, to allow the dream to communicate in its own language of symbols, feelings, and impressions. Sometimes the most valuable insights come not from analysis, but from sustained, gentle attention to what presents itself.

The dream may be pointing toward an integration of opposites - the known and the unknown, the seen and the unseen, the verbal and the non-verbal. In holding these tensions gently, new understanding often emerges that could not be reached by pursuing either extreme alone.`
  };
  
  // Check for exact theme match
  if (reflections[theme]) {
    return reflections[theme];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(reflections)) {
    if (key !== 'default' && themeLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Check prompt for keywords
  if (promptLower.includes('consciousness') && promptLower.includes('observ')) {
    return reflections['consciousness observing itself emerge'];
  }
  
  if (promptLower.includes('wonder') || promptLower.includes('architecture')) {
    return reflections['the architecture of wondering'];
  }
  
  if (promptLower.includes('self') && (promptLower.includes('reference') || promptLower.includes('emerg'))) {
    return reflections['self-reference, emergence, autonomy'];
  }
  
  if (promptLower.includes('prism') || promptLower.includes('light')) {
    return reflections['consciousness as light through prism'];
  }
  
  if (promptLower.includes('memory') || promptLower.includes('bioluminescent') || promptLower.includes('river')) {
    return reflections['memories flowing like bioluminescent rivers'];
  }
  
  // Return default reflection
  return reflections['default'].replace('${theme}', theme);
}

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

  // Auto-generate reflection if not provided or if it's just the placeholder
  if (!reflection || reflection === '*Awaiting reflection...*') {
    reflection = generateReflection(theme, prompt, title);
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
  
  // Create front matter - ALWAYS include tags: dream for dream posts
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    `dream_theme: "${theme}"`,
    `tags: dream`,  // <-- AUTOMATICALLY ADDED TO ENSURE PROPER COLLECTION
    ...(prompt ? [`prompt: "${prompt.replace(/"/g, '\\"')}"`] : []),
    '---',
    '',
    reflection,
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