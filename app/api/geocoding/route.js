import { NextResponse } from 'next/server';

export async function GET(request) {
  // Extraer parámetros de la URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = searchParams.get('limit') || 5; // Número máximo de resultados

  // Verificar que tenemos el parámetro necesario
  if (!query) {
    return NextResponse.json(
      { error: 'Falta el parámetro de búsqueda' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  // URL para la API de geocodificación de OpenWeatherMap
  const geocodingUrl = 'https://api.openweathermap.org/geo/1.0/direct';
  const url = `${geocodingUrl}?q=${encodeURIComponent(query)}&limit=${limit}&appid=${apiKey}`;

  try {
    // Agregar un timeout para evitar esperas largas en caso de problemas de red
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store' // Evitar problemas de caché
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la API de geocodificación: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Error al buscar ciudades: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Formatear los resultados para que sean más fáciles de usar
    const formattedResults = data.map(city => ({
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
      display: `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`
    }));
    
    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error al buscar ciudades:', error);
    
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
      { error: `Error al buscar ciudades: ${error.message}` },
      { status: 500 }
    );
  }
}