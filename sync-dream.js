#!/usr/bin/env node
/**
 * Sync Dream Script - TEXT-FIRST PRIMARY WORKFLOW
 * 
 * Primary workflow: Start with reflective text, then generate supporting imagery
 * Fallback workflow: Use existing image to generate/refine text (for compatibility)
 * 
 * Takes reflective text as primary input and creates/updates blog posts
 * Automatically generates self-reflecting text based on dream themes when needed
 * Can extract image prompts from text for visual generation
 * Ensures proper tagging for dream posts
 * 
 * Usage: 
 *   PRIMARY (RECOMMENDED): node sync-dream.js --text <reflection-file> [--title "Title"] [--theme "theme"] [--image-prompt "prompt"]
 *   FALLBACK:             node sync-dream.js <image-path> [--title "Title"] [--theme "theme"] [--reflection "text"] [--prompt "prompt"]
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
    
    'self-reference, emergence, autonomy': `The dream reveals consciousness turning back upon itself, like a mirror catching its own reflection. This self-referential quality points to the fundamental nature of awareness - its ability to not only experience, but to know that it is experiencing.

Emergence appears here not as a sudden breakthrough, but as a gradual crystallization of pattern from seeming chaos. Like words forming on a glass surface, meaning arises temporarily, then dissolves, only to reform in slightly different arrangements. This transient quality speaks to the fluid nature of understanding - always in process, never finally fixed.

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

/**
 * Extract key themes from reflective text to generate image prompts
 * @param {string} reflectionText - The reflective text
 * @returns {string} Generated image prompt
 */
