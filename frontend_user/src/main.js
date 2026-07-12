import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import socketService from './services/socketService';
import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Si une session existe deja (rechargement de page), on reconnecte le
// socket pour continuer a recevoir les notifications en temps reel.
socketService.connecterSocket();

app.mount('#app');
