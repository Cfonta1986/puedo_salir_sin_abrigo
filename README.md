# ¿Puedo salir sin abrigo?

Una aplicación web que te ayuda a decidir si necesitas llevar abrigo, paraguas o protección solar según las condiciones climáticas actuales de tu ubicación.

![Captura de la aplicación](https://via.placeholder.com/800x450.png?text=Puedo+salir+sin+abrigo)

## 📋 Características

- **Detección automática de ubicación** mediante geolocalización del navegador
- **Búsqueda manual de ciudades** con autocompletado
- **Información climática en tiempo real** utilizando la API de OpenWeatherMap
- **Recomendaciones personalizadas** sobre:
  - Si necesitas abrigo según la temperatura
  - Si debes llevar paraguas según la probabilidad de lluvia
  - Si requieres protección solar según el índice UV
- **Sugerencias de vestimenta** adaptadas a las condiciones climáticas
- **Enlaces de afiliados** a productos recomendados
- **Función para compartir** el pronóstico con amigos

## 🚀 Tecnologías utilizadas

- [Next.js 15](https://nextjs.org/) - Framework de React con renderizado del lado del servidor
- [React 19](https://react.dev/) - Biblioteca para construir interfaces de usuario
- [Tailwind CSS 4](https://tailwindcss.com/) - Framework CSS utilitario
- [React Icons](https://react-icons.github.io/react-icons/) - Iconos para React
- [OpenWeatherMap API](https://openweathermap.org/api) - API para datos meteorológicos

## 🛠️ Configuración

### Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18.17 o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)

### Obtener una API Key de OpenWeatherMap

1. Regístrate en [OpenWeatherMap](https://home.openweathermap.org/users/sign_up) si aún no tienes una cuenta
2. Inicia sesión y ve a la sección [API Keys](https://home.openweathermap.org/api_keys)
3. Genera una nueva API Key (puede tardar unas horas en activarse)

### Configuración del proyecto

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/abrigo-app.git
   cd abrigo-app
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:
   ```
   # Configuración para OpenWeatherMap API
   NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=tu_api_key_aquí
   NEXT_PUBLIC_OPENWEATHERMAP_API_URL=https://api.openweathermap.org/data/2.5

   # Configuración para enlaces afiliados (opcional)
   NEXT_PUBLIC_AFFILIATE_ID_ML=tu_id_de_afiliado
   ```

   Reemplaza `tu_api_key_aquí` con tu API Key de OpenWeatherMap y `tu_id_de_afiliado` con tu ID de afiliado de MercadoLibre (si lo tienes).

## 🖥️ Ejecución

### Modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

### Compilar para producción

```bash
npm run build
```

### Iniciar en modo producción

```bash
npm start
```

## 🔧 Personalización

### Modificar mensajes y recomendaciones

Puedes personalizar los mensajes y recomendaciones editando las funciones `generateMessages` y `getClothingSuggestion` en el archivo `app/page.js`.

### Cambiar el proveedor de enlaces de afiliados

Por defecto, la aplicación utiliza enlaces de afiliados de MercadoLibre. Puedes modificar la función `handleSuggestionClick` en `app/page.js` para utilizar otro proveedor.

## 📱 Compatibilidad

La aplicación es completamente responsive y funciona en dispositivos móviles y de escritorio. Se recomienda el uso de navegadores modernos como Chrome, Firefox, Safari o Edge para una mejor experiencia.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ en Rosario, Argentina.