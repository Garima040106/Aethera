"""Machine Learning and Numerical Surrogate Verification Tests."""

import math
from app.ml.coupled_surrogate import coupled_surrogate
from app.ml.evaluation import evaluation_engine


def test_coupled_surrogate_length_and_continuity():
    points = coupled_surrogate.run_72h_forecast(area="noida", hours=72, enable_feedback=True)
    assert len(points) == 73

    for idx, p in enumerate(points):
        assert p.hour == idx
        # Positivity safeguards
        assert p.pm25_ugm3 > 0.0
        assert p.pm10_ugm3 > 0.0
        assert p.boundary_layer_height_m > 50.0
        assert 0 <= p.aqi_coupled <= 500
        # No NaNs or infinities
        assert not math.isnan(p.pm25_ugm3)
        assert not math.isnan(p.boundary_layer_height_m)


def test_feedback_coupling_amplification():
    points_coupled = coupled_surrogate.run_72h_forecast(area="noida", hours=72, enable_feedback=True)
    points_uncoupled = coupled_surrogate.run_72h_forecast(area="noida", hours=72, enable_feedback=False)

    # Inversion peak hours are between +24h and +36h
    peak_coupled_aqi = max(p.aqi_coupled for p in points_coupled)
    peak_uncoupled_aqi = max(p.aqi_coupled for p in points_uncoupled)

    # Coupled surrogate should accurately predict higher accumulation due to boundary layer suppression
    assert peak_coupled_aqi > peak_uncoupled_aqi
    assert peak_coupled_aqi >= 400  # Severe spike captured


def test_chronological_evaluation_integrity():
    metrics = evaluation_engine.compute_metrics()
    # Error should naturally increase with forecast horizon
    mae_24 = metrics.metrics_by_horizon["0-24h"].mae
    mae_48 = metrics.metrics_by_horizon["24-48h"].mae
    mae_72 = metrics.metrics_by_horizon["48-72h"].mae

    assert mae_24 < mae_48 < mae_72

    # Coupled model should outperform uncoupled baseline
    coupled_rmse = metrics.baseline_comparisons["Coupled Surrogate (Saans Saathi)"]["rmse"]
    uncoupled_rmse = metrics.baseline_comparisons["Uncoupled Baseline (No Feedback)"]["rmse"]
    assert coupled_rmse < uncoupled_rmse
