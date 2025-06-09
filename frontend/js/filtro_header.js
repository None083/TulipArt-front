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
    $('#lupa-blanca, #lupa-negra').on('click', function(e) {
        // Si hay texto en el buscador de la barra de navegación, redirigir con búsqueda
        const textoBusqueda = $('#buscar').val().trim();
        if (textoBusqueda) {
            e.preventDefault();
            window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
        } else {
            // Si no hay texto, mostrar el buscador expandido
            $('#capa-buscador').fadeIn();
        }
    });
    
    $('#equis').on('click', function() {
        $('#capa-buscador').fadeOut();
    });
    
    // Función para realizar búsqueda desde el buscador expandido
    function realizarBusquedaExpandido() {
        const textoBusqueda = $('#buscador').val().trim();
        if (textoBusqueda) {
            window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
        }
    }
    
    // Agregar evento para la búsqueda en el input del buscador expandido
    $('#buscador').on('keypress', function(e) {
        if(e.which === 13) { // Tecla Enter
            e.preventDefault();
            realizarBusquedaExpandido();
        }
    });
      // Agregar evento para el botón de búsqueda del buscador expandido
    $('#lupa-negra-buscador').parent().on('click', function(e) {
        e.preventDefault();
        realizarBusquedaExpandido();
        // Cerrar la capa de búsqueda
        $('#capa-buscador').fadeOut();
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
