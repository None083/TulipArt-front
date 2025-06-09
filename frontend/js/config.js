// Configuración global para el frontend
const appConfig = {
    apiBaseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost/TulipArt/backend/servicios_rest_protect'
        : 'https://tulipart-production.up.railway.app',
    getApiUrl: function(endpoint) {
        return this.apiBaseUrl + endpoint;
    }
};
