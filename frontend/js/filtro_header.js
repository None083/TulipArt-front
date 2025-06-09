// Funcionalidades de filtrado y búsqueda para las páginas interiores
$(document).ready(function () {
    // Agregar evento para la búsqueda en el input de la barra de navegación
    $('#buscar').on('keypress', function(e) {
        if(e.which === 13) { // Tecla Enter
            e.preventDefault();
            const textoBusqueda = $(this).val().trim();
            if (textoBusqueda) {
                // Redirigir al index con el parámetro de búsqueda
                window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
            }
        }
    });
    
    // Evento para mostrar/ocultar capa de búsqueda
    $('#lupa-blanca, #lupa-negra').on('click', function() {
        $('#capa-buscador').fadeIn();
    });
    
    $('#equis').on('click', function() {
        $('#capa-buscador').fadeOut();
    });
      // Agregar evento para la búsqueda en el input del buscador expandido
    $('#buscador').on('keypress', function(e) {
        if(e.which === 13) { // Tecla Enter
            e.preventDefault();
            const textoBusqueda = $(this).val().trim();
            if (textoBusqueda) {
                // Redirigir al index con el parámetro de búsqueda
                window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
                // Cerrar la capa de búsqueda
                $('#capa-buscador').fadeOut();
            }
        }
    });
    
    // Evento para las etiquetas sugeridas
    $('#tags li').on('click', function() {
        const tag = $(this).text();
        // Redirigir al index con el parámetro de búsqueda
        window.location.href = "../index.html?search=" + encodeURIComponent(tag);
        // Cerrar la capa de búsqueda
        $('#capa-buscador').fadeOut();
    });
    
    // Configurar eventos para los elementos del menú principal
    $('nav#menu-principal ul#menu-desplegado li a').on('click', function(e) {
        const seccion = $(this).text().toLowerCase();
        if (seccion === 'home') {
            e.preventDefault();
            window.location.href = "../index.html";
        } else if (seccion === 'new') {
            e.preventDefault();
            window.location.href = "../index.html?filtro=new";
        } else if (seccion === 'trending') {
            e.preventDefault();
            window.location.href = "../index.html?filtro=trending";
        } else if (seccion === 'for you') {
            e.preventDefault();
            window.location.href = "../index.html?filtro=foryou";
        } else if (seccion === 'following') {
            e.preventDefault();
            if (localStorage.token) {
                window.location.href = "../index.html?filtro=following";
            } else {
                window.location.href = "login.html";
            }
        }
    });
});
