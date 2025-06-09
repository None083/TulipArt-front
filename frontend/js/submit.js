// Usa la configuración global para la API
// Requiere que config.js esté incluido antes
const DIR_API = (typeof appConfig !== 'undefined' ? appConfig.apiBaseUrl : '/backend/servicios_rest_protect');

$(document).ready(function () {

    // Cargar etiquetas para autocompletado
    var etiquetas = [];
    cargarEtiquetas();

    // Recuperar la información de imágenes temporales del localStorage
    const imagenesTemporal = JSON.parse(localStorage.getItem('imagenesTemporal') || '[]');

    // Si hay imágenes, cargarlas en el contenedor
    if (imagenesTemporal.length > 0) {
        // Limpiar el contenedor de imágenes
        $('#imageContainer').empty();

        // Crear un slider si hay múltiples imágenes
        if (imagenesTemporal.length > 1) {
            const $slider = $('<div class="slider-container"></div>');
            const $sliderTrack = $('<div class="slider-track"></div>');

            // Añadir imágenes al slider
            imagenesTemporal.forEach((imagen, index) => {
                // Asegurarse de que la URL es correcta
                const urlImagen = imagen.urlTemporal;

                const $slide = $('<div class="slide"></div>');
                const $img = $('<img>').attr({
                    src: urlImagen,
                    alt: imagen.nombreOriginal,
                    'data-nombre-temporal': imagen.nombreTemporal
                });

                $slide.append($img);
                $sliderTrack.append($slide);
            });

            // Añadir controles de navegación
            const $prevBtn = $('<button type="button" class="slider-btn prev">❮</button>');
            const $nextBtn = $('<button type="button" class="slider-btn next">❯</button>');

            $slider.append($sliderTrack, $prevBtn, $nextBtn);
            $('#imageContainer').append($slider);

            // Funcionalidad de slider
            let currentSlide = 0;
            const totalSlides = imagenesTemporal.length;

            function updateSlider() {
                const offset = -currentSlide * 100;
                $sliderTrack.css('transform', `translateX(${offset}%)`);
            }

            $prevBtn.on('click', function () {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                updateSlider();
            });

            $nextBtn.on('click', function () {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateSlider();
            });
        } else {
            // Si solo hay una imagen, mostrarla directamente
            const imagen = imagenesTemporal[0];
            const $img = $('<img>').attr({
                src: imagen.urlTemporal,
                alt: imagen.nombreOriginal,
                'data-nombre-temporal': imagen.nombreTemporal,
                class: 'single-image'
            });
            $('#imageContainer').append($img);
        }

        // Añadir campo oculto con la información de las imágenes
        if ($('#imagenes-temporal').length === 0) {
            $('<input>').attr({
                type: 'hidden',
                id: 'imagenes-temporal',
                name: 'imagenes_temporal',
                value: JSON.stringify(imagenesTemporal)
            }).appendTo('#submit-form');
        }
    }

    // Función para cargar etiquetas para autocompletado
    async function cargarEtiquetas() {
        try {
            const response = await $.ajax({
                url: DIR_API + "/etiquetas",
                type: "GET",
                dataType: "json"
            });

            if (response.error) {
                console.error("Error al cargar etiquetas:", response.error);
                return;
            }

            if (Array.isArray(response.etiquetas)) {
                etiquetas = response.etiquetas.map(etiqueta => etiqueta.nombre.toLowerCase());
            }
        } catch (error) {
            $('#errores').html("Error al cargar etiquetas: " + error);
        }
    }

    // Autocompletado de etiquetas
    $('#tags').on('input', function () {
        const textoInput = $(this).val();
        actualizarSugerencias(textoInput);
    });

    // Función para actualizar sugerencias
    function actualizarSugerencias(texto) {
        const $sugerenciasContainer = $('#sugerencias-container');

        // Limpiar sugerencias previas
        $sugerenciasContainer.empty();

        if (!texto) {
            $sugerenciasContainer.hide().removeClass('visible');
            return;
        }

        // Obtener la última palabra después de la coma
        const palabras = texto.split(',');
        const ultimaPalabra = palabras[palabras.length - 1].trim().toLowerCase();

        if (!ultimaPalabra) {
            $sugerenciasContainer.hide().removeClass('visible');
            return;
        }

        // Buscar etiquetas que coincidan
        const sugerencias = etiquetas.filter(etiqueta =>
            etiqueta.includes(ultimaPalabra) && etiqueta !== ultimaPalabra
        );

        // Mostrar sugerencias
        if (sugerencias.length > 0) {
            sugerencias.forEach(sugerencia => {
                const $sugerencia = $('<div class="sugerencia"></div>').text(sugerencia);
                $sugerencia.on('click', function () {
                    // Reemplazar la última palabra con la sugerencia seleccionada
                    palabras[palabras.length - 1] = sugerencia;
                    $('#tags').val(palabras.join(', ') + ', ');
                    $sugerenciasContainer.hide().removeClass('visible');
                    $('#tags').focus();
                });
                $sugerenciasContainer.append($sugerencia);
            });

            // Forzar la visualización de las sugerencias
            $sugerenciasContainer.addClass('visible').show();

        } else {
            $sugerenciasContainer.hide().removeClass('visible');
        }
    }

    // Cerrar las sugerencias al hacer clic fuera
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.tags-wrapper').length) {
            $('#sugerencias-container').hide().removeClass('visible');
        }
    });

    // Gestionar envío del formulario
    $('#submit-form').on('submit', async function (e) {
        e.preventDefault();

        // Verificar si hay imágenes subidas
        const imagenesTempInfo = $('#imagenes-temporal').val();
        if (!imagenesTempInfo) {
            $("<div title='Missing Images'>There are no images associated with this artwork. Please upload at least one image.</div>").dialog({
                modal: true,
                dialogClass: 'tulipart-warning',
                width: 400,
                buttons: {
                    "Accept": function () {
                        $(this).dialog("close");
                    }
                }
            });
            return;
        }

        const imagenesTemporal = JSON.parse(imagenesTempInfo);

        const title = $('#title').val().trim();
        const description = $('#description').val().trim();
        const tags = $('#tags').val().trim();        // Verificar campos obligatorios
        if (!title || !description || !tags) {
            $("<div title='Incomplete Fields'>Please complete all required fields</div>").dialog({
                modal: true,
                dialogClass: 'tulipart-warning',
                width: 400,
                buttons: {
                    "Accept": function () {
                        $(this).dialog("close");
                    }
                }
            });
            return;
        }

        // Obtener valores de checkboxes
        const downloadable = $('#check1').is(':checked');
        const matureContent = $('#check2').is(':checked');
        const aiGenerated = $('#check3').is(':checked');

        // ID de usuario
        const idUsu = localStorage.getItem('idUsu');
        try {
            // Crear la obra y procesar las imágenes temporales
            const obraResponse = await $.ajax({
                url: DIR_API + "/crear_obra_con_imagenes",
                type: "POST",
                data: {
                    idUsu: idUsu,
                    title: title,
                    description: description,
                    downloadable: downloadable ? 1 : 0,
                    matureContent: matureContent ? 1 : 0,
                    aiGenerated: aiGenerated ? 1 : 0,
                    imagenes_temporal: JSON.stringify(imagenesTemporal)
                },
                dataType: "json",
                headers: { Authorization: "Bearer " + localStorage.token }
            }); if (obraResponse.error) {
                $(`<div title='Error'>Error creating artwork: ${obraResponse.error}</div>`).dialog({
                    modal: true,
                    dialogClass: 'tulipart-error',
                    width: 400,
                    buttons: {
                        "Accept": function () {
                            $(this).dialog("close");
                        }
                    }
                });
                return;
            }
            // Procesar etiquetas
            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            await procesarEtiquetas(tagsArray, obraResponse.idObra);

            // Limpiar localStorage después de éxito
            localStorage.removeItem('imagenesTemporal');
            // Mostrar mensaje de éxito
            $("<div title='Success!'>Artwork successfully published</div>").dialog({
                modal: true,
                dialogClass: 'tulipart-success success-dialog',
                width: 400,
                minHeight: 180,
                resizable: false,
                draggable: false,
                show: {
                    effect: "fadeIn",
                    duration: 300
                },
                buttons: {
                    "OK": function () {
                        $(this).dialog("close");
                        // Redirigir al perfil del usuario
                        window.location.href = `profile.html?id=${idUsu}`;
                    }
                }
            });
        } catch (error) {
            console.error("Error en el proceso de publicación:", error);
            $("<div title='Error'>An error occurred while publishing the artwork</div>").dialog({
                modal: true,
                dialogClass: 'tulipart-error',
                width: 400,
                buttons: {
                    "Accept": function () {
                        $(this).dialog("close");
                    }
                }
            });
            $('#errores').html(`Error: ${error.message || error}`).show();
        }
    });

    // Función para procesar etiquetas
    async function procesarEtiquetas(tagsArray, idObra) {
        for (const tag of tagsArray) {
            try {                // Buscar si la etiqueta ya existe
                const responseCheck = await $.ajax({
                    url: DIR_API + `/buscar_etiqueta/${tag}`,
                    type: "GET",
                    dataType: "json",
                    headers: { Authorization: "Bearer " + localStorage.token }
                });

                let idEtiqueta;

                // Si la etiqueta no existe, crearla
                if (responseCheck.etiquetas.length === 0) {
                    const responseCreate = await $.ajax({
                        url: DIR_API + "/crear_etiqueta",
                        type: "POST",
                        data: { nombre: tag },
                        dataType: "json",
                        headers: { Authorization: "Bearer " + localStorage.token }
                    });

                    if (responseCreate.error) {
                        console.error(`Error al crear etiqueta ${tag}:`, responseCreate.error);
                        continue;
                    }
                    idEtiqueta = responseCreate.idEtiqueta;
                } else {
                    idEtiqueta = responseCheck.etiquetas[0].idEtiqueta;
                }                
                // Crear relación etiqueta-obra
                await $.ajax({
                    url: DIR_API + "/crear_etiqueta_obra",
                    type: "POST",
                    data: {
                        idObra: idObra,
                        idEtiqueta: idEtiqueta
                    },
                    dataType: "json",
                    headers: { Authorization: "Bearer " + localStorage.token }
                });

            } catch (error) {
                $('#errores').html(`Error al procesar etiqueta ${tag}: ${error}`);
            }
        }
    }
});