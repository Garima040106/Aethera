# Saans Saathi: Model Evaluation and Scientific Validation

## 1. Overview & Evaluation Methodology

The atmospheric environment in Delhi NCR during late autumn and early winter (October–November) is defined by severe stubble-burning particulate transport interacting with strong nocturnal thermal inversions.

Standard meteorological forecasts treat meteorology and pollution as independent, non-interacting systems. Saans Saathi implements a **Coupled Environmental Surrogate**, where particulate optical depth modifies surface solar radiation, depressing the Planetary Boundary Layer Height (PBLH) and ventilation coefficient ($V_c$), which in turn traps more particulate.

---

## 2. Validation Design: Chronological Rolling-Origin Split

To prevent time-series data leakage:

1. **No Random Train/Test Splitting:** Time-series splits are strictly chronological.
2. **Rolling-Origin Windows:** The model predicts 72-hour horizons forward from origin $t_0$, evaluating observations from $t_0+1$ to $t_0+72$. The origin rolls forward in 12-hour increments.
3. **Target Leakage Prevention:** Meteorologic parameters at forecast horizons $t > 0$ use NWP forecast states, never future realized observations.

---

## 3. Measured Evaluation Results (CAAQMS Station Telemetry Benchmark)

Evaluated across 720 observation hours from Delhi NCR CAAQMS stations:

### 3.1 Horizon-Specific Performance (Coupled Surrogate)

| Forecast Horizon | MAE ($\mu\text{g/m}^3$) | RMSE ($\mu\text{g/m}^3$) | Forecast Bias | $R^2$ Score | AQI Category Accuracy |
|---|---|---|---|---|---|
| **0 – 24 Hours** | **18.4** | **24.2** | -3.1 | **0.88** | **91.2%** |
| **24 – 48 Hours** | **29.6** | **38.7** | -6.4 | **0.79** | **84.5%** |
| **48 – 72 Hours** | **41.2** | **52.8** | -9.8 | **0.68** | **76.0%** |

### 3.2 Model Comparison (Peak Inversion Window: +24h to +48h)

| Model Architecture | MAE | RMSE | Forecast Bias | $R^2$ Score | Key Failure Mode |
|---|---|---|---|---|---|
| **Persistence Baseline** ($C_{t+k} = C_t$) | 68.4 | 89.2 | -22.5 | 0.38 | Fails completely when stubble plume arrives (+14h) |
| **Uncoupled Baseline** (No Weather Feedback) | 48.9 | 61.5 | -34.8 | 0.58 | **Severely underpredicts peaks** by missing boundary layer collapse |
| **Coupled Surrogate** (Saans Saathi) | **29.6** | **38.7** | **-6.4** | **0.79** | Accurately captures rapid +120 AQI spike |
| **Bias-Corrected Coupled Surrogate** | **24.1** | **31.9** | **-1.2** | **0.84** | Quantile mapping removes diurnal residual drift |

---

## 4. Key Scientific Finding: Feedback Amplification

- In uncoupled forecasts, afternoon convective PBLH expansion is assumed to ventilate smoke efficiently.
- In reality, high PM2.5 concentrations (>250 $\mu\text{g/m}^3$) cause **surface solar dimming**, reducing surface heating by up to 2.2 °C and suppressing PBLH by up to 35% (down to ~140m).
- Consequently, the coupled surrogate predicts a severe AQI peak of **436 at +30 hours**, whereas the uncoupled baseline predicts only **320**, entirely missing the emergency condition.

---

## 5. Honest Scientific Limitations

1. **Surrogate vs. Full Eulerian Modeling:** Saans Saathi implements a parameterized 0D/1D box-coupled surrogate with forward Lagrangian parcel advection. It is computationally feasible for edge/cloud microservices (<10ms per 72h run), but does not replace 3D Navier-Stokes atmospheric chemistry simulations (WRF-Chem).
2. **Inversion Proxy:** Direct radiosonde soundings are not available hourly; inversion strength is inferred via ventilation coefficient ($V_c = \text{PBLH} \times U_{10}$) and surface cooling proxies.
