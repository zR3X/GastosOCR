/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-emerald-100', 'text-emerald-700', 'border-emerald-200', 'bg-emerald-500',
    'bg-blue-100', 'text-blue-700', 'border-blue-200', 'bg-blue-500',
    'bg-red-100', 'text-red-700', 'border-red-200', 'bg-red-500',
    'bg-violet-100', 'text-violet-700', 'border-violet-200', 'bg-violet-500',
    'bg-amber-100', 'text-amber-700', 'border-amber-200', 'bg-amber-500',
    'bg-pink-100', 'text-pink-700', 'border-pink-200', 'bg-pink-500',
    'bg-indigo-100', 'text-indigo-700', 'border-indigo-200', 'bg-indigo-500',
    'bg-gray-100', 'text-gray-700', 'border-gray-200', 'bg-gray-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
