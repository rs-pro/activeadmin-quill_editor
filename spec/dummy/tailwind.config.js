const execSync = require('child_process').execSync;
const activeAdminPath = execSync('bundle show activeadmin', { encoding: 'utf-8' }).trim();

module.exports = {
  content: [
    `${activeAdminPath}/vendor/javascript/flowbite.js`,
    `${activeAdminPath}/plugin.js`,
    `${activeAdminPath}/app/views/**/*.{arb,erb,html,rb}`,
    './app/admin/**/*.{arb,erb,html,rb}',
    './app/views/active_admin/**/*.{arb,erb,html,rb}',
    './app/views/admin/**/*.{arb,erb,html,rb}',
    './app/javascript/**/*.js',
    // Quill editor gem files
    '../../lib/**/*.rb',
    '../../app/**/*.rb'
  ],
  darkMode: "class",
  plugins: [
    require('@activeadmin/activeadmin/plugin')
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    }
  },
  // CRITICAL: Safelist for ActiveAdmin 4 dynamic classes
  safelist: [
    // Grid and layout
    'grid', 'gap-4', 'gap-6', 'lg:grid-cols-3', 'md:grid-cols-2',
    'col-span-2', 'col-span-3', 'lg:col-span-2', 'lg:col-span-1',
    // Flexbox
    'flex', 'inline-flex', 'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap',
    'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
    'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
    // Spacing
    'space-x-4', 'space-y-4', 'space-x-2', 'space-y-2',
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8',
    'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8',
    'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8',
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8',
    'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6', 'mx-8', 'mx-auto',
    'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8', 'my-auto',
    'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8',
    'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8',
    'ml-0', 'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-auto',
    'mr-0', 'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-auto',
    // Display
    'block', 'inline-block', 'inline', 'hidden', 'table', 'table-cell', 'table-row',
    'lg:block', 'lg:inline-block', 'lg:hidden', 'lg:flex',
    'md:block', 'md:inline-block', 'md:hidden', 'md:flex',
    'sm:block', 'sm:inline-block', 'sm:hidden', 'sm:flex',
    // Width/Height
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-64', 'w-96',
    'h-full', 'h-screen', 'h-auto', 'h-12', 'h-16', 'h-32', 'h-64',
    'min-h-screen', 'min-h-full', 'max-w-7xl', 'max-w-full',
    // Typography
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-left', 'text-center', 'text-right', 'text-justify',
    'uppercase', 'lowercase', 'capitalize', 'normal-case',
    'italic', 'not-italic',
    'leading-none', 'leading-tight', 'leading-normal', 'leading-loose',
    // Colors (for dynamic theme)
    'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400',
    'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300',
    'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'bg-transparent',
    'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400',
    'border-gray-500', 'border-gray-600', 'border-gray-700', 'border-gray-800',
    // Dark mode
    'dark:bg-gray-700', 'dark:bg-gray-800', 'dark:bg-gray-900',
    'dark:text-gray-50', 'dark:text-gray-100', 'dark:text-gray-200', 'dark:text-gray-300', 'dark:text-gray-400',
    'dark:text-white',
    'dark:border-gray-600', 'dark:border-gray-700', 'dark:border-gray-800',
    // Borders and Rounding
    'border', 'border-0', 'border-2', 'border-4', 'border-8',
    'border-t', 'border-b', 'border-l', 'border-r',
    'border-t-0', 'border-b-0', 'border-l-0', 'border-r-0',
    'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r',
    'rounded-t-md', 'rounded-b-md', 'rounded-l-md', 'rounded-r-md',
    // Shadows
    'shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    // Overflow
    'overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll',
    'overflow-x-auto', 'overflow-x-hidden', 'overflow-x-visible', 'overflow-x-scroll',
    'overflow-y-auto', 'overflow-y-hidden', 'overflow-y-visible', 'overflow-y-scroll',
    // Position
    'static', 'fixed', 'absolute', 'relative', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0',
    'inset-0', 'inset-x-0', 'inset-y-0',
    // Z-index
    'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto',
    // Opacity
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    // Cursor
    'cursor-auto', 'cursor-pointer', 'cursor-not-allowed', 'cursor-wait',
    // Forms
    'form-input', 'form-select', 'form-checkbox', 'form-radio',
    // Tables
    'table-auto', 'table-fixed', 'border-collapse', 'border-separate',
    // Transitions
    'transition', 'transition-all', 'transition-colors', 'transition-opacity',
    'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300',
    'ease-in', 'ease-out', 'ease-in-out', 'ease-linear',
    // Transform
    'transform', 'transform-none',
    'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110',
    // Visibility
    'visible', 'invisible',
    // Quill specific classes
    'ql-toolbar', 'ql-container', 'ql-editor', 'quill-editor',
    'ql-snow', 'ql-bubble'
  ]
};