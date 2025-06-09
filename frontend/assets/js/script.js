// Modificar script.js para el nuevo enfoque de imágenes temporales

$(function () {

    var ul = $('#upload ul');

    // Almacenar información de imágenes temporales
    var imagenesTemporal = [];

    // Si hay imágenes almacenadas previamente, recuperarlas
    var imagenesGuardadas = localStorage.getItem('imagenesTemporal');
    if (imagenesGuardadas) {
        try {
            imagenesTemporal = JSON.parse(imagenesGuardadas);
            // Si ya hay imágenes, activar el botón de continuar
            if (imagenesTemporal.length > 0) {
                $('button[type="submit"]').prop('disabled', false).addClass('active');
            }
        } catch (e) {
            localStorage.removeItem('imagenesTemporal');
        }
    }

    // Verificar si el drop-here existe, si no, crearlo
    if ($('#drop-here').length === 0) {
        $('#drop').html('<div id="drop-here">Drop here your art</div><ul></ul>');
    }

    // Añadir campo de entrada de archivo oculto si no existe
    if ($('#fileupload').length === 0) {
        $('<input type="file" id="fileupload" name="file" multiple style="display:none">').appendTo('#drop');

        // Permitir abrir el diálogo de selección de archivo al hacer clic en el área
        $('#drop').on('click', function (e) {
            if ($(e.target).is('#drop, #drop-here')) {
                $('#fileupload').click();
            }
        });
    }

    // Inicializar el plugin jQuery File Upload
    $('#upload').fileupload({
        // URL a la que se enviarán las imágenes
        // Usa la configuración global para la API
        // Requiere que config.js esté incluido antes
        url: (typeof appConfig !== 'undefined' ? appConfig.apiBaseUrl : '/backend/servicios_rest_protect') + '/subir_imagen_temporal',
        dataType: 'json',
        // Establecer la zona de drop
        dropZone: $('#drop'),
        // Asignar el input de archivos
        fileInput: $('#fileupload'),

        // Esta función se llama cuando un archivo se añade a la cola
        add: function (e, data) {
            // Verificar que el archivo es una imagen
            var fileType = data.files[0].type;
            if (fileType != 'image/jpeg' && fileType != 'image/png' && fileType != 'image/gif') {
                alert('Por favor, sube solo imágenes (JPEG, PNG, GIF)');
                return;
            }

            // Crear un elemento más simple para la lista
            var tpl = $('<li class="working"></li>');

            // Añadir un indicador de carga circular
            $('<input type="text" value="0" data-width="40" data-height="40"' +
                ' data-fgColor="#0788a5" data-readOnly="1" data-bgColor="#3e4043" />').appendTo(tpl);

            // Añadir el nombre del archivo (truncado si es muy largo)
            const fileName = data.files[0].name.length > 20
                ? data.files[0].name.substring(0, 17) + '...'
                : data.files[0].name;

            $('<p></p>').text(fileName).appendTo(tpl);

            // Añadir botón para cancelar la subida
            $('<span class="cancel-upload">✖</span>')
                .appendTo(tpl)
                .on('click', function () {
                    if (data.jqXHR) {
                        data.jqXHR.abort();
                    }
                    tpl.fadeOut(function () {
                        $(this).remove();
                    });
                });

            // Añadir el HTML al elemento UL
            data.context = tpl.appendTo(ul);

            // Inicializar el plugin knob
            tpl.find('input').knob();

            // Añadir el token si es necesario
            if (localStorage.getItem('token')) {
                data.formData = {
                    token: localStorage.getItem('token')
                };
            }

            // Subir automáticamente
            data.submit();
        },

        progress: function (e, data) {
            // Calcular el porcentaje completado de la subida
            var progress = parseInt(data.loaded / data.total * 100, 10);

            // Actualizar el campo de entrada oculto y disparar un cambio
            data.context.find('input').val(progress).change();

            if (progress == 100) {
                data.context.removeClass('working');
            }
        },

        // Modificar la función done en script.js para el nuevo enfoque

        done: function (e, data) {
            console.log("Respuesta del servidor:", data.result);
            // Manejar la respuesta del servidor después de la subida
            if (data.result.error) {
                data.context.addClass('error');
                data.context.find('p').append('<br><strong>Error: ' + data.result.error + '</strong>');
                return;
            }

            // La subida fue exitosa
            data.context.addClass('success');

            // Guardar la información de la imagen temporal
            if (data.result.nombreTemporal && data.result.urlTemporal) {
                // Almacenar información de la imagen
                const infoImagen = {
                    nombreTemporal: data.result.nombreTemporal,
                    nombreOriginal: data.files[0].name,
                    urlTemporal: data.result.urlTemporal
                };

                imagenesTemporal.push(infoImagen);

                // Reorganizar el contenido del elemento li
                data.context.empty();

                // Crear contenedor para la imagen con posición relativa
                const $imgContainer = $('<div class="img-container" style="position:relative;"></div>');

                // Añadir el botón de cancelar al contenedor de imagen
                const $cancelBtn = $('<span class="cancel-upload">✖</span>');
                $cancelBtn.appendTo($imgContainer);

                // Añadir vista previa de la imagen 
                $('<img>').attr({
                    src: data.result.urlTemporal,
                    alt: data.files[0].name,
                    class: 'preview-img'
                }).appendTo($imgContainer);

                // Añadir el nombre del archivo
                const fileName = data.files[0].name.length > 20
                    ? data.files[0].name.substring(0, 17) + '...'
                    : data.files[0].name;

                $('<p></p>').text(fileName).appendTo($imgContainer);

                // Añadir el contenedor al elemento li
                $imgContainer.appendTo(data.context);

                // Configurar el evento de cancelar
                $cancelBtn.on('click', function (e) {
                    e.stopPropagation(); // Evitar que el evento se propague

                    // Encontrar el índice de esta imagen en el array
                    const index = imagenesTemporal.findIndex(img =>
                        img.nombreTemporal === infoImagen.nombreTemporal
                    );

                    if (index !== -1) {
                        // Eliminar la imagen del array
                        imagenesTemporal.splice(index, 1);
                        // Actualizar el localStorage
                        localStorage.setItem('imagenesTemporal', JSON.stringify(imagenesTemporal));
                    }

                    // Eliminar el elemento visual con animación
                    data.context.fadeOut(function () {
                        $(this).remove();

                        // Desactivar el botón si no quedan imágenes
                        if (imagenesTemporal.length === 0) {
                            $('button[type="submit"]').prop('disabled', true).removeClass('active');
                        }
                    });
                });

                // Guardar la información en localStorage
                localStorage.setItem('imagenesTemporal', JSON.stringify(imagenesTemporal));

                // Activar el botón de submit cuando haya al menos una imagen
                $('button[type="submit"]').prop('disabled', false).addClass('active');
            }
        },

        fail: function (e, data) {
            // Algo ha ido mal!
            data.context.addClass('error');
            if (data.errorThrown !== 'abort') {
                data.context.find('p').append('<br><strong>Error: ' + (data.errorThrown || 'Error en la subida') + '</strong>');
            }
        }
    });

    // Prevenir la acción predeterminada cuando se suelta un archivo en la ventana
    $(document).on('drop dragover', function (e) {
        e.preventDefault();
    });

    // Cambiar apariencia del área de drop cuando se arrastra un archivo sobre ella
    $('#drop').on('dragenter', function () {
        $(this).addClass('active');
    }).on('dragleave dragend drop', function () {
        $(this).removeClass('active');
    });

    // Manejar el envío del formulario
    $('#upload').on('submit', function (e) {
        e.preventDefault();

        // Comprobar que hay imágenes subidas
        if (imagenesTemporal.length === 0) {
            alert('Por favor, sube al menos una imagen antes de continuar');
            return;
        }

        // Redireccionar a la página de submit
        window.location.href = 'submit.html';
    });

    // Función auxiliar que formatea los tamaños de archivo
    function formatFileSize(bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }

        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' GB';
        }

        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' MB';
        }

        return (bytes / 1000).toFixed(2) + ' KB';
    }
});