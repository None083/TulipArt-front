$(document).ready(function () {    // Inicio header
    $(window).on('resize', function () {
        $("ul#menu-desplegado").fadeOut();
        $("ul#menu-iconos-adicional").fadeOut();
        $('nav.menu-post').fadeOut();
        $("nav#capa-buscador").fadeOut();
        $("nav#caja-alertas").fadeOut(); // Cerrar también el menú de alertas
    });    $(window).on('scroll', function () {
        var scroll = $(window).scrollTop();
        if (scroll > 0) {
            $('header.fixed').stop().animate({ opacity: 0.8 }, 500);
            $("ul#menu-desplegado").fadeOut(1);
            $('nav.menu-post').fadeOut();
            $("ul#menu-iconos-adicional").fadeOut(1);
            $("nav#capa-buscador").fadeOut();
            $("nav#caja-alertas").fadeOut(1); // Cerrar el menú de alertas al hacer scroll
        } else {
            $('header.fixed').stop().animate({ opacity: 1 }, 500);
        }
    });

    $(window).on('scroll', function () {
        var scroll = $(window).scrollTop();
        if (scroll > 200) {
            $('img#volver-arriba').stop().fadeIn();
        } else {
            $('img#volver-arriba').stop().fadeOut();
        }
    });

    $("img#menu-hamb").on(
        "click", function () {
            $("ul#menu-desplegado").slideToggle(300);
        }
    );

    $("img#menu-albondigas").on(
        "click", function () {
            $("ul#menu-iconos-adicional").slideToggle(300);
        }
    );

    $("nav#menu-iconos>a#profile, nav#menu-iconos>a#messages-header, nav#menu-iconos>div#contenedor-alerts>a#alerts-header, nav#menu-iconos>a#submit-header").on({
        mouseenter: function () {
            $(this).children("span").stop().animate({ color: '#b3cfcd' }, 400);
        },
        mouseleave: function () {
            $(this).children("span").stop().animate({ color: '#E1DBD5' }, 400);
        }
    });

    $("div#search>img#lupa-blanca").on(
        "click", function () {
            $("nav#capa-buscador").fadeToggle();
        }
    );

    $("nav#capa-buscador>img#equis").on(
        "click", function () {
            $("nav#capa-buscador").fadeOut();
        }
    );

    // Fin header    // Control del menú de alertas
    $("a#alerts-header").on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevenir que el evento se propague
        
        // Ajustar la posición del menú de alertas según el tamaño de la ventana
        var alertButton = $(this);
        var alertMenu = $("nav#caja-alertas");
        
        // Toggle del menú de alertas
        alertMenu.fadeToggle(300);
        
        // Cerrar otros menús abiertos
        $("ul#menu-desplegado").fadeOut();
        $("ul#menu-iconos-adicional").fadeOut();
        $("nav#capa-buscador").fadeOut();
    });
    
    // Prevenir que el clic dentro del menú de alertas lo cierre
    $("nav#caja-alertas").on('click', function(e) {
        e.stopPropagation();
    });
    
    // Cerrar el menú de alertas al hacer clic en cualquier otra parte
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#contenedor-alerts').length) {
            $("nav#caja-alertas").fadeOut(300);
        }
    });

    $("span#foryou").click(function () {
        $(this).addClass("borderbottom");
        $("#following").removeClass("borderbottom");
    });

    $("span#following").click(function () {
        $(this).addClass("borderbottom");
        $("#foryou").removeClass("borderbottom");
    });

    // Hover sobre imagenes del index y profile, modo escritorio
    $(window).resize(function () {
        if ($(window).width() > 1024) {
            // Modo escritorio
            $("article.post").on({
                mouseenter: function () {
                    $(this).children("div.capa-post").stop().fadeIn();
                    $(this).children("div.post-info, ul.icons-post").stop().css("display", "flex").fadeIn();
                },
                mouseleave: function () {
                    $(this).children("div.capa-post").stop().fadeOut();
                    $(this).children("div.post-info, ul.icons-post").stop().fadeOut();
                    $(this).children("nav.menu-post").stop().fadeOut();
                }
            });

            // Ocultar los elementos al cambiar a modo escritorio
            $("article.post").children("div.capa-post, div.post-info, ul.icons-post").stop().hide();
        } else {
            // Modo móvil
            $("article.post").off("mouseenter mouseleave");

            // Mostrar los elementos de forma permanente en modo móvil
            $("main#index>section#galery-index>article.post").children("div.post-info, ul.icons-post").stop().css("display", "flex").show();
        }
    }).resize();

    // Desplegar mini-menu de post en escritorio
    $(document).on("click", "img.icon-albondiga", function () {
        $(this).closest('article').children('nav.menu-post').fadeToggle(200);
    });

    // Botón de volver arriba
    $('img#volver-arriba').on("click", function () {
        $('html, body').animate({
            scrollTop: 0
        }, 400);
    });

    // Cerrar el vídeo de promo en index
    $("div#video-promo>img").on(
        "click", function () {
            $("div#video-promo").fadeOut(200);
        }
    );

    // Cerrar el banner de loguearse en index
    $("div#joinOrLogin>img#equisjoin").on(
        "click", function () {
            $("div#joinOrLogin").fadeOut(200);
        }
    );

    // Aceptar las cookies en la página de cookies
    $("span.btn-cookies").on(
        "click", function () {
            $("div#accept-conditions").fadeOut(200);
        }
    );
})

function efectoLikeIndex(img, darLike) {
    if (darLike) { // Dar like (cambiar a corazón lleno)
        img.fadeOut(400, function () {
            img.attr('src', "imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else { // Quitar like (cambiar a corazón vacío)
        img.fadeOut(400, function () {
            img.attr('src', "imagenes/icons/Favorite.svg");
            img.fadeIn(400);
        });
    }
}

// Función para cambiar visualmente el icono de like (profile)
function efectoLikeProfile(img, darLike) {
    if (darLike) { // Dar like (cambiar a corazón lleno)
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else { // Quitar like (cambiar a corazón vacío)
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Favorite.svg");
            img.fadeIn(400);
        });
    }
}

function efectoFollowIndex(boton, seguir) {
    boton.fadeOut(function () {
        if (seguir) {
            boton.css({
                "color": "orange",
                "border-color": "orange"
            }).text("Following").fadeIn();
        } else {
            boton.css({
                "color": "#2A2121",
                "border-color": "#2A2121"
            }).text("Follow").fadeIn();
        }
    });
}

function efectoFollowProfile(boton, seguir) {
    boton.fadeOut(function () {
        if (seguir) {
            boton.css({
                "color": "orange",
                "border-color": "orange"
            }).text("Following").fadeIn();
        } else {
            boton.css({
                "color": "#2A2121",
                "border-color": "#2A2121"
            }).text("Follow").fadeIn();
        }
    });
}

// Función para cambiar visualmente el icono de like (página post)
function efectoLikePost(img, darLike) {
    if (darLike) { // Dar like (cambiar a corazón lleno)
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else { // Quitar like (cambiar a corazón vacío)
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Favorite.svg");
            img.fadeIn(400);
        });
    }
}