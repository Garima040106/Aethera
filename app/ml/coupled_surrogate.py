"""Coupled 72-hour environmental forecasting surrogate for Delhi NCR.

Formulates two-way atmospheric feedback between stubble smoke particulate
and nocturnal thermal inversion / planetary boundary layer dynamics.
"""

import math
from typing import List, Dict, Any, Tuple
from app.schemas.models import ForecastPoint
from app.data.fixtures import BASE_MET_PROFILE, AREAS_GEO


class CoupledForecastingSurrogate:
    """
    72-hour numerical stepper connecting meteorology and air pollutants.

    Equations:
    - Diurnal solar radiation forcing: S(t) = max(0, sin(pi * (t % 24 - 6) / 12))
    - Base PBLH: PBLH_base(t) = PBLH_min + (PBLH_max - PBLH_min) * S(t)
    - Smoke radiative dimming feedback: alpha_smoke = 1.0 - 0.35 * (PM25(t) / 450.0)
    - Coupled PBLH: PBLH_coupled(t) = max(120.0, PBLH_base(t) * alpha_smoke)
    - Ventilation Coefficient: V_c(t) = PBLH(t) * WindSpeed(t)
    - Pollutant mass balance:
      C_{t+1} = C_t + [E_local + Influx_plume(t)] / PBLH(t) - k_dep * C_t
    """

    def __init__(self):
        self.k_dep = 0.025  # Dry deposition & removal constant (hr^-1)
        self.e_local_base = 28.0  # Local emissions rate (ug/m3 * m / hr)

    def _calculate_plume_influx(self, hour: int) -> float:
        """
        Calculates stubble-burning plume mass influx at Delhi NCR.
        Transit from Punjab/Haryana fires takes ~14 hours; peak arrival hours 18 - 42.
        """
        if hour < 12:
            return 8.0  # Background transport
        elif 12 <= hour <= 42:
            # Gaussian peak centered at hour 28
            peak_intensity = 85.0
            sigma = 8.0
            return peak_intensity * math.exp(-0.5 * ((hour - 28.0) / sigma) ** 2)
        else:
            # Gradual clearing as winds shift or fires abate
            return max(10.0, 45.0 * math.exp(-0.06 * (hour - 42)))

    def _convert_pm25_to_aqi(self, pm25: float) -> Tuple[int, str]:
        """
        Indian National Air Quality Index (NAQI) breakpoint calculation for PM2.5.
        Categories: Good (0-50), Satisfactory (51-100), Moderate (101-200),
                    Poor (201-300), Very Poor (301-400), Severe (401-500).
        """
        breakpoints = [
            (0, 30, 0, 50, "Good"),
            (30, 60, 51, 100, "Satisfactory"),
            (60, 90, 101, 200, "Moderate"),
            (90, 120, 201, 300, "Poor"),
            (120, 250, 301, 400, "Very Poor"),
            (250, 500, 401, 500, "Severe"),
        ]

        val = max(0.0, min(500.0, pm25))
        for bp_low, bp_high, aqi_low, aqi_high, cat in breakpoints:
            if bp_low <= val <= bp_high:
                aqi = aqi_low + ((aqi_high - aqi_low) / (bp_high - bp_low)) * (val - bp_low)
                return int(round(aqi)), cat

        return 500, "Severe"

    def run_72h_forecast(
        self,
        area: str = "noida",
        hours: int = 72,
        enable_feedback: bool = True
    ) -> List[ForecastPoint]:
        """
        Integrates the 72-hour forecast step by step.
        """
        area_key = area.lower().replace(" ", "_")
        geo = AREAS_GEO.get(area_key, AREAS_GEO["noida"])

        # Initial state at t = 0 (Now: PM2.5 ~ 95 ug/m3 -> AQI 210)
        curr_pm25_coupled = 94.0
        curr_pm25_uncoupled = 94.0
        points: List[ForecastPoint] = []

        for h in range(hours + 1):
            time_of_day = (h + 6) % 24  # Starts at 6 AM
            solar = max(0.0, math.sin(math.pi * (time_of_day - 6) / 12)) if 6 <= time_of_day <= 18 else 0.0

            # Base meteorology
            temp_c = 14.0 + 12.0 * solar - (1.5 if enable_feedback and curr_pm25_coupled > 200 else 0.0)
            humidity_pct = 78.0 - 32.0 * solar
            wind_speed = 2.0 + 1.8 * solar
            wind_dir = 315.0  # North-westerly

            # Uncoupled PBLH (no feedback)
            pblh_base = 260.0 + 940.0 * solar

            # Coupled PBLH: Smoke aerosol dimming lowers solar heating and suppresses boundary layer
            if enable_feedback:
                dimming_factor = max(0.55, 1.0 - 0.42 * min(1.0, curr_pm25_coupled / 340.0))
                pblh_coupled = max(140.0, pblh_base * dimming_factor)
            else:
                pblh_coupled = pblh_base

            # Ventilation Coefficient (m^2/s)
            vent_coeff = pblh_coupled * wind_speed

            # Inversion Strength Index: Strong between +18h and +42h
            if (18 <= h <= 42 and vent_coeff < 950) or vent_coeff < 550 or (solar == 0.0 and pblh_coupled < 220):
                inversion_level = "Strong"
            elif vent_coeff < 1200 or pblh_coupled < 450:
                inversion_level = "Moderate"
            else:
                inversion_level = "Weak"

            # Influx from upwind fires (peaks around hour 26-32)
            plume_influx = self._calculate_plume_influx(h)

            # Integrate Coupled PM2.5
            effective_vent = max(240.0, vent_coeff)
            d_conc_coupled = ((self.e_local_base + plume_influx) * 220.0 / effective_vent) - (0.045 * curr_pm25_coupled)
            next_pm25_coupled = max(30.0, curr_pm25_coupled + d_conc_coupled * 0.45)

            # Integrate Uncoupled PM2.5 (uses uncoupled base pblh)
            uncoupled_vent = max(240.0, pblh_base * wind_speed)
            d_conc_uncoupled = ((self.e_local_base + plume_influx) * 220.0 / uncoupled_vent) - (0.045 * curr_pm25_uncoupled)
            next_pm25_uncoupled = max(30.0, curr_pm25_uncoupled + d_conc_uncoupled * 0.45)

            # AQI calculations
            aqi_coup, aqi_cat = self._convert_pm25_to_aqi(curr_pm25_coupled)
            aqi_uncoup, _ = self._convert_pm25_to_aqi(curr_pm25_uncoupled)
            feedback_delta = max(0, aqi_coup - aqi_uncoup)

            # Derived co-pollutants
            pm10 = curr_pm25_coupled * 1.62
            ozone = max(15.0, 65.0 * solar - (curr_pm25_coupled * 0.05))
            nox = max(20.0, 35.0 + (curr_pm25_coupled * 0.18))

            timestamp_str = f"+{h} h" if h > 0 else "Now"

            point = ForecastPoint(
                hour=h,
                timestamp=timestamp_str,
                temperature_c=round(temp_c, 1),
                relative_humidity_pct=round(humidity_pct, 1),
                wind_speed_ms=round(wind_speed, 1),
                wind_direction_deg=round(wind_dir, 1),
                boundary_layer_height_m=round(pblh_coupled, 1),
                pm25_ugm3=round(curr_pm25_coupled, 1),
                pm10_ugm3=round(pm10, 1),
                ozone_ugm3=round(ozone, 1),
                nox_ugm3=round(nox, 1),
                aqi_coupled=aqi_coup,
                aqi_category=aqi_cat,
                aqi_uncoupled=aqi_uncoup,
                inversion_level=inversion_level,
                ventilation_coefficient_m2s=round(vent_coeff, 1),
                feedback_enhancement_aqi=feedback_delta,
                data_quality="valid",
            )
            points.append(point)

            # Step forward
            curr_pm25_coupled = next_pm25_coupled
            curr_pm25_uncoupled = next_pm25_uncoupled

        return points


coupled_surrogate = CoupledForecastingSurrogate()
