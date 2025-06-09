// Usa la configuración global para la API
// Requiere que config.js esté incluido antes
const DIR_API = (typeof appConfig !== 'undefined' ? appConfig.apiBaseUrl : '/backend/servicios_rest_protect');

$(document).ready(function () {
    $('.no-logged').on('click', function (e) {
        if (!localStorage.token) {
            e.preventDefault();
            window.location.href = "paginas/login.html";
        }
    });

    $('#logout').on('click', function (e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });

    $('#logout-page').on('click', function (e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "../index.html";
    });

    if (localStorage.token) {
        $('#joinOrLogin').hide();
    }

    $('#profile, #profile-header').on('click', function (e) {
        if (!localStorage.token) {
            e.preventDefault();
            const loginPath = window.location.pathname.includes('paginas/') ? "login.html" : "paginas/login.html";
            window.location.href = loginPath;
        } else {
            // Asegurar que lleve al perfil del usuario logueado usando solo el ID
            const idUsu = localStorage.getItem('idUsu');
            const profilePath = window.location.pathname.includes('paginas/') ?
                `profile.html?id=${idUsu}` :
                `paginas/profile.html?id=${idUsu}`;

            e.preventDefault();
            window.location.href = profilePath;
        }
    });

});

// Index

async function cargar_obras() {
    try {
        const response = await $.ajax({
            url: DIR_API + "/obras",
            type: "GET",
            dataType: "json"
        });
        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
        } else {
            const idUsu = localStorage.getItem('idUsu');
            let html_obras = "";
            for (const tupla of response.obras) {

                // Obtener las fotos de la obra
                const fotos = await obtener_fotos_obra(tupla["idObra"]);
                const primeraFoto = fotos.length > 0 ? fotos[0]["foto"] : "imagenes/arte/default.webp"; // Usar una imagen por defecto si no hay fotos

                // Esperar a que se cargue la imagen y determinar la clase
                const classArticle = await determinarClaseImagen('../backend/images/obras/' + primeraFoto);

                // Obtener los datos del usuario dueño de la obra
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // Nombre del usuario o valor por defecto
                const iconoUsuario = usuario.fotoPerfil ? "../backend/images/profilePics/" + usuario.fotoPerfil : "../backend/images/profilePics/no_image.jpg"; // Icono del usuario o valor por defecto

                // Obtener número de likes obra
                const likes = await obtener_likes_obra(tupla["idObra"]);
                const numLikes = likes.length; // Número de likes de la obra

                // Verificar si el usuario actual ya dio like a esta obra
                const yaDioLike = idUsu ? likes.some(like => like.idUsuLike == idUsu) : false;
                const iconoLike = yaDioLike ? "imagenes/icons/Heart.svg" : "imagenes/icons/Favorite.svg";

                // Verificar si el usuario actual sigue al autor
                const yaSigue = idUsu ? await verificar_siguiendo(idUsu, tupla["idUsu"]) : false;
                const textoBotonSeguir = yaSigue ? "Following" : "Follow";
                const estilosBotonSeguir = yaSigue ?
                    'style="color: orange; border-color: orange;"' :
                    '';

                // Obtener número de comentarios obra
                const comentarios = await obtener_comentarios_obra(tupla["idObra"]);
                const numComentarios = comentarios.length; // Número de comentarios de la obra


                html_obras += "<article class='post " + classArticle + "' data-idobra='" + tupla["idObra"] + "'><div class='capa-post'>"; // clase wide o vacía
                html_obras += "</div><nav class='menu-post'><div class='pico-bocadillo'></div><div class='content'>";
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>"; //enlace perfil usuario autor *
                html_obras += "<img src='imagenes/icons/user.svg' alt='pico bocadillo menu'><span>Profile</span></a><a href='#'><img src='imagenes/icons/share-2.svg' alt='pico bocadillo menu'><span>Share</span></a><a href='#'><img src='imagenes/icons/alert-circle.svg' alt='pico bocadillo menu'><span>Report</span></a></div></nav><div class='post-info'>";
                html_obras += `<a href='paginas/profile.html?id=${tupla["idUsu"]}'>`; //enlace perfil usuario autor *
                html_obras += `<img class='profile-pic' src='${iconoUsuario}' alt='Icon user ${nombreUsuario}'></a>`;// icono usuario
                html_obras += "<div class='titulo-user'>";
                html_obras += `<a id='enlace-post-index' href='paginas/post.html?id=${tupla["idObra"]}'>`;//enlace post
                html_obras += `<span class='titulo-obra'>${tupla["nombreObra"]}</span></a>`;//titulo obra
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>";//enlace perfil usuario
                html_obras += `<span class='nombre-user'>By ${nombreUsuario}</span></a></div>`;//nombre usuario
                // Solo mostrar el botón seguir si el usuario logueado NO es el autor
                if (idUsu && String(idUsu) !== String(tupla["idUsu"])) {
                    html_obras += `<span class='boton-seguir' data-idautor='${tupla["idUsu"]}' ${estilosBotonSeguir}>${textoBotonSeguir}</span>`; //boton seguir
                }
                html_obras += "<img class='icon-albondiga' src='imagenes/icons/MenuVertical.svg' alt='menu-post'></div>";
                html_obras += `<picture class='obra-arte'><img src='../backend/images/obras/${primeraFoto}' alt='Obra de arte'></picture>`; // Primera foto de la obra
                html_obras += `<ul class='icons-post'><li><img id='btn-like-index' class='btn-like' src='${iconoLike}' alt='Icon like'><span class='num-likes'>${numLikes}</span></li>`; //dar like
                html_obras += "<li><img src='imagenes/icons/message-circle.svg' alt='Icon message post'><span id='num-comments'>" + numComentarios + "</span></li></ul></article>"; //comentar *
            }
            $('#galery-index').html(html_obras);
            $(window).trigger('resize');
        }
    } catch (error) {
        $('#errores').html("Error al cargar las obras.");
        $('#principal').html("");
        localStorage.clear();
    }
}

