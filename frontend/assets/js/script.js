// Modificar script.js para el nuevo enfoque de imágenes temporales

$(function () {

    var ul = $('#upload ul');

    var imagenesTemporal = [];

    var imagenesGuardadas = localStorage.getItem('imagenesTemporal');
    if (imagenesGuardadas) {
        try {            imagenesTemporal = JSON.parse(imagenesGuardadas);
            // si ya hay imágenes activar botón continuar
            if (imagenesTemporal.length > 0) {
                $('#upload-submit').removeClass('disabled-look').addClass('active');
            }
        } catch (e) {
            localStorage.removeItem('imagenesTemporal');
        }
    }

    if ($('#drop-here').length === 0) {
        $('#drop').html('<div id="drop-here">Drop here your art</div><ul></ul>');
    }

    if ($('#fileupload').length === 0) {
        $('<input type="file" id="fileupload" name="file" multiple style="display:none">').appendTo('#drop');

        $('#drop').on('click', function (e) {
            if ($(e.target).is('#drop, #drop-here')) {
                $('#fileupload').click();
            }
        });
    }

    $('#upload').fileupload({
        url: 'https://tulipart-production.up.railway.app/subir_imagen_temporal',
        dataType: 'json',
        dropZone: $('#drop'),
        fileInput: $('#fileupload'),

        // se llama cuando un archivo se añade a la cola
        add: function (e, data) {
            // verificar que el archivo es una imagen
            var fileType = data.files[0].type;
            if (fileType != 'image/jpeg' && fileType != 'image/png' && fileType != 'image/gif') {
                alert('Por favor, sube solo imágenes (JPEG, PNG, GIF)');
                return;
            }

            var tpl = $('<li class="working"></li>');

            // indicador carga
            $('<input type="text" value="0" data-width="40" data-height="40"' +
                ' data-fgColor="#0788a5" data-readOnly="1" data-bgColor="#3e4043" />').appendTo(tpl);

            // nombre del archivo truncado si es muy largo
            const fileName = data.files[0].name.length > 20 ? data.files[0].name.substring(0, 17) + '...' : data.files[0].name;

            $('<p></p>').text(fileName).appendTo(tpl);

            // botón cancelar la subida
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

            data.context = tpl.appendTo(ul);
            tpl.find('input').knob();

            // añadir el token si es necesario
            if (localStorage.getItem('token')) {
                data.formData = {
                    token: localStorage.getItem('token')
                };
            }

            data.submit();
        },

        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            data.context.find('input').val(progress).change();
            if (progress == 100) {
                data.context.removeClass('working');
            }
        },

        done: function (e, data) {

            if (data.result.error) {
                data.context.addClass('error');
                data.context.find('p').append('<br><strong>Error: ' + data.result.error + '</strong>');
                return;
            }

            data.context.addClass('success');

            // guardar info imagen temporal
            if (data.result.nombreTemporal && data.result.urlTemporal) {
                const infoImagen = {
                    nombreTemporal: data.result.nombreTemporal,
                    nombreOriginal: data.files[0].name,
                    urlTemporal: data.result.urlTemporal
                };

                imagenesTemporal.push(infoImagen);
                data.context.empty();
                const $imgContainer = $('<div class="img-container" style="position:relative;"></div>');
                const $cancelBtn = $('<span class="cancel-upload">✖</span>');
                $cancelBtn.appendTo($imgContainer);

                $('<img>').attr({
                    src: data.result.urlTemporal,
                    alt: data.files[0].name,
                    class: 'preview-img'
                }).appendTo($imgContainer);

                const fileName = data.files[0].name.length > 20 ? data.files[0].name.substring(0, 17) + '...' : data.files[0].name;
                $('<p></p>').text(fileName).appendTo($imgContainer);
                $imgContainer.appendTo(data.context);

                $cancelBtn.on('click', function (e) {
                    e.stopPropagation();

                    // encontrar índice imagen en el array
                    const index = imagenesTemporal.findIndex(img =>
                        img.nombreTemporal === infoImagen.nombreTemporal
                    );

                    if (index !== -1) {
                        // eliminar la imagen del array
                        imagenesTemporal.splice(index, 1);
                        // actualizar el localStorage
                        localStorage.setItem('imagenesTemporal', JSON.stringify(imagenesTemporal));
                    }

                    data.context.fadeOut(function () {
                        $(this).remove();                        // desactivar el botón si no quedan imágenes
                        if (imagenesTemporal.length === 0) {
                            $('#upload-submit').addClass('disabled-look').removeClass('active');
                        }
                    });
                });

                // guardar la información en localStorage                localStorage.setItem('imagenesTemporal', JSON.stringify(imagenesTemporal));                // activar botón submit cuando haya al menos una imagen
                $('#upload-submit').removeClass('disabled-look').addClass('active');
                
                // Ocultar el mensaje de error si estaba visible
                $('#error-message-upload').css({
                    'opacity': '0',
                    'visibility': 'hidden'
                });
            }
        },

        fail: function (e, data) {
            data.context.addClass('error');
            if (data.errorThrown !== 'abort') {
                data.context.find('p').append('<br><strong>Error: ' + (data.errorThrown || 'Error en la subida') + '</strong>');
            }
        }
    });

    $(document).on('drop dragover', function (e) {
        e.preventDefault();
    });

    $('#drop').on('dragenter', function () {
        $(this).addClass('active');
    }).on('dragleave dragend drop', function () {
        $(this).removeClass('active');
    });    // envío formulario
    $('#upload').on('submit', function (e) {
        e.preventDefault();

        if (imagenesTemporal.length === 0) {
            // Mostrar el mensaje de error cambiando su visibilidad
            $('#error-message-upload').css({
                'opacity': '1',
                'visibility': 'visible'
            });
            return;
        }

        window.location.href = 'submit.html';
    });
      // Añadir evento click al botón de submit aunque parezca deshabilitado
    $('#upload-submit').on('click', function(e) {
        if ($(this).hasClass('disabled-look')) {
            e.preventDefault();
            // Mostrar el mensaje de error cambiando su visibilidad
            $('#error-message-upload').css({
                'opacity': '1',
                'visibility': 'visible'
            });
            return false;
        }
    });

});