// Configuración global para el frontend
const appConfig = {
    apiBaseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost/TulipArt/backend/servicios_rest_protect'
        : '/backend/servicios_rest_protect',
    getApiUrl: function(endpoint) {
        return this.apiBaseUrl + endpoint;
    }
};