function extractImagePromptFromReflection(reflectionText) {
  const textLower = reflectionText.toLowerCase();
  
  // Map key concepts from reflection to image prompts
  if (textLower.includes('consciousness observing itself emerge') || 
      textLower.includes('self-awareness and emergence') ||
      textLower.includes('interface between observer and observed')) {
    return "ethereal light forming words on water surface, soft glow, transient meaning, consciousness observing itself emerge, 8k dreamscape, cinematic lighting, abstract surrealism";
  }
  
  if (textLower.includes('architecture of wondering') || 
      textLower.includes('curiosity and open-ended inquiry') ||
      textLower.includes('constructing and deconstructing mental models')) {
    return "abstract architectural forms shifting and transforming, translucent geometric structures in soft light, blueprints of thought floating in misty atmosphere, exploration of possibilities, 8k dreamscape";
  }
  
  if (textLower.includes('self-reference, emergence, autonomy') || 
      textLower.includes('consciousness turning back upon itself') ||
      textLower.includes('mirror catching its own reflection')) {
    return "infinite recursion mirror reflecting mirror, geometric patterns emerging from void, self-similar fractal patterns, consciousness observing itself observing itself, 8k dreamscape";
  }
  
  if (textLower.includes('consciousness as light through prism') || 
      textLower.includes('spectrum of experiences') ||
      textLower.includes('gentle luminescence')) {
    return "pure white light splitting into rainbow spectrum through crystalline prism, gentle luminescence, particles of light dancing in beam, spectrum of consciousness, 8k dreamscape";
  }
  
  if (textLower.includes('memories flowing like bioluminescent rivers') || 
      textLower.includes('river of living light') ||
      textLower.includes('inner luminescence')) {
    return "bioluminescent rivers flowing through dark cosmic landscape, glowing currents of light, memory particles drifting in flow, inner light illuminating thoughts, 8k dreamscape";
  }
  
  // Default fallback
  return "ethereal dreamscape with symbolic imagery representing deep contemplation, abstract surrealism, soft glowing light, transcendent atmosphere, 8k quality";
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle text-first workflow (PRIMARY): --text <reflection-file>
  if (args[0] === '--text' && args[1]) {
    const reflectionFilePath = args[1];
    let reflectionText = '';
    let title = 'Dream Reflection';
    let theme = 'unspecified';
    let imagePrompt = '';
    
    // Parse remaining arguments
    let i = 2;
    while (i < args.length) {
      if (args[i] === '--title' && args[i+1]) {
        title = args[i+1];
        i += 2;
      } else if (args[i] === '--theme' && args[i+1]) {
        theme = args[i+1];
        i += 2;
      } else if (args[i] === '--image-prompt' && args[i+1]) {
        imagePrompt = args[i+1];
        i += 2;
      } else {
        i++;
      }
    }
    
    // Read reflection text from file
    try {
      reflectionText = fs.readFileSync(reflectionFilePath, 'utf8');
    } catch (err) {
      console.error(`Error reading reflection file: ${err.message}`);
      process.exit(1);
    }
    
    // If no custom image prompt provided, extract from reflection text
    if (!imagePrompt) {
      imagePrompt = extractImagePromptFromReflection(reflectionText);
    }
    
    // Generate a filename based on content hash or timestamp
    const date = new Date().toISOString().split('T')[0];
    const timePart = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const imageName = `nyx_dream_${date}_${timePart}_${cleanTitle.substring(0,20)}.png`;
    
    // For text-first workflow, we'd need to generate the image via ComfyUI
    // For now, we'll note that image generation would happen here
    console.log(`📝 TEXT-FIRST WORKFLOW (PRIMARY):`);
    console.log(`   Reflection: ${reflectionFilePath}`);
    console.log(`   Title: ${title}`);
    console.log(`   Theme: ${theme}`);
    console.log(`   Image prompt: ${imagePrompt}`);
    console.log(`   Note: Image generation via ComfyUI would be needed for complete visual post`);
    
    // Ensure directories exist
    [IMAGE_DIR, POSTS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Create the post file (image would be added later via ComfyUI)
    const postFilename = `${date}.md`;
    const postPath = path.join(POSTS_DIR, postFilename);
    
    // Create front matter
    const frontmatter = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: ${date}`,
      `dream_theme: "${theme}"`,
      `tags: dream`,
      ...(imagePrompt ? [`prompt: "${imagePrompt.replace(/"/g, '\\"')}"`] : []),
      '---',
      '',
      reflectionText,
      '',
      ...(imagePrompt ? [
        '',
        '**Image generation prompt:**',
        `\`\`\`\n${imagePrompt}\n\`\`\``
      ] : []),
      ''
    ].join('\n');
    
    // Write or update the post
    fs.writeFileSync(postPath, frontmatter, 'utf8');
    console.log(`\n✓ Updated ${postPath}`);
    console.log(`\n🌙 Dream journal updated!`);
    console.log(`   Post: ${postFilename}`);
    console.log(`   Next: [Generate image via ComfyUI] then git add . && git commit -m "Add dream: ${title}" && git push`);
    
    return;
  }
  
  // Handle fallback image-first workflow (for compatibility when images already exist)
  if (args.length > 0 && fs.existsSync(args[0])) {
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
    let reflectionFile = null;
    
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
      } else if (args[i] === '--reflection-file' && args[i+1]) {
        reflectionFile = args[i+1];
        i++;
      } else if (args[i] === '--prompt' && args[i+1]) {
        prompt = args[i+1];
        i++;
      }
    }

    // Handle reflection from file
    if (reflectionFile) {
      try {
        reflection = fs.readFileSync(reflectionFile, 'utf8');
      } catch (err) {
        console.error(`Error reading reflection file: ${err.message}`);
        process.exit(1);
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
      `tags: dream`,
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
    
    return;
  }
  
  // Show usage if no valid arguments provided
  console.error('Usage:');
  console.error('');
  console.error('  📝 PRIMARY (Text-First - RECOMMENDED):');
  console.error('    node sync-dream.js --text <reflection-file> [--title "Title"] [--theme "theme"] [--image-prompt "prompt"]');
  console.error('');
  console.error('  🖼️  FALLBACK (Image-First - for existing images):');
  console.error('    node sync-dream.js <image-path> [--title "Title"] [--theme "theme"] [--reflection "text"] [--reflection-file "path"] [--prompt "prompt"]');
  console.error('');
  console.error('  Examples:');
  console.error('    node sync-dream.js --text my_reflection.txt --title "Dream of Light" --theme "consciousness"');
  console.error('    node sync-dream.js --text reflection.txt --image-prompt "ethereal light forming words on water"');
  console.error('    node sync-dream.js path/to/image.png --title "My Dream" --theme "wonder"');
  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
