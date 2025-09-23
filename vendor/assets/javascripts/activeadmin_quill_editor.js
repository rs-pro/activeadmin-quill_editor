(function() {
  'use strict';

  // Default configuration
  const defaultTheme = 'snow';
  const defaultToolbar = [
    ['bold', 'italic', 'underline'],
    ['link', 'blockquote', 'code-block'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'align': [] }, { list: 'ordered' }, { list: 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['image'],
    ['clean'],
  ];

  let registeredPlugins = {};

  // Initialize a single Quill editor
  function initQuillEditor(container) {
    // Check if Quill is available
    if (typeof window.Quill === 'undefined') {
      return;
    }

    // Check if already initialized
    if (!container || container.classList.contains('quill-editor--active')) {
      return;
    }

    const content = container.querySelector('[data-aa-quill-content]');
    if (!content) return;

    // Setup editor options
    const options = container.getAttribute('data-options') ?
      JSON.parse(container.getAttribute('data-options')) : {};

    if (!options.theme) options.theme = defaultTheme;
    if (!options.modules) options.modules = {};
    if (!options.modules.toolbar) options.modules.toolbar = defaultToolbar;

    // Setup plugin options
    const pluginOptions = container.getAttribute('data-plugins') ?
      JSON.parse(container.getAttribute('data-plugins')) : {};

    // Handle image uploader plugin if configured
    if (pluginOptions.image_uploader && pluginOptions.image_uploader.server_url) {
      if (!registeredPlugins.image_uploader && typeof window.ImageUploader !== 'undefined') {
        window.Quill.register('modules/imageUploader', window.ImageUploader);
        registeredPlugins.image_uploader = true;
      }
      const opts = pluginOptions.image_uploader;
      options.modules.imageUploader = setupImageUploader(opts.server_url, opts.field_name);
    }

    // Initialize Quill editor
    const editor = new window.Quill(content, options);
    container._quillEditor = editor;
    container.classList.add('quill-editor--active');

    // Store reference for form submission
    const input = container.querySelector('input[type="hidden"]');
    if (input) {
      container._quillInput = input;
    }

    return editor;
  }

  // Initialize all Quill editors on the page
  function initQuillEditors() {
    // Don't retry here - expect Quill to be available when called
    if (typeof window.Quill === 'undefined') {
      console.error('Quill is not available. Please ensure Quill is loaded before initializing editors.');
      return;
    }

    const editors = document.querySelectorAll('[data-aa-quill-editor]');
    editors.forEach(initQuillEditor);

    // Setup form submission handler
    setupFormSubmission();
  }

  // Setup form submission to update hidden inputs
  function setupFormSubmission() {
    const forms = document.querySelectorAll('form.formtastic');

    forms.forEach(function(form) {
      // Check if already setup
      if (form._quillSubmitHandler) return;

      form._quillSubmitHandler = true;
      form.addEventListener('submit', function(e) {
        updateQuillInputs(form);
      });
    });
  }

  // Update hidden inputs with editor content before form submission
  function updateQuillInputs(form) {
    const editors = form.querySelectorAll('[data-aa-quill-editor]');

    editors.forEach(function(container) {
      const editor = container._quillEditor;
      const input = container._quillInput;

      if (editor && input) {
        if (editor.getText().trim() === '') {
          input.value = '';
        } else {
          input.value = editor.root.innerHTML;
        }
      }
    });
  }

  // Setup image uploader module
  function setupImageUploader(serverUrl, fieldName) {
    return {
      upload: function(file) {
        return new Promise(function(resolve, reject) {
          const formData = new FormData();
          formData.append(fieldName || 'file_upload', file);

          const csrfToken = document.querySelector('meta[name="csrf-token"]');
          const headers = {};

          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken.getAttribute('content');
          }

          fetch(serverUrl, {
            method: 'POST',
            body: formData,
            headers: headers
          })
          .then(function(response) { return response.json(); })
          .then(function(result) {
            if (!result.url) {
              reject('Upload failed');
              return;
            }
            resolve(result.url);
          })
          .catch(function(error) {
            reject('Upload failed');
            console.error('Error:', error);
          });
        });
      }
    };
  }

  // Public API
  window.getQuillEditors = function() {
    const editors = document.querySelectorAll('[data-aa-quill-editor]');
    const list = [];
    editors.forEach(function(editor) {
      if (editor._quillEditor) {
        list.push(editor._quillEditor);
      }
    });
    return list;
  };

  window.getQuillEditorByIndex = function(index) {
    const editors = document.querySelectorAll('[data-aa-quill-editor]');
    return (index >= 0 && index < editors.length) ? editors[index]._quillEditor : null;
  };

  window.getQuillEditorByElementId = function(id) {
    const editor = document.querySelector('[data-aa-quill-editor]#' + id);
    return editor ? editor._quillEditor : null;
  };

  // Initialize on various events
  function setupAutoInit() {
    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initQuillEditors);
    } else {
      initQuillEditors();
    }

    // Support for Turbo
    document.addEventListener('turbo:load', initQuillEditors);
    document.addEventListener('turbo:render', initQuillEditors);

    // Support for Turbolinks
    document.addEventListener('turbolinks:load', initQuillEditors);

    // Support for ActiveAdmin has_many fields
    // ActiveAdmin 4 uses .has-many-add button click
    document.addEventListener('click', function(event) {
      if (event.target.closest('.has-many-add')) {
        // Wait for DOM to be updated with new fields
        setTimeout(function() {
          const newEditors = document.querySelectorAll('[data-aa-quill-editor]:not(.quill-editor--active)');
          newEditors.forEach(initQuillEditor);
          setupFormSubmission();
        }, 10);
      }
    });
  }

  // Export the main initialization function
  const QuillEditor = {
    init: setupAutoInit,
    initEditor: initQuillEditor,
    initEditors: initQuillEditors,
    getEditors: window.getQuillEditors,
    getEditorByIndex: window.getQuillEditorByIndex,
    getEditorByElementId: window.getQuillEditorByElementId
  };

  // Make available globally
  window.QuillEditor = QuillEditor;

  // Don't auto-initialize when used as a module - let the importing code decide
  // This allows the importing module to ensure Quill is loaded first

  // Export for module usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuillEditor;
  }
})();