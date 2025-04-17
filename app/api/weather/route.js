import { NextResponse } from 'next/server';

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

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  // Usar una URL por defecto si la variable de entorno no está definida
  const baseUrl = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_URL || 'https://api.openweathermap.org/data/2.5';

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
  