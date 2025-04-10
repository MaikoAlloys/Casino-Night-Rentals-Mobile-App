
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // Import the router


// Create the app, use the router, and mount to the #app div in your index.html
createApp(App)
  .use(router)  // Use the router in your app
  .mount('#app');
