$(document).ready(function () {
    // enter en search header
    $('#buscar').on('keypress', function(e) {
        if(e.which === 13) {
            e.preventDefault();
            const textoBusqueda = $(this).val().trim();
            if (textoBusqueda) {
                window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
            }
        }
    });
    
    // click lupa: mostrar/ocultar search
    $('#lupa-blanca, #lupa-negra').on('click', function(e) {
        const textoBusqueda = $('#buscar').val().trim();
        if (textoBusqueda) {
            e.preventDefault();
            window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
        } else {
            $('#capa-buscador').fadeIn();
        }
    });
    
    $('#equis').on('click', function() {
        $('#capa-buscador').fadeOut();
    });
    
    // buscar en buscador expandido
    function realizarBusquedaExpandido() {
        const textoBusqueda = $('#buscador').val().trim();
        if (textoBusqueda) {
            window.location.href = "../index.html?search=" + encodeURIComponent(textoBusqueda);
        }
    }
    
    // enter en input buscador expandido
    $('#buscador').on('keypress', function(e) {
        if(e.which === 13) { // Tecla Enter
            e.preventDefault();
            realizarBusquedaExpandido();
        }
    });
    // click lupa negra buscador expandido
    $('#lupa-negra-buscador').parent().on('click', function(e) {
        e.preventDefault();
        realizarBusquedaExpandido();
        // Cerrar la capa de búsqueda
        $('#capa-buscador').fadeOut();
    });
    
    // click en tag sugerido
    $('#tags li').on('click', function() {
        const tag = $(this).text();
        // Redirigir al index con el parámetro de búsqueda
        window.location.href = "../index.html?search=" + encodeURIComponent(tag);
        // Cerrar la capa de búsqueda
        $('#capa-buscador').fadeOut();
    });
    
    // click en menu principal
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
