'use client';

import { useState, useEffect } from 'react';
import { FaThermometerHalf, FaCloudShowersHeavy, FaSun } from 'react-icons/fa';

export default function HomePage() {
  const [location, setLocation] = useState({ 
    lat: null, 
    lon: null, 
    city: 'Cargando...', 
    error: null, 
    source: null 
  });
  const [connectionError, setConnectionError] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [askManual, setAskManual] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [messages, setMessages] = useState({
    coat: 'Esperando datos del clima...',
    rain: 'Esperando datos del clima...',
    uv: 'Esperando datos del clima...'
  });
  const [suggestion, setSuggestion] = useState({ text: '', link: '', visible: false });
  const [shareLinks, setShareLinks] = useState({ visible: false });

  const fetchWeather = async (locationData) => {
    if (!(locationData.source === 'auto' && locationData.lat && locationData.lon) && 
        !(locationData.source === 'manual' && locationData.city)) {
      return;
    }
  
    setLoadingWeather(true);
    // No actualizamos el estado de location aquí para evitar un bucle infinito
    setConnectionError(false);
  
    try {
      // Configurar un timeout para la solicitud
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      let apiUrl = '/api/weather?';
      if (locationData.source === 'auto') {
        apiUrl += `lat=${locationData.lat}&lon=${locationData.lon}`;
      } else {
        apiUrl += `city=${encodeURIComponent(locationData.city)}`;
      }
  
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        cache: 'no-store' // Evitar problemas de caché
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
        if (locationData.source === 'auto') {
          setLocation(prev => ({ ...prev, city: data.name }));
        }
      } else {
        let errorMessage = 'Error al obtener datos del clima';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no podemos parsear la respuesta como JSON, usamos el mensaje genérico
        }
        console.error('Error al obtener datos del clima:', errorMessage);
        setLocation(prev => ({ ...prev, error: errorMessage }));
        // Marcar como error de conexión si el mensaje lo indica
        if (errorMessage.toLowerCase().includes('conexión') || 
            errorMessage.toLowerCase().includes('internet') ||
            response.status === 503 || response.status === 408) {
          setConnectionError(true);
        }
      }
    } catch (error) {
      console.error('Error al obtener datos del clima:', error);
      
      // Manejar específicamente errores de conexión
      let errorMessage = error.message;
      let isConnectionError = false;
      
      if (error.name === 'AbortError') {
        errorMessage = 'La solicitud ha excedido el tiempo de espera. Verifica tu conexión a internet.';
        isConnectionError = true;
      } else if (error.message && (error.message.includes('network') || error.message.includes('fetch') || 
                 error.message.includes('internet') || error.message.includes('ERR_INTERNET_DISCONNECTED'))) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        isConnectionError = true;
      }
      
      setLocation(prev => ({ ...prev, error: errorMessage }));
      setConnectionError(isConnectionError);
    } finally {
      setLoadingWeather(false);
    }
  };
  

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Callback de éxito
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Obteniendo ciudad...',
            error: null,
            source: 'auto'
          });
        },
        // Callback de error
        (error) => {
          console.error('Error de geolocalización:', error);
          setLocation({
            lat: null,
            lon: null,
            city: 'No se pudo obtener ubicación',
            error: error.message,
            source: 'error'
          });
          setAskManual(true);
        },
        // Opciones
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocation({
        lat: null,
        lon: null,
        city: 'Geolocalización no soportada',
        error: 'Tu navegador no soporta geolocalización',
        source: 'error'
      });
      setAskManual(true);
    }
  }, []);
  
  // Efecto para obtener datos del clima cuando cambia la ubicación
  useEffect(() => {
    // Evitar ciclos infinitos verificando si realmente necesitamos actualizar
    if (location.source && ((location.source === 'auto' && location.lat && location.lon) || 
        (location.source === 'manual' && location.city))) {
      fetchWeather(location);
    }
  }, [location.lat, location.lon, location.city, location.source]);

  // Función para generar sugerencia de vestimenta basada en el clima
  const getClothingSuggestion = (weatherData) => {
    // Si no hay datos del clima, retornar objeto vacío
    if (!weatherData) {
      return { text: '', keyword: '' };
    }

    // Extraer datos necesarios del objeto weatherData
    const temp = weatherData.main.feels_like ?? weatherData.main.temp;
    const uvi = weatherData.uvi ?? 0; // Puede no estar presente
    const condition = weatherData.weather[0].main;
    const pop = weatherData.pop ?? 0; // Probabilidad de precipitación

    // Lógica para la sugerencia de vestimenta
    let suggestionText = '';
    let keyword = '';

    // Sugerencia basada en temperatura
    if (temp < 10) {
      suggestionText = 'Campera abrigada, bufanda y guantes. ¡Hace mucho frío!';
      keyword = 'campera invierno';
    } else if (temp < 15) {
      suggestionText = 'Abrigo o campera liviana. Está fresco.';
      keyword = 'campera media estacion';
    } else if (temp < 20) {
      suggestionText = 'Un buzo o sweater debería ser suficiente.';
      keyword = 'buzo algodon';
    } else if (temp < 25) {
      suggestionText = 'Remera manga larga o camisa liviana.';
      keyword = 'remera manga larga';
    } else {
      suggestionText = 'Remera liviana y ropa fresca.';
      keyword = 'remera verano';
    }

    // Añadir sugerencia para lluvia si es necesario
    if (pop > 0.4 || ['Rain', 'Drizzle', 'Thunderstorm'].includes(condition)) {
      suggestionText += ' Llevá un piloto o paraguas por la lluvia.';
      keyword = 'piloto impermeable ' + keyword;
    }

    // Añadir sugerencia para protección UV si es necesario
    if (uvi > 6) {
      suggestionText += ' No olvides gorra y protector solar por el sol fuerte.';
      if (temp > 20) {
        keyword = 'gorra verano ' + keyword;
      }
    }

    return { text: suggestionText, keyword };
  };

  // Función para manejar el clic en el botón "¿Qué me pongo?"
  const handleSuggestionClick = () => {
    if (!weather) return;
    
    const { text, keyword } = getClothingSuggestion(weather);
    // Construir el enlace de afiliado (usando MercadoLibre como ejemplo)
    // Nota: En un entorno real, deberías usar tu ID de afiliado real
    const affiliateId = process.env.NEXT_PUBLIC_AFFILIATE_ID_ML || 'APP_ABRIGO';
    const affiliateLink = `https://www.mercadolibre.com.ar/jm/search?q=${encodeURIComponent(keyword)}&affiliate=${affiliateId}`;
    
    setSuggestion({ text, link: affiliateLink, visible: true });
  };

  // Función para manejar el compartir
  const handleShare = () => {
    if (!weather || !location.city) return;
    
    // Construir el texto a compartir
    const shareText = `Clima en ${location.city}: ${Math.round(weather.main.temp)}°C. ${messages.coat} Chequealo en ${window.location.href}`;
    
    // Intentar usar la API Web Share si está disponible
    if (navigator.share) {
      navigator.share({
        title: '¿Puedo salir sin abrigo?',
        text: shareText
      }).catch(error => {
        console.error('Error al compartir:', error);
        setShareLinks({ visible: true });
      });
    } else {
      // Fallback para navegadores que no soportan Web Share API
      setShareLinks({ visible: true });
    }
  };

  // Función para generar mensajes personalizados basados en el clima
  const generateMessages = (weatherData) => {
    // Si no hay datos del clima, retornar mensajes por defecto
    if (!weatherData) {
      return {
        coat: 'Esperando datos del clima...',
        rain: 'Esperando datos del clima...',
        uv: 'Esperando datos del clima...'
      };
    }

    // Extraer datos necesarios del objeto weatherData
    const temp = weatherData.main.feels_like ?? weatherData.main.temp;
    const uvi = weatherData.uvi ?? 0; // Puede no estar presente
    const condition = weatherData.weather[0].main;
    const pop = weatherData.pop ?? 0; // Probabilidad de precipitación, puede no estar

    // Lógica para el mensaje de abrigo
    let coatMessage = '';
    if (temp < 10) {
      coatMessage = 'Abrigo sí o sí. Hace mucho frío.'; 
    } else if (temp < 15) {
      coatMessage = 'Sí, llevá abrigo. Está fresco.'; 
    } else if (temp < 20) {
      coatMessage = 'Quizás un abrigo liviano. Está templado.'; 
    } else if (temp < 25) {
      coatMessage = 'No hace falta abrigo. La temperatura es agradable.'; 
    } else {
      coatMessage = 'Dejá el abrigo en casa. Hace calor.'; 
    }

    // Lógica para el mensaje de lluvia
    let rainMessage = '';
    if (pop > 0.4 || ['Rain', 'Drizzle', 'Thunderstorm'].includes(condition)) {
      rainMessage = 'Llevá paraguas. Hay probabilidad de lluvia.'; 
    } else {
      rainMessage = 'No parece que llueva. Dejá el paraguas en casa.'; 
    }

    // Lógica para el mensaje de UV
    let uvMessage = '';
    if (uvi > 6) {
      uvMessage = 'El sol está heavy. Usá protector solar y gorro.'; 
    } else {
      uvMessage = 'El sol está tranqui. Igual, protector no viene mal.'; 
    }

    return {
      coat: coatMessage,
      rain: rainMessage,
      uv: uvMessage
    };
  };

  // Efecto para actualizar los mensajes cuando cambia el clima
  useEffect(() => {
    if (weather) {
      const newMessages = generateMessages(weather);
      // Comparar si los mensajes realmente cambiaron para evitar actualizaciones innecesarias
      if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
        setMessages(newMessages);
      }
    }
  }, [weather, messages]);

  // Función para buscar ciudades mientras el usuario escribe
  const searchCities = async (query) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/geocoding?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setCitySuggestions(data);
      } else {
        console.error('Error al buscar ciudades');
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('Error al buscar ciudades:', error);
      setCitySuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Efecto para buscar ciudades cuando cambia el input manual
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchCities(manualInput);
    }, 300); // Esperar 300ms después de que el usuario deje de escribir
    
    return () => clearTimeout(delayDebounce);
  }, [manualInput]);

  const handleManualSearch = (selectedCity) => {
    let cityData;
    
    if (selectedCity) {
      // Si se seleccionó una ciudad de las sugerencias
      cityData = {
        lat: selectedCity.lat,
        lon: selectedCity.lon,
        city: selectedCity.display || selectedCity.name,
        error: null,
        source: 'auto' // Usamos 'auto' porque tenemos coordenadas
      };
      setManualInput(selectedCity.display || selectedCity.name);
    } else if (manualInput.trim()) {
      // Si se presionó enter sin seleccionar una sugerencia
      cityData = {
        lat: null,
        lon: null,
        city: manualInput,
        error: null,
        source: 'manual'
      };
    } else {
      return; // No hacer nada si no hay entrada
    }
    
    setLocation(cityData);
    setAskManual(false);
    setCitySuggestions([]);
  };

  return (
    <main className="container mx-auto p-4 flex flex-col items-center min-h-screen bg-blue-50">
      <h1 className="text-4xl font-bold mt-8 mb-6 text-blue-800 text-center">¿Puedo salir sin abrigo?</h1>
      
      <div className="mt-4 mb-2 text-lg font-medium bg-white rounded-lg shadow-sm p-3 w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="text-gray-700 mb-1">📍 Ubicación actual:</div>
          <div className="text-2xl font-bold text-blue-700">{location.city}</div>
          {location.error && <div className="text-red-500 mt-1">({location.error})</div>}
        </div>
      </div>

      {!askManual && (
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setAskManual(true)}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Cambiar Ubicación
          </button>
          {connectionError && (
            <button 
              onClick={() => {
                setConnectionError(false);
                if (location.source === 'auto' && location.lat && location.lon) {
                  fetchWeather(location);
                } else if (location.source === 'manual' && location.city) {
                  fetchWeather(location);
                }
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm flex items-center"
            >
              <span className="mr-1">↻</span> Reintentar
            </button>
          )}
        </div>
      )}
      
      {askManual && (
        <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-md relative">
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <div className="relative w-full">
              <input 
                type="text" 
                value={manualInput} 
                onChange={(e) => setManualInput(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSearch();
                  }
                }}
                placeholder="Ingresá Ciudad, País" 
                className="border rounded py-1 px-2 w-full"
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin text-sm">⟳</div>
              )}
            </div>
            <button 
              onClick={() => handleManualSearch()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded w-full sm:w-auto"
            >
              Buscar
            </button>
          </div>
          
          {citySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
              {citySuggestions.map((city, index) => (
                <div 
                  key={`${city.name}-${city.country}-${index}`}
                  className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleManualSearch(city)}
                >
                  {city.display}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 mb-6 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-4">
          {loadingWeather ? (
            <div className="text-center py-4">
              <div className="text-blue-500 mb-2 animate-spin text-2xl">⟳</div>
              <p>Cargando datos del clima...</p>
            </div>
          ) : connectionError ? (
            <div className="text-center py-4">
              <div className="text-red-500 mb-2 text-4xl">⚠</div>
              <p className="text-red-600 font-medium mb-2">Problema de conexión</p>
              <p className="text-gray-700 mb-3">{location.error || 'No se pudo conectar con el servicio del clima. Verifica tu conexión a internet.'}</p>
              <button 
                onClick={() => {
                  if (location.source === 'auto' && location.lat && location.lon) {
                    fetchWeather(location);
                  } else if (location.source === 'manual' && location.city) {
                    fetchWeather(location);
                  }
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <span className="mr-2">↻</span> Reintentar
              </button>
            </div>
          ) : weather && weather.main && weather.weather && weather.weather[0] ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                  alt={`Icono de clima: ${weather.weather[0].description || 'clima'}`}
                  className="w-16 h-16"
                  width="64"
                  height="64"
                />
                <div className="text-5xl font-bold text-blue-700 ml-2">
                  {weather.main.temp !== undefined ? `${Math.round(weather.main.temp)}°C` : 'N/A'}
                </div>
              </div>
              <p className="text-lg capitalize mb-1">{weather.weather[0].description || 'Sin descripción'}</p>
              <p className="text-sm text-gray-600">Sensación térmica: {weather.main.feels_like !== undefined ? `${Math.round(weather.main.feels_like)}°C` : 'N/A'}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-sm">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Humedad: {weather.main.humidity !== undefined ? `${weather.main.humidity}%` : 'N/A'}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Viento: {weather.wind && weather.wind.speed !== undefined ? `${Math.round(weather.wind.speed * 3.6)} km/h` : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center mt-4 mb-2 bg-white p-3 rounded-lg shadow-sm w-full max-w-md">
        <FaThermometerHalf className="mr-2 text-xl text-red-500" />
        <p><span className="font-medium">🧥 Abrigo:</span> {messages.coat}</p>
      </div>
      
      <div className="flex items-center mt-4 mb-2 bg-white p-3 rounded-lg shadow-sm w-full max-w-md">
        <FaCloudShowersHeavy className="mr-2 text-xl text-blue-500" />
        <p><span className="font-medium">☔ Lluvia:</span> {messages.rain}</p>
      </div>
      
      <div className="flex items-center mt-4 mb-6 bg-white p-3 rounded-lg shadow-sm w-full max-w-md">
        <FaSun className="mr-2 text-xl text-yellow-500" />
        <p><span className="font-medium">🧴 Protección UV:</span> {messages.uv}</p>
      </div>
      
      <button 
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full mt-6 mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition duration-300 ease-in-out transform hover:scale-105" 
        disabled={!weather}
        onClick={handleSuggestionClick}
      >
        ¿Qué me pongo?
      </button>
      
      {suggestion.visible && (
        <div className="bg-white p-5 rounded-lg shadow-md mb-6 max-w-md text-center">
          <p className="mb-4 text-lg">{suggestion.text}</p>
          <a 
            href={suggestion.link} 
            target="_blank" 
            rel="noopener noreferrer sponsored"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-5 rounded-full inline-block shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
          >
            Ver opciones recomendadas
          </a>
          <p className="text-xs text-gray-500 mt-3">Enlaces patrocinados. Podemos recibir comisión por tus compras.</p>
        </div>
      )}
      
      <button 
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={handleShare}
        disabled={!weather}
      >
        Compartir
      </button>
      
      {shareLinks.visible && (
        <div className="bg-white p-5 rounded-lg shadow-md mb-8 max-w-md text-center">
          <p className="mb-4 text-lg font-medium text-blue-800">Compartir vía:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a 
              href={`whatsapp://send?text=${encodeURIComponent(`Clima en ${location.city}: ${Math.round(weather.main.temp)}°C. ${messages.coat} Chequealo en ${window.location.href}`)}`}
              className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full text-sm shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Clima en ${location.city}: ${Math.round(weather.main.temp)}°C. ${messages.coat} Chequealo en ${window.location.href}`)}`}
              className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-sm shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <a 
              href={`mailto:?subject=¿Puedo salir sin abrigo?&body=${encodeURIComponent(`Clima en ${location.city}: ${Math.round(weather.main.temp)}°C. ${messages.coat} Chequealo en ${window.location.href}`)}`}
              className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-full text-sm shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
              target="_blank"
              rel="noopener noreferrer"
            >
              Email
            </a>
          </div>
        </div>
      )}
      
      <footer className="mt-auto py-6 text-center w-full bg-white bg-opacity-70 rounded-t-lg">
        <p className="text-blue-700">Datos del clima proporcionados por <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">OpenWeatherMap</a></p>
        <p className="mt-2 text-gray-600">Hecho con ❤️ en Rosario</p>
      </footer>
    </main>
  );
}
