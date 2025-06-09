// Función para cargar obras relacionadas por etiquetas
async function cargar_obras_relacionadas_por_tags(idObra, contenedor = '#related-by-tags', limite = 6) {
    try {
        // Obtener las etiquetas de la obra actual
        const etiquetasObra = await obtener_etiquetas_obra(idObra);
        
        if (!etiquetasObra || etiquetasObra.length === 0) {
            $(contenedor).html('<p>There are no tags to find related artworks</p>');
            return;
        }
        
        // Extraer solo los IDs de etiquetas
        const idsEtiquetas = etiquetasObra.map(etiqueta => etiqueta.idEtiqueta);
        
        // Buscar obras que comparten etiquetas con esta obra
        const obrasRelacionadas = await buscar_obras_por_etiquetas(idsEtiquetas, idObra);
        
        // Limpiar el contenedor
        $(contenedor).empty();
        
        if (obrasRelacionadas && obrasRelacionadas.length > 0) {
            // Limitar a máximo 6 obras relacionadas
            const obrasAMostrar = obrasRelacionadas.slice(0, limite);
            
            // Crear estructura del slider
            const sliderHTML = `
                <div class="related-slider-container">
                    <div class="related-slider-track">
                        ${obrasAMostrar.map((obra, index) => `
                            <div class="related-slide" data-index="${index}">
                                <div class="related-slide-image">
                                    <a href="post.html?id=${obra.idObra}" class="slide-image-link">
                                        <img src="${obra.urlFoto}" alt="${obra.nombreObra}">
                                    </a>
                                </div>
                                <div class="related-slide-info">
                                    <a href="post.html?id=${obra.idObra}" class="slide-title">${obra.nombreObra}</a>
                                    <a href="profile.html?id=${obra.idUsu}" class="slide-author">By ${obra.nombreUsuario}</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>                    ${obrasAMostrar.length > 1 ? `
                        <div class="related-slider-controls">
                            <button class="related-slider-prev">&lt;</button>
                            <div class="related-slider-dots">
                                ${obrasAMostrar.map((_, index) => `
                                    <span class="related-slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                                `).join('')}
                            </div>
                            <button class="related-slider-next">&gt;</button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            $(contenedor).html(sliderHTML);
            
            // Inicializar el slider si hay más de una obra
            if (obrasAMostrar.length > 1) {
                inicializarSlider(contenedor);
            }
        } else {
            $(contenedor).html('<p>No related artworks found</p>');
        }
    } catch (error) {
        console.error("Error al cargar obras relacionadas por etiquetas:", error);
        $(contenedor).html('<p>Error loading related artworks</p>');
    }
}

// Función auxiliar para buscar obras que comparten etiquetas
async function buscar_obras_por_etiquetas(idsEtiquetas, idObraExcluir) {
    try {
        // Asegurarse de que hay etiquetas para buscar
        if (!idsEtiquetas || idsEtiquetas.length === 0) {
            $('#errores').html("No hay etiquetas para buscar obras relacionadas");
            return [];
        }

        const response = await $.ajax({
            url: DIR_API + "/obras_por_etiquetas",
            type: "GET",
            data: {
                etiquetas: idsEtiquetas.join(','),
                excluir: idObraExcluir
            },
            dataType: "json"
        });

        if (response.error) {
            $('#errores').html("Error en la respuesta del servidor: " + response.error);
            return [];
        }

        if (!response.obras || response.obras.length === 0) {
            $('#errores').html("No related artworks found by tags");
            return [];
        }

        // Procesar cada obra para obtener su primera foto
        const obrasConFotos = [];
        for (const obra of response.obras) {
            // Obtener la primera foto de la obra
            const fotosResponse = await obtener_fotos_obra(obra.idObra);
            const fotos = fotosResponse || [];
            const primeraFoto = fotos.length > 0
                ? `../../backend/images/obras/${fotos[0].foto}`
                : "../imagenes/arte/default.webp";

            // Obtener datos del usuario autor
            const usuario = await obtener_datos_usuario(obra.idUsu);
            
            obrasConFotos.push({
                ...obra,
                urlFoto: primeraFoto,
                nombreUsuario: usuario.nombreUsuario || "Usuario desconocido"
            });
        }

        $('#errores').html(`Se encontraron ${obrasConFotos.length} obras relacionadas por etiquetas`);
        return obrasConFotos;
    } catch (error) {
        $('#errores').html("Error al buscar obras por etiquetas: " + error);
        return [];
    }
}

// Función para inicializar el slider
function inicializarSlider(contenedor) {
    const container = $(contenedor).find('.related-slider-container');
    const track = container.find('.related-slider-track');
    const slides = container.find('.related-slide');
    const dots = container.find('.related-slider-dot');
    const prevButton = container.find('.related-slider-prev');
    const nextButton = container.find('.related-slider-next');
    const slideWidth = slides.first().outerWidth();
    const slideCount = slides.length;
    let currentIndex = 0;
    
    // Configurar el ancho total del track según el número de slides
    track.css('width', `${slideWidth * slideCount}px`);
    
    // Función para mostrar un slide específico
    function showSlide(index) {
        if (index < 0) index = 0;
        if (index >= slideCount) index = slideCount - 1;
        
        currentIndex = index;
        
        // Animar el desplazamiento del track
        track.css('transform', `translateX(-${currentIndex * slideWidth}px)`);
        
        // Actualizar indicadores de dots
        dots.removeClass('active');
        dots.eq(currentIndex).addClass('active');
    }
    
    // Eventos de los botones de navegación
    prevButton.on('click', function() {
        showSlide(currentIndex - 1);
    });
    
    nextButton.on('click', function() {
        showSlide(currentIndex + 1);
    });
    
    // Eventos de los dots
    dots.on('click', function() {
        const index = $(this).data('index');
        showSlide(index);
    });
    
    // Mostrar el primer slide
    showSlide(0);
}
