const DIR_API = 'https://tulipart-production.up.railway.app';

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

    if (!localStorage.token) {
        $('#logout').hide();
    }else{
        $('#logout').show();
    }    // link perfil
    $('#profile, #profile-header').on('click', function (e) {
        if (!localStorage.token) {
            e.preventDefault();
            const loginPath = window.location.pathname.includes('paginas/') ? "login.html" : "paginas/login.html";
            window.location.href = loginPath;
        } else {
            const idUsu = localStorage.getItem('idUsu');
            const profilePath = window.location.pathname.includes('paginas/') ? `profile.html?id=${idUsu}` : `paginas/profile.html?id=${idUsu}`;

            e.preventDefault();
            window.location.href = profilePath;
        }
    });

});

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

                // fotos obra
                const fotos = await obtener_fotos_obra(tupla["idObra"]);
                const primeraFoto = fotos.length > 0 ? fotos[0]["foto"] : "imagenes/arte/default.webp"; // default si no hay

                // cargar imagen y definir clase
                const classArticle = await determinarClaseImagen(DIR_API + '/images/obras/' + primeraFoto);

                // datos usuario dueño
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // nombre o default
                const iconoUsuario = usuario.fotoPerfil ? DIR_API + "/images/profilePics/" + usuario.fotoPerfil : DIR_API + "/images/profilePics/no_image.jpg"; // icono o default

                // likes obra
                const likes = await obtener_likes_obra(tupla["idObra"]);
                const numLikes = likes.length; // total likes

                // check si usuario dio like
                const yaDioLike = idUsu ? likes.some(like => like.idUsuLike == idUsu) : false;
                const iconoLike = yaDioLike ? "imagenes/icons/Heart.svg" : "imagenes/icons/Favorite.svg";

                // check si usuario sigue autor
                const yaSigue = idUsu ? await verificar_siguiendo(idUsu, tupla["idUsu"]) : false;
                const textoBotonSeguir = yaSigue ? "Following" : "Follow";
                const estilosBotonSeguir = yaSigue ?
                    'style="color: orange; border-color: orange;"' :
                    '';

                // comentarios obra
                const comentarios = await obtener_comentarios_obra(tupla["idObra"]);
                const numComentarios = comentarios.length; // total comentarios


                html_obras += "<article class='post " + classArticle + "' data-idobra='" + tupla["idObra"] + "'><div class='capa-post'>"; // clase wide o vacía
                html_obras += "</div><nav class='menu-post'><div class='pico-bocadillo'></div><div class='content'>";
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>"; //enlace perfil usuario autor *
                html_obras += "<img src='imagenes/icons/user.svg' alt='pico bocadillo menu'><span>Profile</span></a><a href='#'><img src='imagenes/icons/share-2.svg' alt='pico bocadillo menu'><span>Share</span></a><a href='#'><img src='imagenes/icons/alert-circle.svg' alt='pico bocadillo menu'><span>Report</span></a></div></nav><div class='post-info'>";
                html_obras += `<a href='paginas/profile.html?id=${tupla["idUsu"]}'>`; //enlace perfil usuario autor *
                html_obras += `<img class='profile-pic' src='${iconoUsuario}' alt='Icon user ${nombreUsuario}'></a>`;// icono user
                html_obras += "<div class='titulo-user'>";
                html_obras += `<a id='enlace-post-index' href='paginas/post.html?id=${tupla["idObra"]}'>`;//link post
                html_obras += `<span class='titulo-obra'>${tupla["nombreObra"]}</span></a>`;//titulo obra
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>";//link perfil
                html_obras += `<span class='nombre-user'>By ${nombreUsuario}</span></a></div>`;//nombre user
                // mostrar boton seguir solo si user no es autor
                if (idUsu && String(idUsu) !== String(tupla["idUsu"])) {
                    html_obras += `<span class='boton-seguir' data-idautor='${tupla["idUsu"]}' ${estilosBotonSeguir}>${textoBotonSeguir}</span>`; //btn seguir
                }
                html_obras += "<img class='icon-albondiga' src='imagenes/icons/MenuVertical.svg' alt='menu-post'></div>";
                html_obras += `<picture class='obra-arte'><img src='${DIR_API}/images/obras/${primeraFoto}' alt='Obra de arte'></picture>`; // primera foto
                html_obras += `<ul class='icons-post'><li><img id='btn-like-index' class='btn-like' src='${iconoLike}' alt='Icon like'><span class='num-likes'>${numLikes}</span></li>`; //like
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

        // params filtrado si existen
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
            // procesar cada obra y añadir a galeria
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
                const classArticle = await determinarClaseImagen(DIR_API + '/images/obras/' + primeraFoto);

                // Obtener los datos del usuario dueño de la obra
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // Nombre del usuario o valor por defecto
                const iconoUsuario = usuario.fotoPerfil ? DIR_API + "/images/profilePics/" + usuario.fotoPerfil : DIR_API + "/images/profilePics/no_image.jpg"; // Icono del usuario o valor por defecto

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
                html_obras += `<img class='profile-pic' src='${iconoUsuario}' alt='Icon user ${nombreUsuario}'></a>`;// icono user
                html_obras += "<div class='titulo-user'>";
                html_obras += `<a id='enlace-post-index' href='paginas/post.html?id=${tupla["idObra"]}'>`;//link post
                html_obras += `<span class='titulo-obra'>${tupla["nombreObra"]}</span></a>`;//titulo obra
                html_obras += "<a href='paginas/profile.html?id=" + tupla["idUsu"] + "'>";//link perfil
                html_obras += `<span class='nombre-user'>By ${nombreUsuario}</span></a></div>`;//nombre user
                // mostrar boton seguir solo si user no es autor
                if (idUsu && String(idUsu) !== String(tupla["idUsu"])) {
                    html_obras += `<span class='boton-seguir' data-idautor='${tupla["idUsu"]}' ${estilosBotonSeguir}>${textoBotonSeguir}</span>`; //btn seguir
                }
                html_obras += "<img class='icon-albondiga' src='imagenes/icons/MenuVertical.svg' alt='menu-post'></div>";
                html_obras += `<picture class='obra-arte'><img src='${DIR_API}/images/obras/${primeraFoto}' alt='Obra de arte'></picture>`; // primera foto
                html_obras += `<ul class='icons-post'><li><img class='btn-like' data-idobra='${tupla["idObra"]}' src='${iconoLike}' alt='Icon like'><span class='num-likes'>${numLikes}</span></li>`; //like
                html_obras += `<li><a href='paginas/post.html?id=${tupla["idObra"]}#new-comment'><img src='imagenes/icons/message-circle.svg' alt='Icon message post'></a><span class='num-comments'>${numComentarios}</span></li></ul></article>`; //comentar *
            }

            $('#galery-index').append(html_obras);            
            // agregar botón cargar más si hay más páginas
            if (response.pagina_actual < response.total_paginas) {
                // asegurarse valores correctos
                const siguientePagina = parseInt(response.pagina_actual, 10) + 1;
                const filtroSeguro = filtro ? filtro.replace(/"/g, '&quot;') : '';
                const valorSeguro = valor ? valor.replace(/"/g, '&quot;') : '';
                const ordenarSeguro = ordenar ? ordenar.replace(/"/g, '&quot;') : '';

                $('#cargar-mas-container').empty();

                const botonCargarMas = `
                    <div id="cargar-mas" class="cargar-mas-btn" data-pagina="${siguientePagina}" data-filtro="${filtroSeguro}" data-valor="${valorSeguro}" data-ordenar="${ordenarSeguro}">
                        <span>Load more</span>
                    </div>
                `;
                $('#cargar-mas-container').append(botonCargarMas);
            } else {
                // si no hay más páginas, asegurarse de que no quede ningún botón
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

            $('#profile-photo').attr('src', DIR_API + "/images/profilePics/" + response.usuario.fotoPerfil);
            $('#profile-name').text(response.usuario.nombre);
            $('#username').text('@' + response.usuario.nombreUsuario);

            $('#aboutme-info').text(response.usuario.biografia);

            // número follows y obras
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

// determinar class segun dimensiones imagen
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
            resolve("");
        };
    });
}

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
            return response.fotos;
        }
    } catch (error) {
        $('#errores').html("Error al cargar las fotos de la obra.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

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
            return response.likes_obra;
        }
    } catch (error) {
        $('#errores').html("Error al cargar los likes de la obra.");
        $('#principal').html("");
        localStorage.clear();
        return [];
    }
}

