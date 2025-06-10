$(document).ready(function () {    
    // Inicio header
    $(window).on('resize', function () {
        $("ul#menu-desplegado").fadeOut();
        $("ul#menu-iconos-adicional").fadeOut();
        $('nav.menu-post').fadeOut();
        $("nav#capa-buscador").fadeOut();
        $("nav#caja-alertas").fadeOut();
    });    
    
    $(window).on('scroll', function () {
        var scroll = $(window).scrollTop();
        if (scroll > 0) {
            $('header.fixed').stop().animate({ opacity: 0.8 }, 500);
            $("ul#menu-desplegado").fadeOut(1);
            $('nav.menu-post').fadeOut();
            $("ul#menu-iconos-adicional").fadeOut(1);
            $("nav#capa-buscador").fadeOut();
            $("nav#caja-alertas").fadeOut(1);
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
        "click", function (e) {
            e.stopPropagation();
            $("ul#menu-desplegado").slideToggle(300);
        }
    );

    $("ul#menu-desplegado").on('click', function(e) {
        e.stopPropagation();
    });

    $("img#menu-albondigas").on(
        "click", function (e) {
            e.stopPropagation();
            $("ul#menu-iconos-adicional").slideToggle(300);
        }
    );

    $("ul#menu-iconos-adicional").on('click', function(e) {
        e.stopPropagation();
    });

    $("nav#menu-iconos>a#profile, nav#menu-iconos>a#messages-header, nav#menu-iconos>div#contenedor-alerts>a#alerts-header, nav#menu-iconos>a#submit-header").on({
        mouseenter: function () {
            $(this).children("span").stop().animate({ color: '#b3cfcd' }, 400);
        },
        mouseleave: function () {
            $(this).children("span").stop().animate({ color: '#E1DBD5' }, 400);
        }
    });

    $("div#search>img#lupa-blanca").on(
        "click", function (e) {
            e.stopPropagation();
            $("nav#capa-buscador").fadeToggle();
        }
    );

    // Prevenir que el clic dentro del buscador lo cierre
    $("nav#capa-buscador").on('click', function(e) {
        e.stopPropagation();
    });

    $("nav#capa-buscador>img#equis").on(
        "click", function () {
            $("nav#capa-buscador").fadeOut();
        }
    );

    // Fin header    

    // Control del menú de alertas
    $("a#alerts-header").on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var alertButton = $(this);
        var alertMenu = $("nav#caja-alertas");
        alertMenu.fadeToggle(300);
        $("ul#menu-desplegado").fadeOut();
        $("ul#menu-iconos-adicional").fadeOut();
        $("nav#capa-buscador").fadeOut();
    });

    $("nav#caja-alertas").on('click', function(e) {
        e.stopPropagation();
    });
    
    // cerrar los menús al hacer clic fuera
    $(document).on('click', function() {
        $("ul#menu-desplegado").fadeOut(300);
        $("ul#menu-iconos-adicional").fadeOut(300);
        $("nav#caja-alertas").fadeOut(300);
        $("nav#capa-buscador").fadeOut(300);
    });

    $("span#foryou").click(function () {
        $(this).addClass("borderbottom");
        $("#following").removeClass("borderbottom");
    });

    $("span#following").click(function () {
        $(this).addClass("borderbottom");
        $("#foryou").removeClass("borderbottom");
    });

    // hover imagenes del index y profile, modo escritorio
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

            // ocultar elementos en modo escritorio
            $("article.post").children("div.capa-post, div.post-info, ul.icons-post").stop().hide();
        } else {
            // modo móvil
            $("article.post").off("mouseenter mouseleave");

            // mostrar los elementos permanente en modo móvil
            $("main#index>section#galery-index>article.post").children("div.post-info, ul.icons-post").stop().css("display", "flex").show();
        }
    }).resize();

    // desplegar mini-menu post escritorio
    $(document).on("click", "img.icon-albondiga", function () {
        $(this).closest('article').children('nav.menu-post').fadeToggle(200);
    });

    // volver arriba
    $('img#volver-arriba').on("click", function () {
        $('html, body').animate({
            scrollTop: 0
        }, 400);
    });

    // cerrar vídeo
    $("div#video-promo>img").on(
        "click", function () {
            $("div#video-promo").fadeOut(200);
        }
    );

    // cerrar banner loguearse
    $("div#joinOrLogin>img#equisjoin").on(
        "click", function () {
            $("div#joinOrLogin").fadeOut(200);
        }
    );

    // aceptar cookies
    $("span.btn-cookies").on(
        "click", function () {
            $("div#accept-conditions").fadeOut(200);
        }
    );
})

function efectoLikeIndex(img, darLike) {
    if (darLike) {
        img.fadeOut(400, function () {
            img.attr('src', "imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else {
        img.fadeOut(400, function () {
            img.attr('src', "imagenes/icons/Favorite.svg");
            img.fadeIn(400);
        });
    }
}

function efectoLikeProfile(img, darLike) {
    if (darLike) {
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else {
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

function efectoLikePost(img, darLike) {
    if (darLike) {
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Heart.svg");
            img.fadeIn(400);
        });
    } else {
        img.fadeOut(400, function () {
            img.attr('src', "../imagenes/icons/Favorite.svg");
            img.fadeIn(400);
        });
    }
}