async function cargar_obras_filtradas(filtro = "", valor = "", ordenar = "", pagina = 1) {
    try {
        let url = DIR_API + "/obras";
        let params = {};

        // Añadimos los parámetros de filtrado si existen
        if (filtro) params.filtro = filtro;
        if (valor) params.valor = valor;
        if (ordenar) params.ordenar = ordenar;
        if (pagina > 1) params.pagina = pagina;

        const response = await $.ajax({
            url: url,
            type: "GET",
            data: params,
            dataType: "json"
        });
        if (response.error) {
            $('#errores').html("Error al cargar las obras: " + response.error);
            $('#galery-index').html("");
            return false;
        } else {
            // Procesar cada obra y agregarla a la galería
            const obras = response.obras;
            if (obras.length === 0) {
                $('#galery-index').html("<p class='no-results'>No artworks matching your search were found.</p>");
                return false;
            }

            const idUsu = localStorage.getItem('idUsu');
            let html_obras = "";

            // Limpiar la galería si estamos en la página 1
            if (pagina === 1) {
                $('#galery-index').html("");
            }

            for (const tupla of obras) {
                // Obtener las fotos de la obra
                const fotos = await obtener_fotos_obra(tupla["idObra"]);
                const primeraFoto = fotos.length > 0 ? fotos[0]["foto"] : "imagenes/arte/default.webp"; // Usar una imagen por defecto si no hay fotos

                // Esperar a que se cargue la imagen y determinar la clase
                const classArticle = await determinarClaseImagen('../backend/images/obras/' + primeraFoto);

                // Obtener los datos del usuario dueño de la obra
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // Nombre del usuario o valor por defecto
                const iconoUsuario = usuario.fotoPerfil ? "../backend/images/profilePics/" + usuario.fotoPerfil : "../backend/images/profilePics/no_image.jpg"; // Icono del usuario o valor por defecto

                // Obtener número de likes obra
                const likes = await obtener_likes_obra(tupla["idObra"]);
                const numLikes = likes.length; // Número de likes de la obra

                // Verificar si el usuario actual ya dio like a esta obra
                const yaDioLike = idUsu ? likes.some(like => like.idUsuLike == idUsu) : false;
                const iconoLike = yaDioLike ? "imagenes/icons/Heart.svg" : "imagenes/icons/Favorite.svg";

                // Verificar si el usuario actual sigue al autor
                const yaSigue = idUsu ? await verificar_siguiendo(idUsu, tupla["idUsu"]) : false;
                const textoBotonSeguir = yaSigue ? "Following" : "Follow";
                const estilosBotonSeguir = yaSigue ?
                    'style="color: orange; border-color: orange;"' :
                    '';

                // Obtener número de comentarios obra
                const comentarios = await obtener_comentarios_obra(tupla["idObra"]);
                const numComentarios = comentarios.length; // Número de comentarios de la obra


                html_obras += "<article class='post " + classArticle + "' data-idobra='" + tupla["idObra"] + "'><div class='capa-post'>"; // clase wide o vacía
                html_obras += "</div><nav class='menu-post'><div class='pico-bocadillo'></div><div class='content'>";
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>"; //enlace perfil usuario autor *
                html_obras += "<img src='imagenes/icons/user.svg' alt='pico bocadillo menu'><span>Profile</span></a><a href='#'><img src='imagenes/icons/share-2.svg' alt='pico bocadillo menu'><span>Share</span></a><a href='#'><img src='imagenes/icons/alert-circle.svg' alt='pico bocadillo menu'><span>Report</span></a></div></nav><div class='post-info'>";
                html_obras += `<a href='paginas/profile.html?id=${tupla["idUsu"]}'>`; //enlace perfil usuario autor *
                html_obras += `<img class='profile-pic' src='${iconoUsuario}' alt='Icon user ${nombreUsuario}'></a>`;// icono usuario
                html_obras += "<div class='titulo-user'>";
                html_obras += `<a id='enlace-post-index' href='paginas/post.html?id=${tupla["idObra"]}'>`;//enlace post
                html_obras += `<span class='titulo-obra'>${tupla["nombreObra"]}</span></a>`;//titulo obra
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>";//enlace perfil usuario
                html_obras += `<span class='nombre-user'>By ${nombreUsuario}</span></a></div>`;//nombre usuario
                // Solo mostrar el botón seguir si el usuario logueado NO es el autor
                if (idUsu && String(idUsu) !== String(tupla["idUsu"])) {
                    html_obras += `<span class='boton-seguir' data-idautor='${tupla["idUsu"]}' ${estilosBotonSeguir}>${textoBotonSeguir}</span>`; //boton seguir
                }
                html_obras += "<img class='icon-albondiga' src='imagenes/icons/MenuVertical.svg' alt='menu-post'></div>";
                html_obras += `<picture class='obra-arte'><img src='../backend/images/obras/${primeraFoto}' alt='Obra de arte ${tupla["nombreObra"]}'></picture>`; // Primera foto de la obra
                html_obras += `<ul class='icons-post'><li><img class='btn-like' data-idobra='${tupla["idObra"]}' src='${iconoLike}' alt='Icon like'><span class='num-likes'>${numLikes}</span></li>`; //dar like
                html_obras += `<li><img src='imagenes/icons/message-circle.svg' alt='Icon message post'><span class='num-comments'>${numComentarios}</span></li></ul></article>`; //comentar *
            }

            $('#galery-index').append(html_obras);            // Agregar botón "Cargar más" si hay más páginas
            if (response.pagina_actual < response.total_paginas) {
                // Asegurarse de que los valores son correctos y están codificados para HTML
                const siguientePagina = parseInt(response.pagina_actual, 10) + 1;
                const filtroSeguro = filtro ? filtro.replace(/"/g, '&quot;') : '';
                const valorSeguro = valor ? valor.replace(/"/g, '&quot;') : '';
                const ordenarSeguro = ordenar ? ordenar.replace(/"/g, '&quot;') : '';

                // Limpiar contenedor antes de agregar el botón
                $('#cargar-mas-container').empty();

                const botonCargarMas = `
                    <div id="cargar-mas" class="cargar-mas-btn" data-pagina="${siguientePagina}" data-filtro="${filtroSeguro}" data-valor="${valorSeguro}" data-ordenar="${ordenarSeguro}">
                        <span>Load more</span>
                    </div>
                `;
                $('#cargar-mas-container').append(botonCargarMas);
            } else {
                // Si no hay más páginas, asegurarse de que no quede ningún botón
                $('#cargar-mas-container').empty();
            }

            $(window).trigger('resize');
            return true;
        }
    } catch (error) {
        $('#errores').html("Error al cargar las obras.");
        $('#galery-index').html("");
        return false;
    }
}

async function cargar_bio_perfil(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/usuario/" + idUsu,
            type: "GET",
            dataType: "json"
        });
        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
        } else {
            let seguidores = (await obtener_seguidores(idUsu)).length;
            let obras = (await obtener_obras_usuario(idUsu)).length;
            // Actualiza los datos del perfil
            $('#profile-photo').attr('src', "../../backend/images/profilePics/" + response.usuario.fotoPerfil);
            $('#profile-name').text(response.usuario.nombre); // O response.usuario.nombre
            $('#username').text('@' + response.usuario.nombreUsuario); // O response.usuario.username

            // About me
            $('#aboutme-info').text(response.usuario.biografia);

            // Números
            $('#follows .numbers').html(seguidores + ' Followers');
            $('#pieces .numbers').html(obras + ' Artworks');
            $('#views .numbers').html('123 Views');
        }
    } catch (error) {
        $('#errores').html("Error al cargar la información del perfil." + idUsu + " cosorro " + error);
        $('#principal').html("");
        localStorage.clear();
    }
}

