# Marathon Performance Modeler

An interactive full-stack web application designed to model marathon running performance based on the physiological framework proposed by **Michael J. Joyner (1991)**.

## 🎯 Project Aim

The goal of this project is to visualize the interplay between the three primary physiological variables that limit human endurance:
1.  **VO₂ Max:** The absolute ceiling of aerobic metabolism.
2.  **Lactate Threshold (%LT):** The fraction of VO₂ Max that can be sustained without fatiguing lactate accumulation.
3.  **Running Economy (RE):** The efficiency of converting oxygen uptake into mechanical speed.

The tool allows users to explore theoretical "perfect" performances (like the sub-2 hour marathon) and estimate their own physiological profile through real-world race data calibration.

---

## 🧪 The Physiological Model

### 1. The Core Formula
The model follows Joyner's conceptual framework:
**`Marathon Speed = VO₂max × %LT × RE`**

### 2. Metabolic Efficiency (Lactate Mapping)
To make the model accessible to athletes with blood lactate data, we use a linear mapping derived from Joyner's observations that elite runners sustain marathon paces between 2.0 and 3.0 mmol/L.
*   **Formula:** `%LT = 105 - (Lactate × 10)`
*   **Mapping:**
    *   1.5 mmol/L (High Efficiency) ≈ 90% VO₂ Max sustained.
    *   2.5 mmol/L (Average Efficiency) ≈ 80% VO₂ Max sustained.
    *   4.0 mmol/L (Low Efficiency) ≈ 65% VO₂ Max sustained.

### 3. The Joyner Regression Constants
The relationship between oxygen supply ($VO_2$) and speed ($RS$) was derived from linear regressions on treadmill data from **Conley & Krahenbuhl (1980)**:
*   **High Economy:** `RS = VO₂ * 0.2936 + 2.6481`
*   **Average Economy:** `RS = VO₂ * 0.2878 + 1.5867`
*   **Low Economy:** `RS = VO₂ * 0.2779 + 1.2499`

### 4. The 10% Correction Factor
Because laboratory treadmill data lacks wind resistance and occurs over short durations, Joyner applies a **0.90 multiplier** to translate treadmill speed to real-world marathon speed.
*   ~7-8% for Wind Resistance (overground).
*   ~2-3% for VO₂ Drift (rising metabolic cost over a 2+ hour race).

---

## 🛠️ Technical Stack

-   **Backend:** FastAPI (Python 3.12), Pydantic (data validation), Pytest (testing), Mypy (type checking).
-   **Frontend:** React 19, TypeScript, Vite (build tool), Recharts (visualization).
-   **DevOps:** Docker, Docker Compose, Pre-commit hooks (Ruff, Mypy, Pytest).

---

## 🚀 How to Run

### Option 1: Docker Compose (Recommended)
This will automatically build and orchestrate both the backend and frontend.

```bash
docker-compose up --build
```
Once the build is complete, open your browser to **`http://localhost`**.

### Option 2: Manual Development Setup

**Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
PYTHONPATH=src uvicorn marathon_model.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`**.

---

## 👨‍💻 Author

**Giuseppe Marco Randazzo** - [gmrandazzo@gmail.com](mailto:gmrandazzo@gmail.com)

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

---

## 📚 References

1.  **Joyner, M. J. (1991).** Modeling: optimal marathon performance on the basis of physiological factors. *Journal of Applied Physiology*, 70(2), 683-687. [doi: 10.1152/jappl.1991.70.2.683](https://doi.org/10.1152/jappl.1991.70.2.683)
2.  **Conley, D. L., & Krahenbuhl, G. S. (1980).** Running economy and distance running performance of highly trained athletes. *Medicine and Science in Sports and Exercise*, 12(5), 357-360. [[Link]](https://journals.lww.com/acsm-msse/abstract/1980/25000/running_economy_and_distance_running_performance.10.aspx)
3.  **Benítez-Muñoz, J. A., & Cupeiro, R. (2025).** Factors Influencing Blood Lactate Concentration During Exercise: A Narrative Review With a Lactate Shuttle Perspective. *Acta Physiologica*, e70131. [doi: 10.1111/apha.70131](https://doi.org/10.1111/apha.70131)
