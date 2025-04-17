import { NextResponse } from 'next/server';

// Caché en memoria para almacenar resultados por ciudad/coordenadas
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en milisegundos

export async function GET(request) {
  // Extraer parámetros de la URL
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const city = searchParams.get('city');

  // Verificar que tenemos los parámetros necesarios
  if (!(lat && lon) && !city) {
    return NextResponse.json(
      { error: 'Faltan parámetros de ubicación' },
      { status: 400 }
    );
  }

  // Crear una clave única para la caché basada en los parámetros
  const cacheKey = lat && lon ? `${lat},${lon}` : city;
  
  // Verificar si tenemos datos en caché y si son válidos
  if (weatherCache.has(cacheKey)) {
    const cachedData = weatherCache.get(cacheKey);
    const now = Date.now();
    
    // Si los datos en caché son recientes, devolverlos
    if (now - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Usando datos en caché para: ${cacheKey}`);
      return NextResponse.json(cachedData.data);
    }
    // Si los datos son antiguos, eliminarlos de la caché
    weatherCache.delete(cacheKey);
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  // Usar una URL por defecto si la variable de entorno no está definida
  const baseUrl = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_URL || 'https://api.openweathermap.org/data/2.5';

  // Usar la API OneCall para obtener más datos, incluyendo amanecer/atardecer y UV
  let url = `${baseUrl}/weather?appid=${apiKey}&units=metric&lang=es`;

  if (lat && lon) {
    url += `&lat=${lat}&lon=${lon}`;
  } else if (city) {
    url += `&q=${encodeURIComponent(city)}`;
  }

  try {
    // Agregar un timeout para evitar esperas largas en caso de problemas de red
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

    const response = await fetch(url, {
      signal: controller.signal,
      // Agregar cache: 'no-store' para evitar problemas de caché
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la API del clima: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Error al obtener datos del clima: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Obtener datos adicionales con OneCall API para tener amanecer/atardecer y UV
    if (data && data.coord) {
      try {
        const oneCallUrl = `${baseUrl}/onecall?lat=${data.coord.lat}&lon=${data.coord.lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=metric&lang=es`;
        
        const oneCallResponse = await fetch(oneCallUrl, {
          cache: 'no-store'
        });
        
        if (oneCallResponse.ok) {
          const oneCallData = await oneCallResponse.json();
          
          // Añadir datos relevantes al objeto principal
          if (oneCallData.current) {
            data.uvi = oneCallData.current.uvi;
            data.sunrise = oneCallData.current.sunrise;
            data.sunset = oneCallData.current.sunset;
          }
          
          if (oneCallData.daily && oneCallData.daily.length > 0) {
            data.pop = oneCallData.daily[0].pop; // Probabilidad de precipitación
          }
        }
      } catch (error) {
        console.error('Error al obtener datos adicionales del clima:', error);
        // No fallamos la petición principal si los datos adicionales fallan
      }
    }
    
    // Guardar en caché
    weatherCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener datos del clima:', error);
    
    // Manejar específicamente errores de conexión
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'La solicitud ha excedido el tiempo de espera. Verifica tu conexión a internet.' },
        { status: 408 }
      );
    }
    
    // Verificar si es un error de red
    if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
      return NextResponse.json(
        { error: 'Error de conexión. Verifica tu conexión a internet.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Error al obtener datos del clima: ${error.message}` },
      { status: 500 }
    );
  }
}
  