// Función para determinar la clase según las dimensiones de la imagen
function determinarClaseImagen(urlImagen) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = urlImagen;
        img.onload = function () {
            if (img.width > img.height * 1.5) {
                resolve("wide");
            } else {
                resolve("");
            }
        };
        img.onerror = function () {
            resolve(""); // En caso de error al cargar la imagen
        };
    });
}

// Obtener fotos de una obra consumiendo el servicio /fotos_obra/idObra para usarlo en cargar_obras()
async function obtener_fotos_obra(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/fotos_obra/" + idObra,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return [];
        } else {
            return response.fotos; // Devolver el array de fotos
        }
    } catch (error) {
        $('#errores').html("Error al cargar las fotos de la obra.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

// funcion cosnsumir servicio obtener likes de una obra
async function obtener_likes_obra(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/likes_obra/" + idObra,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return [];
        } else {
            return response.likes_obra; // Devolver el array de likes
        }
    } catch (error) {
        $('#errores').html("Error al cargar los likes de la obra.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

// Alterna el like: si ya existe lo quita, si no existe lo crea
async function toggle_like_obra(idObra, idUsu) {
    try {
        // Obtener los likes actuales de la obra
        const likes = await obtener_likes_obra(idObra);
        // Comprobar si el usuario ya ha dado like a esta obra
        const yaDadoLike = likes.some(like => like.idUsuLike == idUsu);

        if (!yaDadoLike) {
            // Si no ha dado like, lo creamos (POST)
            const response = await $.ajax({
                url: DIR_API + "/dar_like_obra",
                type: "POST",
                data: { idUsu: idUsu, idObra: idObra },
                dataType: "json",
                headers: { Authorization: "Bearer " + localStorage.token }
            });

            if (response.error) {
                $('#errores').html("Error al dar like: " + response.error);
                return false;
            }
        } else {
            // Si ya ha dado like, lo borramos (DELETE)
            const response = await $.ajax({
                url: DIR_API + "/quitar_like_obra/" + idUsu + "/" + idObra,
                type: "DELETE",
                dataType: "json",
                headers: { Authorization: "Bearer " + localStorage.token }
            });

            if (response.error) {
                $('#errores').html("Error al quitar like: " + response.error);
                return false;
            }
        }

        // Devolver el estado actual después de la operación
        return !yaDadoLike; // true si se dio like, false si se quitó
    } catch (error) {
        $('#errores').html("Error al alternar el like");
        return null;
    }
}

// funcion consumir servicio obtener comentarios de una obra
async function obtener_comentarios_obra(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/comentarios_obra/" + idObra,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return [];
        } else {
            return response.comentarios_obra;
        }
    } catch (error) {
        $('#errores').html("Error al cargar los comentarios de la obra.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

// Función para crear un comentario en una obra
async function crear_comentario_obra(idUsu, idObra, textoComentario) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/crear_comentario_obra",
            type: "POST",
            data: {
                idUsu: idUsu,
                idObra: idObra,
                textoComentario: textoComentario
            },
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        return false;
    }
}

//Profile

async function obtener_datos_usuario(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/usuario/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return {}; // Devolver un objeto vacío si hay un error
        } else if (!response.usuario) {
            return {}; // Devolver un objeto vacío si no se encuentra el usuario
        } else {
            return response.usuario; // Devolver el usuario encontrado
        }
    } catch (error) {
        $('#errores').html("Error al cargar los datos del usuario.");
        $('#principal').html("");
        localStorage.clear();
        return {}; // Devolver un objeto vacío en caso de error
    }
}

