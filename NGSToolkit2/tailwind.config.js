/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tic': '#1c919e',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}

