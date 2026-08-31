// // import { defineConfig } from 'vite';
// // import react from '@vitejs/plugin-react';
// // import tailwindcss from '@tailwindcss/vite'
// // export default defineConfig({
// //   plugins: [react(),tailwindcss(),],

// //   server: {
// //     proxy: {
// //       '/api': {
// //         target: 'http://127.0.0.1:8000',
// //         changeOrigin: true,
// //         secure: false,
// //       },
// //     },
// //   },
// // });

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [react(),tailwindcss(),],

//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cesium(),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})