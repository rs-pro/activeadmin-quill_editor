#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');
const { execSync } = require('node:child_process');

// For development, use the local gem path
const gemPath = path.resolve(__dirname, '../..');

// Configuration for esbuild with proper module resolution
const config = {
  entryPoints: ['app/javascript/active_admin.js'],
  bundle: true,
  sourcemap: true,
  format: 'iife',
  outdir: 'app/assets/builds',
  publicPath: '/assets',
  loader: {
    '.js': 'js',
  },
  // Define global Quill for the initialization script
  define: {
    'global': 'window'
  },
  // Use alias for clean imports
  alias: {
    'activeadmin/quill_editor': path.join(gemPath, 'vendor/assets/javascripts/activeadmin/quill_editor.js')
  }
};

// Check if we're in watch mode
const watchMode = process.argv.includes('--watch');

if (watchMode) {
  // Start the build with watch mode
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  }).catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
} else {
  // Single build
  esbuild.build(config).then(() => {
    console.log('Build completed');
  }).catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}