async function obtener_seguidores(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/seguidores/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return [];
        } else {
            return response.seguidores;
        }
    } catch (error) {
        $('#errores').html("Error al cargar los seguidores.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

async function obtener_obras_usuario(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/obras/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return [];
        } else {
            return response.obras_usuario;
        }
    } catch (error) {
        $('#errores').html("Error al cargar las obras del usuario.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

async function cargar_obras_usuario(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/obras/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
        } else {
            const usuarioActual = localStorage.getItem('idUsu');
            let html_posts = '';
            for (const tupla of response.obras_usuario) {
                // Obtener las fotos de la obra
                const fotos = await obtener_fotos_obra(tupla["idObra"]);
                const primeraFoto = fotos.length > 0 ? fotos[0]["foto"] : "../imagenes/arte/default.webp"; // Usar una imagen por defecto si no hay fotos

                // Obtener los datos del usuario dueño de la obra
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // Nombre del usuario o valor por defecto
                const iconoUsuario = usuario.fotoPerfil ? "../../backend/images/profilePics/" + usuario.fotoPerfil : "../../backend/images/profilePics/no_image.jpg"; // Icono del usuario o valor por defecto

                const likes = await obtener_likes_obra(tupla["idObra"]);
                const numLikes = likes.length;

                // Verificar si el usuario actual ya dio like a esta obra
                const yaDioLike = usuarioActual ? likes.some(like => like.idUsuLike == usuarioActual) : false;
                const iconoLike = yaDioLike ? "../imagenes/icons/Heart.svg" : "../imagenes/icons/Favorite.svg";


                html_posts += `<article class="post" data-idobra="${tupla["idObra"]}">`;
                html_posts += '<div class="capa-post"></div>';
                html_posts += '<div class="post-info">';
                html_posts += '<a href="profile.html?id=' + tupla["idUsu"] + '"><img class="profile-pic" src="' + iconoUsuario + '" alt="Icon user ' + nombreUsuario + '"></a>';
                html_posts += '<div class="titulo-user">';
                html_posts += `<a href="post.html?id=${tupla["idObra"]}"><span class="titulo-obra">${tupla["nombreObra"]}</span></a>`;
                html_posts += '<a href="profile.html?id=' + tupla["idUsu"] + '"><span class="nombre-user">By ' + nombreUsuario + '</span></a>';
                html_posts += '</div>';
                html_posts += '</div>';
                html_posts += `<a id="enlace-post-perfil" href="post.html?id=${tupla["idObra"]}">`;
                html_posts += '<picture class="obra-arte"><img src="../../backend/images/obras/' + primeraFoto + '" alt="Obra de arte ' + tupla["nombreObra"] + '"></picture>';
                html_posts += '</a>';
                html_posts += '<ul class="icons-post">';
                html_posts += `<li><img src="${iconoLike}" alt="Icon like"><span class="num-likes">${numLikes}</span></li>`;
                html_posts += '<li><img src="../imagenes/icons/message-circle.svg" alt="Icon message post"></li>';
                html_posts += '</ul>';
                html_posts += '</article>';

            }
            $('#profile-gallery').html(html_posts);
            $(window).trigger('resize');
        }
    } catch (error) {
        $('#errores').html("Error al cargar los posts del usuario.");
        $('#principal').html("");
        localStorage.clear();
    }
}

// Verificar si un usuario sigue a otro
async function verificar_siguiendo(idUsuSeguidor, idUsuSeguido) {
    try {
        const seguidores = await obtener_seguidores(idUsuSeguido);
        return seguidores.some(seguidor => seguidor.idSeguidor == idUsuSeguidor);
    } catch (error) {
        return false;
    }
}

// Alternar seguir/dejar de seguir
async function toggle_follow(idUsuSeguidor, idUsuSeguido) {
    try {
        // Comprobar si ya sigue al usuario
        const yaSigue = await verificar_siguiendo(idUsuSeguidor, idUsuSeguido);

        if (!yaSigue) {
            // Si no le sigue, seguir
            const response = await $.ajax({
                url: DIR_API + "/seguir_usuario",
                type: "POST",
                data: { idUsuSeguidor: idUsuSeguidor, idUsuSeguido: idUsuSeguido },
                dataType: "json",
                headers: { Authorization: "Bearer " + localStorage.token }
            });

            if (response.error) {
                $('#errores').html("Error al seguir: " + response.error);
                return false;
            }
        } else {
            // Si ya le sigue, dejar de seguir
            const response = await $.ajax({
                url: DIR_API + "/dejar_seguir_usuario/" + idUsuSeguidor + "/" + idUsuSeguido,
                type: "DELETE",
                dataType: "json",
                headers: { Authorization: "Bearer " + localStorage.token }
            });

            if (response.error) {
                $('#errores').html("Error al dejar de seguir: " + response.error);
                return false;
            }
        }

        // Devolver el estado actual después de la operación
        return !yaSigue; // true si empezó a seguir, false si dejó de seguir
    } catch (error) {
        $('#errores').html("Error al alternar seguir/dejar de seguir");
        return null;
    }
}

async function cargar_obra_pagina_post(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/obra/" + idObra,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
            return response;
        } else {
            $('#fecha-obra').text(response.obra.fecPubli);
            $('#title').text(response.obra.nombreObra);
            $('#description').text(response.obra.descObra);

            // Mostrar si es contenido generado por IA o no
            const aiGenerated = response.obra.aiGenerated;
            const aiText = aiGenerated == 1 ? "AI" : "No AI";
            const aiIcon = aiGenerated == 1 ? "ai.png" : "slash.svg";
            $('#ai-info').html(`<img class="delete" src="../imagenes/icons/${aiIcon}" alt="icono">${aiText}`);
            // Obtener el año de publicación de la obra
            const fechaPublicacion = new Date(response.obra.fecPubli);
            const añoPublicacion = fechaPublicacion.getFullYear();

            // Cargar datos del usuario autor
            cargar_usuario_pagina_post(response.obra.idUsu).then(usuario => {
                // Actualizar el título de la sección "More by" con el nombre del autor
                $('aside > span > span#name-author').html(`<a href="profile.html?id=${response.obra.idUsu}">${usuario.nombreUsuario}</a>`);

                // Actualizar el copyright con el nombre del autor y año de publicación
                $('#copy').text(`©${añoPublicacion} ${usuario.nombre}`);
            });

            // Cargar obras del mismo autor en la sección "More by"
            cargar_more_by(response.obra.idUsu, idObra);
            // Cargar y mostrar las etiquetas de la obra
            cargar_etiquetas_post(idObra);

            const idUsu = localStorage.getItem('idUsu');
            if (idUsu == response.obra.idUsu) {
                // Si el usuario actual es el autor de la obra, mostrar el botón de editar
                html_opciones = '<img id="delete-post" class="delete" src="../imagenes/icons/trash-2.svg" alt="icono">';
                html_opciones += '<img id="edit" src="../imagenes/icons/edit.svg" alt="icono"></img>';
                $('div#der').html(html_opciones);
            }

            // Cargar obras relacionadas por etiquetas
            cargar_obras_relacionadas_por_tags(idObra);

            return response;
        }
    } catch (error) {
        $('#errores').html("Error al cargar la información de la obra " + idObra);
        $('#principal').html("");
        localStorage.clear();
        return { error: error.message };
    }
}

