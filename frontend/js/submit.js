$(document).ready(function () {

    var etiquetas = [];
    cargarEtiquetas();

    const imagenesTemporal = JSON.parse(localStorage.getItem('imagenesTemporal') || '[]');

    // si hay imagenes mostrarlas
    if (imagenesTemporal.length > 0) {
        $('#imageContainer').empty();
        if (imagenesTemporal.length > 1) {
            const $slider = $('<div class="slider-container"></div>');
            const $sliderTrack = $('<div class="slider-track"></div>');
            imagenesTemporal.forEach((imagen, index) => {
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
            const $prevBtn = $('<button type="button" class="slider-btn prev">❮</button>');
            const $nextBtn = $('<button type="button" class="slider-btn next">❯</button>');
            $slider.append($sliderTrack, $prevBtn, $nextBtn);
            $('#imageContainer').append($slider);
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
            // para solo una imagen
            const imagen = imagenesTemporal[0];
            const $img = $('<img>').attr({
                src: imagen.urlTemporal,
                alt: imagen.nombreOriginal,
                'data-nombre-temporal': imagen.nombreTemporal,
                class: 'single-image'
            });
            $('#imageContainer').append($img);
        }

        // campo oculto info imagenes
        if ($('#imagenes-temporal').length === 0) {
            $('<input>').attr({
                type: 'hidden',
                id: 'imagenes-temporal',
                name: 'imagenes_temporal',
                value: JSON.stringify(imagenesTemporal)
            }).appendTo('#submit-form');
        }
    }

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

    // recomendar etiquetas en input
    $('#tags').on('input', function () {
        const textoInput = $(this).val();
        actualizarSugerencias(textoInput);
    });

    // actualizar sugerencias
    function actualizarSugerencias(texto) {
        const $sugerenciasContainer = $('#sugerencias-container');
        $sugerenciasContainer.empty();
        if (!texto) {
            $sugerenciasContainer.hide().removeClass('visible');
            return;
        }
        const palabras = texto.split(',');
        const ultimaPalabra = palabras[palabras.length - 1].trim().toLowerCase();
        if (!ultimaPalabra) {
            $sugerenciasContainer.hide().removeClass('visible');
            return;
        }
        const sugerencias = etiquetas.filter(etiqueta =>
            etiqueta.includes(ultimaPalabra) && etiqueta !== ultimaPalabra
        );
        if (sugerencias.length > 0) {
            sugerencias.forEach(sugerencia => {
                const $sugerencia = $('<div class="sugerencia"></div>').text(sugerencia);
                $sugerencia.on('click', function () {
                    palabras[palabras.length - 1] = sugerencia;
                    $('#tags').val(palabras.join(', ') + ', ');
                    $sugerenciasContainer.hide().removeClass('visible');
                    $('#tags').focus();
                });
                $sugerenciasContainer.append($sugerencia);
            });
            $sugerenciasContainer.addClass('visible').show();
        } else {
            $sugerenciasContainer.hide().removeClass('visible');
        }
    }

    // cerrar sugerencias al hacer clic fuera
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.tags-wrapper').length) {
            $('#sugerencias-container').hide().removeClass('visible');
        }
    });

    // submit form
    $('#submit-form').on('submit', async function (e) {
        e.preventDefault();
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
        const tags = $('#tags').val().trim();
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
        const downloadable = $('#check1').is(':checked');
        const matureContent = $('#check2').is(':checked');
        const aiGenerated = $('#check3').is(':checked');
        const idUsu = localStorage.getItem('idUsu');
        try {
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
            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            await procesarEtiquetas(tagsArray, obraResponse.idObra);
            localStorage.removeItem('imagenesTemporal');
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

    async function procesarEtiquetas(tagsArray, idObra) {
        for (const tag of tagsArray) {
            try {
                const responseCheck = await $.ajax({
                    url: DIR_API + `/buscar_etiqueta/${tag}`,
                    type: "GET",
                    dataType: "json",
                    headers: { Authorization: "Bearer " + localStorage.token }
                });
                let idEtiqueta;
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