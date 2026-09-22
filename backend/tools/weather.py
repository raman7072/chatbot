"""Weather Tool — Real-time weather using Open-Meteo (no API key required)."""

import requests
from langchain_core.tools import tool

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

WMO_CODES = {
    0: "☀️ Clear sky", 1: "🌤️ Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
    45: "🌫️ Foggy", 48: "🌫️ Icy fog",
    51: "🌦️ Light drizzle", 53: "🌦️ Moderate drizzle", 55: "🌧️ Dense drizzle",
    61: "🌧️ Slight rain", 63: "🌧️ Moderate rain", 65: "🌧️ Heavy rain",
    71: "🌨️ Slight snow", 73: "❄️ Moderate snow", 75: "❄️ Heavy snow",
    80: "🌦️ Slight showers", 81: "🌧️ Moderate showers", 82: "⛈️ Violent showers",
    95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm with hail", 99: "⛈️ Thunderstorm with heavy hail",
}


@tool
def get_weather(location: str) -> str:
    """
    Get current weather conditions and a 7-day forecast for any location in the world.
    Uses Open-Meteo API — no API key required.

    Args:
        location: City name or location (e.g., "New York", "London", "Mumbai")

    Returns:
        Formatted current weather and forecast data.
    """
    try:
        # Step 1: Geocode the location
        geo_resp = requests.get(
            GEOCODING_URL,
            params={"name": location, "count": 1, "language": "en", "format": "json"},
            timeout=10
        )
        geo_data = geo_resp.json()

        if not geo_data.get("results"):
            return f"Location '{location}' not found. Please try a more specific location name."

        place = geo_data["results"][0]
        lat, lon = place["latitude"], place["longitude"]
        city_name = place.get("name", location)
        country = place.get("country", "")
        timezone = place.get("timezone", "UTC")

        # Step 2: Fetch weather
        weather_resp = requests.get(
            WEATHER_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": [
                    "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                    "weather_code", "wind_speed_10m", "wind_direction_10m",
                    "surface_pressure", "visibility", "uv_index"
                ],
                "daily": [
                    "temperature_2m_max", "temperature_2m_min", "weather_code",
                    "precipitation_sum", "wind_speed_10m_max", "sunrise", "sunset"
                ],
                "timezone": timezone,
                "forecast_days": 7,
            },
            timeout=10
        )
        weather_data = weather_resp.json()
        current = weather_data.get("current", {})
        daily = weather_data.get("daily", {})

        # Format current weather
        wmo = current.get("weather_code", 0)
        condition = WMO_CODES.get(wmo, "Unknown")
        temp = current.get("temperature_2m", "N/A")
        feels_like = current.get("apparent_temperature", "N/A")
        humidity = current.get("relative_humidity_2m", "N/A")
        wind = current.get("wind_speed_10m", "N/A")
        visibility = current.get("visibility", "N/A")
        uv = current.get("uv_index", "N/A")

        result = f"## 🌍 Weather Report: {city_name}, {country}\n\n"
        result += f"### Current Conditions\n"
        result += f"- **Condition**: {condition}\n"
        result += f"- **Temperature**: {temp}°C (Feels like {feels_like}°C)\n"
        result += f"- **Humidity**: {humidity}%\n"
        result += f"- **Wind Speed**: {wind} km/h\n"
        if visibility is not None and visibility != "N/A":
            try:
                vis_km = float(visibility) / 1000.0
                result += f"- **Visibility**: {vis_km:.1f} km\n"
            except (ValueError, TypeError):
                pass
        result += f"- **UV Index**: {uv}\n"

        # Format 7-day forecast
        result += f"\n### 📅 7-Day Forecast\n"
        dates = daily.get("time", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        codes = daily.get("weather_code", [])
        precip = daily.get("precipitation_sum", [])
        sunrises = daily.get("sunrise", [])
        sunsets = daily.get("sunset", [])

        for i, date in enumerate(dates[:7]):
            day_condition = WMO_CODES.get(codes[i] if i < len(codes) else 0, "")
            max_t = max_temps[i] if i < len(max_temps) else "N/A"
            min_t = min_temps[i] if i < len(min_temps) else "N/A"
            rain = precip[i] if i < len(precip) else 0
            sunrise = sunrises[i].split("T")[1] if i < len(sunrises) else ""
            sunset = sunsets[i].split("T")[1] if i < len(sunsets) else ""

            result += f"- **{date}**: {day_condition} | 🌡️ {min_t}°–{max_t}°C"
            if rain and rain > 0:
                result += f" | 🌧️ {rain}mm"
            if sunrise and sunset:
                result += f" | 🌅 {sunrise} – 🌇 {sunset}"
            result += "\n"

        result += f"\n*Data provided by Open-Meteo · Coordinates: {lat:.2f}°N, {lon:.2f}°E*"
        return result

    except requests.Timeout:
        return "Weather service timed out. Please try again."
    except Exception as e:
        return f"Weather fetch failed: {str(e)}"