async function borrar_obra(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/borrar_obra/" + idObra,
            type: "DELETE",
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            $('#errores').html("Error al borrar la obra: " + response.error);
            return false;
        }
        return true;
    } catch (error) {
        $('#errores').html("Error al borrar la obra");
        return null;
    }
}

async function cargar_usuario_pagina_post(idUsu) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/usuario/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html(response.error);
            $('#principal').html("");
            localStorage.clear();
        } else {
            $('.user-link-post').attr('href', "profile.html?id=" + idUsu);
            $('#user-photo').attr('src', "../../backend/images/profilePics/" + response.usuario.fotoPerfil);
            $('#user-nombre').text(response.usuario.nombreUsuario);
            return response.usuario;
        }
    } catch (error) {
        $('#errores').html("Error al cargar la información del usuario " + idUsu);
        $('#principal').html("");
        localStorage.clear();
    }
}

// Función para cargar obras en la sección "More by" de un autor
async function cargar_more_by(idUsuAutor, idObraActual, contenedor = '#more-by', limite = 8) {
    try {
        // Obtener las obras del usuario
        const response = await $.ajax({
            url: DIR_API + "/obras/" + idUsuAutor,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $(contenedor).html('<p>Error loading artworks by this author</p>');
            return;
        }

        const obras = response.obras_usuario;

        // Limpiar el contenedor
        $(contenedor).empty();

        if (obras && obras.length > 0) {
            // Filtrar la obra actual para no mostrarla
            const obrasFiltradas = obras.filter(obra => obra.idObra != idObraActual);

            // Limitar a máximo 8 obras
            const obrasAMostrar = obrasFiltradas.slice(0, limite);

            if (obrasAMostrar.length === 0) {
                $(contenedor).html('<p>No more artworks by this author</p>');
                return;
            }

            // Para cada obra, mostrar solo la primera imagen
            for (let i = 0; i < obrasAMostrar.length; i++) {
                const obra = obrasAMostrar[i];

                // Obtener la primera foto de la obra
                const fotosResponse = await obtener_fotos_obra(obra.idObra);
                const fotos = fotosResponse || [];
                const primeraFoto = fotos.length > 0
                    ? `../../backend/images/obras/${fotos[0].foto}`
                    : "../imagenes/arte/default.webp";

                // Crear el artículo de la obra
                const articuloObra = `
                    <article class="post">
                        <a href="post.html?id=${obra.idObra}">
                            <picture class="obra-arte">
                                <img src="${primeraFoto}" alt="${obra.nombreObra}">
                            </picture>
                        </a>
                    </article>
                `;

                $(contenedor).append(articuloObra);
            }
        } else {
            $(contenedor).html('<p>No artworks by this author</p>');
        }
    } catch (error) {
        $(contenedor).html('<p>Error loading artworks</p>');
    }
}

// Función para seguir a un usuario
async function seguir_usuario(idUsuSeguidor, idUsuSeguido) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/seguir_usuario",
            type: "POST",
            data: { idUsuSeguidor: idUsuSeguidor, idUsuSeguido: idUsuSeguido },
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            $('#errores').html("Error al seguir: " + response.error);
            return false;
        }
        return true;
    } catch (error) {
        $('#errores').html("Error al seguir al usuario: " + error);
        return false;
    }
}

// Función para dejar de seguir a un usuario
async function dejar_seguir_usuario(idUsuSeguidor, idUsuSeguido) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/dejar_seguir_usuario/" + idUsuSeguidor + "/" + idUsuSeguido,
            type: "DELETE",
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            $('#errores').html("Error al dejar de seguir: " + response.error);
            return false;
        }
        return true;
    } catch (error) {
        $('#errores').html("Error al dejar de seguir al usuario: " + error);
        return false;
    }
}

// Función para buscar obras por texto
function buscar_obras(texto) {
    // Limpiar el contenedor de "Cargar más" antes de cargar nuevas obras
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("buscar", texto, "recientes", 1);
}

