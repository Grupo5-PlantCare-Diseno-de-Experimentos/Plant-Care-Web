import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import App from "./App.vue";
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css'
import './style.css'
import router from './router';
import { createPinia } from 'pinia';
import { i18n } from './i18n';

// Crear la app
const app = createApp(App);

// Configurar PrimeVue
app.use(PrimeVue, {
    theme: {
        preset: Aura,
    },
});

// Servicios globales
app.use(ToastService);
app.use(ConfirmationService);

// Configurar Pinia
const pinia = createPinia();
app.use(pinia);

// Configurar i18n
app.use(i18n);

// Usar router (registramos pero no montamos aún)
app.use(router);

// Inicializar store de autenticación y montar app
import { useAuthStore } from './auth/store/authStore';

const init = async () => {
    const authStore = useAuthStore(pinia);
    try {
        await authStore.initialize();
    } catch (e) {
        console.warn('No se pudo inicializar el store de autenticación', e);
    }
    app.mount('#app');
};

init();
