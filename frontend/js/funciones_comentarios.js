// Funciones para manejar comentarios en TulipArt

// Función para eliminar un comentario de una obra
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

// Función para editar un comentario de una obra
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