// Función para cargar obras trending (con más likes)
function cargar_trending() {
    // Limpiar el contenedor de "Cargar más" antes de cargar nuevas obras
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("", "", "trending", 1);
}

// Función para cargar obras recientes
function cargar_recientes() {
    // Limpiar el contenedor de "Cargar más" antes de cargar nuevas obras
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("", "", "recientes", 1);
}

// Función para cargar obras "For you" (basadas en los likes del usuario)
function cargar_for_you() {
    // Limpiar el contenedor de "Cargar más" antes de cargar nuevas obras
    $('#cargar-mas-container').empty();
    const idUsu = localStorage.getItem('idUsu');
    if (!idUsu) {
        // Si no hay usuario logueado, mostrar obras recientes
        return cargar_recientes();
    }
    return cargar_obras_filtradas("for_you", idUsu, "recientes", 1);
}

// Función para cargar obras de usuarios seguidos
function cargar_following() {
    // Limpiar el contenedor de "Cargar más" antes de cargar nuevas obras
    $('#cargar-mas-container').empty();
    const idUsu = localStorage.getItem('idUsu');
    if (!idUsu) {
        // Si no hay usuario logueado, redirigir al login
        window.location.href = "paginas/login.html";
        return false;
    }
    return cargar_obras_filtradas("siguiendo", idUsu, "recientes", 1);
}

// Función para cargar más obras (paginación)
async function cargar_mas_obras() {
    const boton = $('#cargar-mas');
    const pagina = parseInt(boton.data('pagina'), 10); // Convertir explícitamente a número
    const filtro = boton.data('filtro') || "";
    const valor = boton.data('valor') || "";
    const ordenar = boton.data('ordenar') || "";

    // Validación adicional
    if (isNaN(pagina) || pagina < 1) {
        console.error("Número de página inválido:", boton.data('pagina'));
        return false;
    }

    // Eliminar el botón actual para evitar duplicados
    boton.remove();

    // Mostrar indicador de carga
    $('#cargar-mas-container').html('<div class="cargar-mas-btn"><span>Loading...</span></div>');

    // Cargar más obras
    const resultado = await cargar_obras_filtradas(filtro, valor, ordenar, pagina);

    // Si falla, mostrar mensaje de error
    if (!resultado) {
        $('#cargar-mas-container').html('<div class="cargar-mas-error"><span>Error loading more artworks</span></div>');
        // El mensaje desaparecerá después de 3 segundos
        setTimeout(() => {
            $('#cargar-mas-container').empty();
        }, 3000);
    }

    return resultado;
}

// Función para obtener las etiquetas de una obra
async function obtener_etiquetas_obra(idObra) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/etiquetas_obra/" + idObra,
            type: "GET",
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html("Error al cargar las etiquetas de la obra: " + response.error);
            return [];
        } else {
            return response.etiquetas; // Devolver el array de etiquetas
        }
    } catch (error) {
        $('#errores').html("Error al cargar las etiquetas de la obra: " + error);
        return [];
    }
}

// Función para cargar y mostrar las etiquetas de una obra en post.html
async function cargar_etiquetas_post(idObra) {
    try {
        // Obtener las etiquetas de la obra
        const etiquetas = await obtener_etiquetas_obra(idObra);

        // Limpiar el contenedor de etiquetas
        $('#tags-buttons').empty();

        if (etiquetas && etiquetas.length > 0) {
            // Crear botones para cada etiqueta
            for (const etiqueta of etiquetas) {
                const botonTag = $('<button class="tag-button">')
                    .text(etiqueta.nombre)
                    .attr('data-tag', etiqueta.nombre)
                    .on('click', function () {
                        // Redirigir a index.html con filtro por esta etiqueta
                        window.location.href = '../index.html?search=' + encodeURIComponent($(this).data('tag'));
                    });

                $('#tags-buttons').append(botonTag);
            }
        } else {
            $('#tags-buttons').append('<span>No tags available</span>');
        }
    } catch (error) {
        $('#tags-buttons').html('<span>Error loading tags: ' + error + '</span>');
    }
}

// Función para cargar comentarios de una obra
async function cargar_comentarios_obra(idObra) {
    $('#errores').html(""); // Limpiar mensajes de error
    try {
        const response = await $.ajax({
            url: DIR_API + "/comentarios_obra_user/" + idObra,
            type: "GET",
            dataType: "json"
        });
        if (response.error) {
            $('#errores').html(response.error);
            return [];
        } else {
            // Actualizar contador de comentarios
            const numComentarios = response.comentarios_info ? response.comentarios_info.length : 0;
            $('#comments > span > span').text(numComentarios);
            $('#message-count').html(`<img class="menu" src="../imagenes/icons/message-circle.svg" alt="icono">${numComentarios}`);

            // Obtener ID del usuario actual para determinar permisos de edición/eliminación
            const usuarioActual = localStorage.getItem('idUsu');

            let html_mensaje = '';
            if (response.comentarios_info && response.comentarios_info.length > 0) {
                for (const tupla of response.comentarios_info) {
                    // Comprobar si el comentario pertenece al usuario actual
                    const esMiComentario = usuarioActual && parseInt(usuarioActual) === parseInt(tupla.idUsu);
                    // Escapar correctamente el texto del comentario para los atributos data
                    const textoComentarioHTML = tupla.textoComentario;
                    const textoComentarioAttr = tupla.textoComentario
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    // Ajuste de la estructura para que coincida con los selectores CSS existentes
                    // Cada comentario es un div.content con un atributo data para identificarlo
                    if (!esMiComentario) {
                        html_mensaje += `<div class="content m-1rem" data-comentario-id="${tupla.numComentario}">`;

                    } else {
                        html_mensaje += `<div class="content" data-comentario-id="${tupla.numComentario}">`;
                    }

                    html_mensaje += `<img class="foto-perfil" src="../../backend/images/profilePics/${tupla.fotoPerfil}" alt="icono">`;
                    html_mensaje += '<div>';
                    html_mensaje += `<span class="nombre">${tupla.nombreUsuario}</span>`;
                    html_mensaje += `<span class="fecha">${tupla.fecCom}</span>`;
                    html_mensaje += `<span class="comentario">${textoComentarioHTML}</span>`;
                    html_mensaje += '</div>';
                    html_mensaje += '</div>';

                    // Solo mostrar opciones de editar/eliminar si el comentario es del usuario actual
                    if (esMiComentario) {
                        html_mensaje += '<div class="actions-comment">';
                        html_mensaje += `<span class="edit-comment" data-id="${tupla.numComentario}" data-texto="${textoComentarioAttr}">
                            <img class="menu" src="../imagenes/icons/edit.svg" alt="icono">Edit</span>`;
                        html_mensaje += `<span class="delete-comment" data-id="${tupla.numComentario}">
                            <img class="menu" src="../imagenes/icons/trash-2.svg" alt="icono">Delete</span>`;
                        html_mensaje += '</div>';
                    }
                }
            } else {
                html_mensaje = '<p class="no-comments">There are no comments on this artwork yet. Be the first to comment!</p>';
            }
            $('#all-comments').html(html_mensaje);
            return response.comentarios_info || [];
        }
    } catch (error) {
        $('#errores').html("Error al cargar los comentarios de la obra.");
        return [];
    }
}

