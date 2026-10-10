"""Air Watcher Agent: Analyzes environmental forecasts and plume dynamics."""

from typing import Dict, Any
from app.core.bedrock import bedrock_provider
from app.services.forecast import forecast_service
from app.services.inversion import inversion_service
from app.services.plume_tracker import plume_tracker


class AirWatcherAgent:
    """Specialized agent for environmental atmospheric interpretation."""

    def analyze_conditions(self, area: str = "noida") -> Dict[str, Any]:
        forecast = forecast_service.get_forecast(area=area, hours=72)
        inversion = inversion_service.get_inversion_status(area=area)
        plume = plume_tracker.get_plume_trajectory(area=area)

        summary = (
            f"Air Watcher Assessment for {area.title()}: Peak coupled AQI reaches {forecast.summary['peak_aqi']} "
            f"({forecast.summary['peak_category']}) at hour +{forecast.summary['peak_hour']}. "
            f"Strong inversion is active from +18h to +42h, trapping particulate emissions close to the surface. "
            f"Smoke plume from {plume.fire_count_upwind} upwind active fires in Punjab/Haryana is estimated to arrive in "
            f"approximately {plume.estimated_arrival_hours} hours via {plume.wind_direction_cardinal} winds."
        )

        return {
            "agent": "Air Watcher",
            "area": area,
            "status": "ANALYSIS_COMPLETE",
            "summary": summary,
            "peak_aqi": forecast.summary["peak_aqi"],
            "inversion_status": inversion.inversion_status_now,
            "plume_arrival_h": plume.estimated_arrival_hours,
            "mode": "bedrock" if bedrock_provider.is_available() else "local_deterministic",
        }


air_watcher = AirWatcherAgent()