// alternar like, si existe quitar, si no crear
async function toggle_like_obra(idObra, idUsu) {
    try {
        // likes actuales
        const likes = await obtener_likes_obra(idObra);
        // check si user ya dio like
        const yaDadoLike = likes.some(like => like.idUsuLike == idUsu);

        if (!yaDadoLike) {
            // no like, crear
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
            // ya dio like, borrar
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

        return !yaDadoLike;
    } catch (error) {
        $('#errores').html("Error al alternar el like");
        return null;
    }
}

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
            return {};
        } else if (!response.usuario) {
            return {};
        } else {
            return response.usuario;
        }
    } catch (error) {
        $('#errores').html("Error al cargar los datos del usuario.");
        $('#principal').html("");
        localStorage.clear();
        return {};
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
                // fotos obra
                const fotos = await obtener_fotos_obra(tupla["idObra"]);
                const primeraFoto = fotos.length > 0 ? fotos[0]["foto"] : "../imagenes/arte/default.webp"; // default si no hay

                // datos usuario dueño
                const usuario = await obtener_datos_usuario(tupla["idUsu"]);
                const nombreUsuario = usuario.nombreUsuario || "Usuario desconocido"; // nombre o default
                const iconoUsuario = usuario.fotoPerfil ? `${DIR_API}/images/profilePics/${usuario.fotoPerfil}` : `${DIR_API}/images/profilePics/no_image.jpg`; // icono o default

                const likes = await obtener_likes_obra(tupla["idObra"]);
                const numLikes = likes.length;

                // check si user dio like
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
                html_posts += `<picture class="obra-arte"><img src="${DIR_API}/images/obras/${primeraFoto}" alt="Obra de arte ${tupla["nombreObra"]}"></picture>`;
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

// check si user sigue otro
async function verificar_siguiendo(idUsuSeguidor, idUsuSeguido) {
    try {
        const seguidores = await obtener_seguidores(idUsuSeguido);
        return seguidores.some(seguidor => seguidor.idSeguidor == idUsuSeguidor);
    } catch (error) {
        return false;
    }
}

// alternar seguir/dejar seguir
async function toggle_follow(idUsuSeguidor, idUsuSeguido) {
    try {
        // check si ya sigue
        const yaSigue = await verificar_siguiendo(idUsuSeguidor, idUsuSeguido);

        if (!yaSigue) {
            // no sigue, seguir
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
            // ya sigue, dejar de seguir
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

        return !yaSigue;
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

            // check si es generado por ia
            const aiGenerated = response.obra.aiGenerated;
            const aiText = aiGenerated == 1 ? "AI" : "No AI";
            const aiIcon = aiGenerated == 1 ? "ai.png" : "slash.svg";
            $('#ai-info').html(`<img class="delete" src="../imagenes/icons/${aiIcon}" alt="icono">${aiText}`);
            // año publicacion
            const fechaPublicacion = new Date(response.obra.fecPubli);
            const añoPublicacion = fechaPublicacion.getFullYear();

            // datos user autor
            cargar_usuario_pagina_post(response.obra.idUsu).then(usuario => {
                // actualizar titulo more-by con nombre autor
                $('aside > span > span#name-author').html(`<a href="profile.html?id=${response.obra.idUsu}">${usuario.nombreUsuario}</a>`);

                // copyright con nombre autor y año
                $('#copy').text(`©${añoPublicacion} ${usuario.nombre}`);
            });

            // obras mismo autor en more-by
            cargar_more_by(response.obra.idUsu, idObra);
            // cargar etiquetas obra
            cargar_etiquetas_post(idObra);

            const idUsu = localStorage.getItem('idUsu');
            if (idUsu == response.obra.idUsu) {
                // user actual es autor, mostrar btn editar
                html_opciones = '<img id="delete-post" class="delete" src="../imagenes/icons/trash-2.svg" alt="icono">';
                html_opciones += '<img id="edit" src="../imagenes/icons/edit.svg" alt="icono"></img>';
                $('div#der').html(html_opciones);
            }

            // obras relacionadas por tags
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
            $('#user-photo').attr('src', `${DIR_API}/images/profilePics/${response.usuario.fotoPerfil}`);
            $('#user-nombre').text(response.usuario.nombreUsuario);
            return response.usuario;
        }
    } catch (error) {
        $('#errores').html("Error al cargar la información del usuario " + idUsu);
        $('#principal').html("");
        localStorage.clear();
    }
}

// cargar obras en la sección More by del post
async function cargar_more_by(idUsuAutor, idObraActual, contenedor = '#more-by', limite = 8) {
    try {
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

        $(contenedor).empty();

        if (obras && obras.length > 0) {
            // excluir obra actual
            const obrasFiltradas = obras.filter(obra => obra.idObra != idObraActual);

            // máximo 8 obras
            const obrasAMostrar = obrasFiltradas.slice(0, limite);

            if (obrasAMostrar.length === 0) {
                $(contenedor).html('<p>No more artworks by this author</p>');
                return;
            }

            // mostrar solo la primera imagen
            for (let i = 0; i < obrasAMostrar.length; i++) {
                const obra = obrasAMostrar[i];

                // obtener primera foto de la obra
                const fotosResponse = await obtener_fotos_obra(obra.idObra);
                const fotos = fotosResponse || [];
                const primeraFoto = fotos.length > 0
                    ? `${DIR_API}/images/obras/${fotos[0].foto}`
                    : "../imagenes/arte/default.webp";

                // Crear article de la obra
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

// filtros
function buscar_obras(texto) {
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("buscar", texto, "recientes", 1);
}

function cargar_trending() {
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("", "", "trending", 1);
}

function cargar_recientes() {
    $('#cargar-mas-container').empty();
    return cargar_obras_filtradas("", "", "recientes", 1);
}

function cargar_for_you() {
    $('#cargar-mas-container').empty();
    const idUsu = localStorage.getItem('idUsu');
    if (!idUsu) {
        return cargar_recientes();
    }
    return cargar_obras_filtradas("for_you", idUsu, "recientes", 1);
}

function cargar_following() {
    $('#cargar-mas-container').empty();
    const idUsu = localStorage.getItem('idUsu');
    if (!idUsu) {
        window.location.href = "paginas/login.html";
        return false;
    }
    return cargar_obras_filtradas("siguiendo", idUsu, "recientes", 1);
}

async function cargar_mas_obras() {
    const boton = $('#cargar-mas');
    const pagina = parseInt(boton.data('pagina'), 10);
    const filtro = boton.data('filtro') || "";
    const valor = boton.data('valor') || "";
    const ordenar = boton.data('ordenar') || "";

    // validación
    if (isNaN(pagina) || pagina < 1) {
        console.error("Número de página inválido:", boton.data('pagina'));
        return false;
    }

    boton.remove();

    $('#cargar-mas-container').html('<div class="cargar-mas-btn"><span>Loading...</span></div>');

    const resultado = await cargar_obras_filtradas(filtro, valor, ordenar, pagina);

    if (!resultado) {
        $('#cargar-mas-container').html('<div class="cargar-mas-error"><span>Error loading more artworks</span></div>');
        // mensaje desaparece en 3 segundos
        setTimeout(() => {
            $('#cargar-mas-container').empty();
        }, 3000);
    }

    return resultado;
}

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
            return response.etiquetas;
        }
    } catch (error) {
        $('#errores').html("Error al cargar las etiquetas de la obra: " + error);
        return [];
    }
}

async function cargar_etiquetas_post(idObra) {
    try {
        const etiquetas = await obtener_etiquetas_obra(idObra);

        $('#tags-buttons').empty();

        if (etiquetas && etiquetas.length > 0) {
            // botones para cada etiqueta
            for (const etiqueta of etiquetas) {
                const botonTag = $('<button class="tag-button">')
                    .text(etiqueta.nombre)
                    .attr('data-tag', etiqueta.nombre)
                    .on('click', function () {
                        // redirigir a index con filtro por esta etiqueta
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

async function cargar_comentarios_obra(idObra) {
    $('#errores').html("");
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
            // contador comentarios
            const numComentarios = response.comentarios_info ? response.comentarios_info.length : 0;
            $('#comments > span > span').text(numComentarios);
            $('#message-count').html(`<img class="menu" src="../imagenes/icons/message-circle.svg" alt="icono">${numComentarios}`);

            const usuarioActual = localStorage.getItem('idUsu');

            let html_mensaje = '';
            if (response.comentarios_info && response.comentarios_info.length > 0) {
                for (const tupla of response.comentarios_info) {
                    // comprobar si el comentario pertenece al usuario logueado
                    const esMiComentario = usuarioActual && parseInt(usuarioActual) === parseInt(tupla.idUsu);

                    const textoComentarioHTML = tupla.textoComentario;
                    const textoComentarioAttr = tupla.textoComentario
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    if (!esMiComentario) {
                        html_mensaje += `<div class="content m-1rem" data-comentario-id="${tupla.numComentario}">`;

                    } else {
                        html_mensaje += `<div class="content" data-comentario-id="${tupla.numComentario}">`;
                    }

                    html_mensaje += `<img class="foto-perfil" src="${DIR_API}/images/profilePics/${tupla.fotoPerfil}" alt="icono">`;
                    html_mensaje += '<div>';
                    html_mensaje += `<span class="nombre">${tupla.nombreUsuario}</span>`;
                    html_mensaje += `<span class="fecha">${tupla.fecCom}</span>`;
                    html_mensaje += `<span class="comentario">${textoComentarioHTML}</span>`;
                    html_mensaje += '</div>';
                    html_mensaje += '</div>';

                    // mostrar editar/eliminar si el comentario es del usuario logueado
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

async function cargar_alertas(idUsu, link) {
    try {
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
        // añadir seguidores nuevos
        for (const alerta of response_seguidores.alertas_seguidores) {
            const profilePath = window.location.pathname.includes('paginas/') ?
                `profile.html?id=${alerta.idUsu}` :
                `paginas/profile.html?id=${alerta.idUsu}`;            

            const usuario = await obtener_datos_usuario(alerta.idUsu);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${DIR_API}/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;
            html_alertas += `<a id="alert-seguidor-${alerta.idUsu}" class="alert-seguidor-link" href="${profilePath}" data-idseguidor="${alerta.idUsu}" data-idseguido="${idUsu}"><span><strong>@${alerta.nombreUsuario}</strong> ha comenzado a seguirte</span></a></div>`;   
        }

        const response_likes = await $.ajax({
            url: DIR_API + "/alertas_likes/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response_likes.error) {
            $('#errores').html(response_likes.error);
            return;
        }        
        // añadir likes nuevos
        for (const alerta of response_likes.alertas_likes) {
            const postPath = window.location.pathname.includes('paginas/') ?
                `post.html?id=${alerta.idObra}` :
                `paginas/post.html?id=${alerta.idObra}`;

            const usuario = await obtener_datos_usuario(alerta.idUsuLike);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${DIR_API}/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;

            html_alertas += `<a class="alert-like-link" href="${postPath}" data-idobra="${alerta.idObra}" data-idusulike="${alerta.idUsuLike}"><span>A @${alerta.usuario_like} le gusta <strong>${alerta.nombre_obra}</strong></span></a></div>`;
        }

        const response_comentarios = await $.ajax({
            url: DIR_API + "/alertas_comentarios/" + idUsu,
            type: "GET",
            dataType: "json"
        });

        if (response_comentarios.error) {
            $('#errores').html(response_comentarios.error);
            return;
        }        
        // añadir comentarios nuevos
        for (const alerta of response_comentarios.alertas_comentarios) {
            const postPath = window.location.pathname.includes('paginas/') ?
                `post.html?id=${alerta.idObra}` :
                `paginas/post.html?id=${alerta.idObra}`;

            const usuario = await obtener_datos_usuario(alerta.idUsu);
            const fotoUsu = usuario.fotoPerfil || 'no_image.jpg';

            html_alertas += `<div id="alert-row"><img class="profile-pic-alert" src="${DIR_API}/images/profilePics/${fotoUsu}" alt="Icon user ${alerta.nombreUsuario}">`;

            html_alertas += `<a class="alert-comentario-link" href="${postPath}" data-idcomentario="${alerta.numComentario}"><span>@${alerta.usuario_comentario} comentó en <strong>${alerta.nombre_obra}</strong></span></a></div>`;
        }        
        html_alertas += '</div>';
        $('div#content-alerts').html(html_alertas);

        // contador alertas
        let num_alerts = response_seguidores.alertas_seguidores.length + response_likes.alertas_likes.length + response_comentarios.alertas_comentarios.length;
        $('span#num-alerts').text(num_alerts);

        // mostrar contador según ancho pantalla
        actualizarVisibilidadContadorAlertas(num_alerts);
        
        // manejadores eventos marcar alertas como vistas al hacer clic
        // alertas de seguidores
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
        
        // alertas de likes
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
        
        // alertas de comentarios
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

        // mostrar contador alertas
        function actualizarVisibilidadContadorAlertas(numAlertas) {
            if (numAlertas > 0) {
                $('img#icon-alerts').attr('src', link + 'icons/icons-blanco/bell-ringing.svg');
                if (window.innerWidth > 1024) {
                    $('span#num-alerts').show();
                } else {
                    $('span#num-alerts').hide();
                }
            }

        }

        // evento resize mostrar o no contador alertas
        $(window).off('resize.alertas').on('resize.alertas', function () {
            actualizarVisibilidadContadorAlertas(num_alerts);
        });

    } catch (error) {
        $('#errores').html("Error al cargar las alertas: " + error);
    }
}

async function eliminar_comentario(idComentario) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/eliminar_comentario_obra/" + idComentario,
            type: "DELETE",
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            $('#errores').html("Error al eliminar comentario: " + response.error);
            return false;
        } else {
            $('#errores').html("Comentario eliminado correctamente");
            return true;
        }
    } catch (error) {
        $('#errores').html("Error al eliminar el comentario:", error);
        return false;
    }
}

async function editar_comentario(idComentario, nuevoTexto) {
    try {
        const response = await $.ajax({
            url: DIR_API + "/editar_comentario_obra/" + idComentario,
            type: "PUT",
            data: {
                'new-comment': nuevoTexto
            },
            dataType: "json",
            headers: { Authorization: "Bearer " + localStorage.token }
        });

        if (response.error) {
            $('#errores').html("Error al editar comentario: " + response.error);
            return false;
        } else {
            $('#errores').html("Comentario editado correctamente");
            return true;
        }
    } catch (error) {
        $('#errores').html("Error al editar el comentario: " + error);
        return false;
    }
}


// manejador clics botones like y follow
$(document).ready(function () {
    // like index
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

        const resultado = await toggle_like_obra(idObra, idUsu);

        const likes = await obtener_likes_obra(idObra);
        numLikesSpan.text(likes.length);

        // efecto
        if (typeof efectoLikeIndex === 'function') {
            efectoLikeIndex(img, resultado === true);
        }
    });

    // like profile
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

        const resultado = await toggle_like_obra(idObra, idUsu);

        const likes = await obtener_likes_obra(idObra);
        numLikesSpan.text(likes.length);

        // efecto
        if (typeof efectoLikeProfile === 'function') {
            efectoLikeProfile(img, resultado === true);
        }
    });

    // follow index
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

    // follow profile
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

        const resultado = await toggle_follow(idUsu, idAutor);

        const seguidores = await obtener_seguidores(idAutor);
        $('#follows .numbers').text(seguidores.length + ' Followers');

        // efecto
        if (typeof efectoFollowProfile === 'function') {
            efectoFollowProfile(boton, resultado === true);
        }
    });

    if (localStorage.token) {
        $('#joinOrLogin').hide();

        // icono usuario logueado header
        const idUsu = localStorage.getItem('idUsu');
        if (idUsu) {
            $.ajax({
                url: DIR_API + "/usuario/" + idUsu,
                type: "GET",
                dataType: "json"
            }).then(response => {
                if (!response.error && response.usuario && response.usuario.fotoPerfil) {
                    const imgPath = DIR_API + "/images/profilePics/" + response.usuario.fotoPerfil;

                    $('#profile img').attr('src', imgPath);
                    $('#profile-header img').attr('src', imgPath);
                }
            }).catch(error => {
                $('#errores').html("Error al cargar la foto de perfil: " + error);
            });
        }
    }

});