// Import ActiveAdmin - this already includes all features and Rails UJS
// DO NOT import Rails separately as it's already included and started in ActiveAdmin
import '@activeadmin/activeadmin';

// Import Quill from NPM and make it globally available
import Quill from 'quill';
window.Quill = Quill;

// Import the image uploader plugin if available (optional)
try {
  const ImageUploader = require('quill-image-uploader');
  window.ImageUploader = ImageUploader.default || ImageUploader;
} catch(e) {
  // Image uploader is optional (silent failure)
}

// Import the Quill Editor initialization module
import QuillEditorModule from 'activeadmin_quill_editor';

// Now that Quill is available, initialize the editors
// This ensures proper initialization order without setTimeout hacks
if (window.QuillEditor && window.QuillEditor.init) {
  window.QuillEditor.init();
} else if (QuillEditorModule && QuillEditorModule.init) {
  QuillEditorModule.init();
}