// Mostrar alerts
async function cargar_alertas(idUsu, link1, link2) {
    try {
        // Consumir servivcio de obtener seguidores
        const response_seguidores = await $.ajax({
            url: DIR_API + "/alertas_seguidores/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response_seguidores.error) {
            $('#errores').html(response_seguidores.error);
            return;
        }

        let html_alertas = '<span id="title-alerts">Alerts</span>';
        html_alertas += '<div id="alerts-container">';        
        // Se añaden los seguidores nuevos
        for (const alerta of response_seguidores.alertas_seguidores) {
            const profilePath = window.location.pathname.includes('paginas/') ?
                `profile.html?id=${alerta.idUsu}` :
                `paginas/profile.html?id=${alerta.idUsu}`;            
            
            // Obtener datos de usuario de forma asíncrona
            const usuario = await obtener_datos_usuario(alerta.idUsu);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${link2}backend/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;
            html_alertas += `<a id="alert-seguidor-${alerta.idUsu}" class="alert-seguidor-link" href="${profilePath}" data-idseguidor="${alerta.idUsu}" data-idseguido="${idUsu}"><span><strong>@${alerta.nombreUsuario}</strong> ha comenzado a seguirte</span></a></div>`;   
        }

        // Consumir servivcio de obtener likes
        const response_likes = await $.ajax({
            url: DIR_API + "/alertas_likes/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response_likes.error) {
            $('#errores').html(response_likes.error);
            return;
        }        // Se añaden los likes nuevos
        for (const alerta of response_likes.alertas_likes) {
            const postPath = window.location.pathname.includes('paginas/') ?
                `post.html?id=${alerta.idObra}` :
                `paginas/post.html?id=${alerta.idObra}`;

            const usuario = await obtener_datos_usuario(alerta.idUsuLike);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${link2}backend/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;

            html_alertas += `<a class="alert-like-link" href="${postPath}" data-idobra="${alerta.idObra}" data-idusulike="${alerta.idUsuLike}"><span>A @${alerta.usuario_like} le gusta <strong>${alerta.nombre_obra}</strong></span></a></div>`;
        }

        // Consumir servivcio de obtener comentarios
        const response_comentarios = await $.ajax({
            url: DIR_API + "/alertas_comentarios/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response_comentarios.error) {
            $('#errores').html(response_comentarios.error);
            return;
        }        // Se añaden los comentarios nuevos
        for (const alerta of response_comentarios.alertas_comentarios) {
            const postPath = window.location.pathname.includes('paginas/') ?
                `post.html?id=${alerta.idObra}` :
                `paginas/post.html?id=${alerta.idObra}`;

            const usuario = await obtener_datos_usuario(alerta.idUsu);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${link2}backend/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;

            html_alertas += `<a class="alert-comentario-link" href="${postPath}" data-idcomentario="${alerta.numComentario}"><span>@${alerta.usuario_comentario} comentó en <strong>${alerta.nombre_obra}</strong></span></a></div>`;
        }        
        html_alertas += '</div>';
        $('div#content-alerts').html(html_alertas);        // Actualizar el contador de alertas
        let num_alerts = response_seguidores.alertas_seguidores.length + response_likes.alertas_likes.length + response_comentarios.alertas_comentarios.length;
        $('span#num-alerts').text(num_alerts);

        // Actualizar la visibilidad del contador según el tamaño de la pantalla
        actualizarVisibilidadContadorAlertas(num_alerts);
        
        // Añadir manejadores de eventos para marcar alertas como vistas al hacer clic
        // Para alertas de seguidores
        $('.alert-seguidor-link').on('click', async function(e) {
            const idSeguido = $(this).data('idseguido');
            const idSeguidor = $(this).data('idseguidor');
            try {
                await $.ajax({
                    url: DIR_API + `/alerta_follow_visto/${idSeguido}/${idSeguidor}`,
                    type: "PUT",
                    dataType: "json"
                });
            } catch (error) {
                console.error("Error al marcar alerta de seguidor como vista:", error);
            }
        });
        
        // Para alertas de likes
        $('.alert-like-link').on('click', async function(e) {
            const idObra = $(this).data('idobra');
            const idUsuLike = $(this).data('idusulike');
            try {
                await $.ajax({
                    url: DIR_API + `/alerta_like_visto/${idObra}/${idUsuLike}`,
                    type: "PUT",
                    dataType: "json"
                });
            } catch (error) {
                console.error("Error al marcar alerta de like como vista:", error);
            }
        });
        
        // Para alertas de comentarios
        $('.alert-comentario-link').on('click', async function(e) {
            const idComentario = $(this).data('idcomentario');
            try {
                await $.ajax({
                    url: DIR_API + `/alerta_comentario_visto/${idComentario}`,
                    type: "PUT",
                    dataType: "json"
                });
            } catch (error) {
                console.error("Error al marcar alerta de comentario como vista:", error);
            }
        });

        // Función para actualizar la visibilidad del contador de alertas
        function actualizarVisibilidadContadorAlertas(numAlertas) {
            if (numAlertas > 0) {
                $('img#icon-alerts').attr('src', link1 + 'icons/icons-blanco/bell-ringing.svg');
                if (window.innerWidth > 1024) {
                    $('span#num-alerts').show();
                } else {
                    $('span#num-alerts').hide();
                }
            }

        }

        // Evento resize para mostrar o no el contador de alertas
        $(window).off('resize.alertas').on('resize.alertas', function () {
            actualizarVisibilidadContadorAlertas(num_alerts);
        });

    } catch (error) {
        $('#errores').html("Error al cargar las alertas: " + error);
    }
}


// Manejar los clics en los botones de like usando delegación de eventos
$(document).ready(function () {
    // Like en la página de índice
    $("#galery-index").on("click", "article.post>ul.icons-post>li:first-child>img", async function () {
        const idUsu = localStorage.getItem('idUsu');
        if (!idUsu) {
            window.location.href = "paginas/login.html";
            return;
        }

        const article = $(this).closest('article.post');
        const idObra = article.attr('data-idobra');
        if (!idObra) {
            console.error("No se encontró el ID de la obra");
            return;
        }

        const img = $(this);
        const numLikesSpan = img.siblings('.num-likes');

        // Alternar like
        const resultado = await toggle_like_obra(idObra, idUsu);

        // Actualizar recuento de likes
        const likes = await obtener_likes_obra(idObra);
        numLikesSpan.text(likes.length);

        // Llamar a la función de efecto desde script-efectos.js
        if (typeof efectoLikeIndex === 'function') {
            efectoLikeIndex(img, resultado === true);
        }
    });

    // Like en la página de perfil
    $("#profile-gallery").on("click", "article.post>ul.icons-post>li:first-child>img", async function () {
        const idUsu = localStorage.getItem('idUsu');
        if (!idUsu) {
            window.location.href = "login.html";
            return;
        }

        const article = $(this).closest('article.post');
        const idObra = article.attr('data-idobra');
        if (!idObra) {
            console.error("No se encontró el ID de la obra");
            return;
        }

        const img = $(this);
        const numLikesSpan = img.siblings('.num-likes');

        // Alternar like
        const resultado = await toggle_like_obra(idObra, idUsu);

        // Actualizar recuento de likes
        const likes = await obtener_likes_obra(idObra);
        numLikesSpan.text(likes.length);

        // Llamar a la función de efecto desde script-efectos.js
        if (typeof efectoLikeProfile === 'function') {
            efectoLikeProfile(img, resultado === true);
        }
    });

    // Follow en la página de índice
    $("#galery-index").on("click", "span.boton-seguir", async function () {
        const idUsu = localStorage.getItem('idUsu');
        if (!idUsu) {
            window.location.href = "paginas/login.html";
            return;
        }

        const boton = $(this);
        const idAutor = boton.data('idautor');
        if (!idAutor) {
            console.error("No se encontró el ID del autor");
            return;
        }

        // Alternar follow
        const resultado = await toggle_follow(idUsu, idAutor);

        // Llamar a la función de efecto
        if (typeof efectoFollowIndex === 'function') {
            efectoFollowIndex(boton, resultado === true);
        }
    });

    // Follow en la página de perfil
    $("#boton-seguir-perfil").on("click", async function () {
        const idUsu = localStorage.getItem('idUsu');
        if (!idUsu) {
            window.location.href = "login.html";
            return;
        }

        const boton = $(this);
        const idAutor = boton.data('idautor');
        if (!idAutor) {
            console.error("No se encontró el ID del autor");
            return;
        }

        // Alternar follow
        const resultado = await toggle_follow(idUsu, idAutor);

        // Actualizar contador de seguidores
        const seguidores = await obtener_seguidores(idAutor);
        $('#follows .numbers').text(seguidores.length + ' Followers');

        // Llamar a la función de efecto
        if (typeof efectoFollowProfile === 'function') {
            efectoFollowProfile(boton, resultado === true);
        }
    });

    if (localStorage.token) {
        $('#joinOrLogin').hide();

        // Actualizar la imagen del perfil con la foto del usuario logueado
        const idUsu = localStorage.getItem('idUsu');
        if (idUsu) {
            $.ajax({
                url: DIR_API + "/usuario/" + idUsu,
                type: "GET",
                dataType: "json"
            }).then(response => {
                if (!response.error && response.usuario && response.usuario.fotoPerfil) {
                    // Determinar la ruta correcta según si estamos en la página principal o en una subpágina
                    const imgPath = window.location.pathname.includes('paginas/') ?
                        "../../backend/images/profilePics/" + response.usuario.fotoPerfil :
                        "../backend/images/profilePics/" + response.usuario.fotoPerfil;

                    // Actualizar la imagen del header
                    $('#profile img').attr('src', imgPath);
                    $('#profile-header img').attr('src', imgPath);
                }
            }).catch(error => {
                $('#errores').html("Error al cargar la foto de perfil: " + error);
            });
        }
    }

});