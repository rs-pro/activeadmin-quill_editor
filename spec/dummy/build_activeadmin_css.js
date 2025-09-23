#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const inputPath = path.join(root, 'app/css/active_admin_source.css');
const vendorCssPath = path.join(root, 'node_modules/quill/dist/quill.snow.css');
const vendorBubbleCssPath = path.join(root, 'node_modules/quill/dist/quill.bubble.css');
const tmpPath = path.join(root, 'app/css/__aa_tmp.css');
const outPath = path.join(root, 'app/assets/builds/active_admin.css');

function build() {
  // Read source file
  let srcContent = '';
  if (fs.existsSync(inputPath)) {
    srcContent = fs.readFileSync(inputPath, 'utf8');
  } else {
    // Create default source if it doesn't exist
    srcContent = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
  }

  // Extract tailwind directives and body content
  const lines = srcContent.split(/\r?\n/);
  const tailwindLines = lines.filter(line => line.includes('@tailwind'));
  const bodyLines = lines.filter(line =>
    !line.includes('@tailwind') &&
    !line.includes('quill/dist/quill')
  );

  const tailwindDirectives = tailwindLines.join('\n') || '@tailwind base;\n@tailwind components;\n@tailwind utilities;';

  // Read Quill vendor CSS
  let vendorCss = '';

  if (fs.existsSync(vendorCssPath)) {
    vendorCss += `\n/* Begin Quill Snow theme CSS */\n`;
    vendorCss += fs.readFileSync(vendorCssPath, 'utf8');
    vendorCss += `\n/* End Quill Snow theme CSS */\n`;
  } else {
    console.warn('Warning: Quill Snow CSS not found at', vendorCssPath);
  }

  if (fs.existsSync(vendorBubbleCssPath)) {
    vendorCss += `\n/* Begin Quill Bubble theme CSS */\n`;
    vendorCss += fs.readFileSync(vendorBubbleCssPath, 'utf8');
    vendorCss += `\n/* End Quill Bubble theme CSS */\n`;
  } else {
    console.warn('Warning: Quill Bubble CSS not found at', vendorBubbleCssPath);
  }

  const body = bodyLines.join('\n');

  // Add custom Quill styles for ActiveAdmin integration
  const customStyles = `
/* Custom Quill integration styles */
.quill-editor {
  @apply border border-gray-300 rounded-md;
}

.ql-toolbar {
  @apply border-b-0 rounded-t-md;
}

.ql-container {
  @apply rounded-b-md;
}

.ql-editor {
  @apply min-h-[200px];
}

/* Dark mode support */
.dark .quill-editor {
  @apply border-gray-600;
}

.dark .ql-toolbar {
  @apply bg-gray-800 border-gray-600;
}

.dark .ql-container {
  @apply bg-gray-900 border-gray-600;
}

.dark .ql-editor {
  @apply text-gray-100;
}

/* Fix toolbar button styles */
.ql-toolbar button:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

/* Ensure icons are visible in dark mode */
.dark .ql-toolbar button svg {
  @apply text-gray-300;
}

.dark .ql-toolbar button:hover svg {
  @apply text-white;
}

.dark .ql-toolbar .ql-stroke {
  stroke: #9ca3af !important;
}

.dark .ql-toolbar .ql-fill {
  fill: #9ca3af !important;
}

.dark .ql-toolbar button:hover .ql-stroke {
  stroke: white !important;
}

.dark .ql-toolbar button:hover .ql-fill {
  fill: white !important;
}`;

  // Combine all CSS - Tailwind directives, vendor CSS, custom styles, then body
  const tmpCss = `${tailwindDirectives}\n${vendorCss}\n${customStyles}\n${body}`;

  // Create directories if they don't exist
  const cssDir = path.dirname(tmpPath);
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }

  const buildDir = path.dirname(outPath);
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  fs.writeFileSync(tmpPath, tmpCss, 'utf8');

  // Run tailwindcss build
  const res = spawnSync('npx', [
    'tailwindcss',
    '-c', path.join(root, 'tailwind-active_admin.config.js'),
    '-i', tmpPath,
    '-o', outPath,
    '--minify'
  ], { stdio: 'inherit', cwd: root });

  if (res.status !== 0) {
    console.error('Tailwind build failed');
    process.exit(res.status || 1);
  }

  // Clean up temp file
  fs.unlinkSync(tmpPath);

  console.log(`ActiveAdmin CSS built successfully: ${outPath}`);
  const stats = fs.statSync(outPath);
  console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
}

// Support watch mode
if (process.argv.includes('--watch')) {
  console.log('Watching for changes...');

  // Initial build
  build();

  // Watch for changes
  const watchPaths = [
    inputPath,
    path.join(root, 'tailwind-active_admin.config.js'),
    path.join(root, 'app/admin'),
    path.join(root, 'app/views')
  ];

  const chokidar = require('chokidar');
  const watcher = chokidar.watch(watchPaths, {
    ignored: /node_modules|\.git|__aa_tmp\.css/,
    persistent: true
  });

  watcher.on('change', () => {
    console.log('Changes detected, rebuilding...');
    try {
      build();
    } catch (err) {
      console.error('Build error:', err);
    }
  });
} else {
  build();
}