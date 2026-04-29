import math
from .models import CalculationInput, CalculationResult, PlotDataPoint, CurrentPoint, TandaStudyPoint, TandaPlotDataPoint

TANDA_STUDY_DATA = [
    (43.36161188, 306.7452135), (40.21208908, 287.3048601), (40.59384942, 283.3284242),
    (45.36585366, 297.7614138), (49.85153765, 303.7997054), (50.51961824, 300.8541973),
    (54.14634146, 305.1251841), (58.63202545, 303.7997054), (52.52386002, 290.9867452),
    (48.61081654, 295.257732), (49.75609756, 288.1885125), (52.33297985, 286.8630339),
    (53.2873807, 284.0648012), (58.05938494, 286.4212077), (51.47401909, 281.4138439),
    (53.00106045, 270.9572901), (57.6776246, 267.275405), (58.05938494, 255.640648),
    (60.15906681, 269.7790869), (61.11346766, 274.3446244), (64.74019088, 272.1354934),
    (67.69883351, 272.1354934), (69.41675504, 271.6936672), (71.80275716, 267.275405),
    (62.83138918, 267.7172312), (61.30434783, 265.2135493), (63.11770944, 254.4624448),
    (64.26299046, 256.8188513), (69.79851538, 260.2061856), (73.4252386, 269.1899853),
    (74.18875928, 268.4536082), (76.76564157, 273.460972), (76.76564157, 267.1281296),
    (78.29268293, 264.9189985), (81.34676564, 263.7407953), (78.57900318, 261.5316642),
    (77.05196182, 254.0206186), (74.6659597, 249.3078056), (72.27995758, 252.5478645),
    (80.86956522, 252.1060383), (87.45493107, 267.8645066), (83.63732768, 256.0824742),
    (84.40084836, 255.640648), (84.59172853, 253.5787923), (108.73807, 237.083947),
    (110.9331919, 238.1148748)
]


def calculate_lt_percent(lactate_mmol: float) -> float:
    """Maps lactate in mmol/L to %VO2max sustained based on Joyner 1991 benchmarks."""
    # Linear formula: %VO2max = 105 - (lactate * 10)
    lt_percent = 105.0 - (lactate_mmol * 10.0)
    return max(60.0, min(95.0, lt_percent))


def calculate_speed_raw(vo2: float, economy_factor: float) -> float:
    """Calculates treadmill speed based on VO2 and Running Economy constants."""
    # Constants derived from Joyner 1991 / Conley 1980
    high_slope, high_intercept = 0.2936, 2.6481
    low_slope, low_intercept = 0.2779, 1.2499

    speed_high = vo2 * high_slope + high_intercept
    speed_low = vo2 * low_slope + low_intercept

    # Interpolate
    return speed_low + economy_factor * (speed_high - speed_low)


def format_time(speed_kmh: float) -> str:
    """Converts km/h to HH:MM:SS for the marathon distance (42.195 km)."""
    if speed_kmh <= 0:
        return "0:00:00"
    time_hours = 42.195 / speed_kmh
    hours = int(time_hours)
    minutes = int((time_hours - hours) * 60)
    seconds = int((((time_hours - hours) * 60) - minutes) * 60)
    return f"{hours}:{minutes:02d}:{seconds:02d}"


def calculate_tanda_speed(k: float, p: float) -> float:
    """Calculates marathon speed using the Tanda (2011) equation.
    Pm (sec/km) = 17.1 + 140.0 exp[-0.0053 K(km/week)] + 0.55 P (sec/km)
    """
    pm_sec_km = 17.1 + 140.0 * math.exp(-0.0053 * k) + 0.55 * p
    return 3600.0 / pm_sec_km


def perform_marathon_calculation(input_data: CalculationInput) -> CalculationResult:
    lt_percent = calculate_lt_percent(input_data.lactate_mmol)
    vo2_lt = input_data.vo2_max * (lt_percent / 100.0)

    # Apply 10% marathon slowing factor (wind + drift)
    speed_raw = calculate_speed_raw(vo2_lt, input_data.economy_factor)
    marathon_speed_kmh = speed_raw * 0.9

    # Generate Plot Data (30 to 85 range)
    plot_data = []
    for v in range(30, 86, 2):
        s_high = (v * 0.2936 + 2.6481) * 0.9
        s_low = (v * 0.2779 + 1.2499) * 0.9
        s_avg = (v * 0.2878 + 1.5867) * 0.9
        plot_data.append(
            PlotDataPoint(
                vo2_lt=v,
                speed_high=round(s_high, 2),
                speed_low=round(s_low, 2),
                speed_avg=round(s_avg, 2),
                speed_range=[round(s_low, 2), round(s_high, 2)],
            )
        )

    # Tanda Calculation
    tanda_speed_kmh = None
    tanda_time = None
    tanda_plot_data = None
    tanda_study_data = [TandaStudyPoint(k=k, pm=pm) for k, pm in TANDA_STUDY_DATA]
    
    if input_data.training_weekly_km is not None and input_data.training_pace_sec_km is not None:
        tanda_speed_kmh = round(
            calculate_tanda_speed(
                input_data.training_weekly_km, input_data.training_pace_sec_km
            ),
            2,
        )
        tanda_time = format_time(tanda_speed_kmh)
        
        # Generate Tanda Plot Data (Distance K from 30 to 150)
        tanda_plot_data = []
        study_mean_pace = 284.6
        for k in range(30, 151, 5):
            pm_user = 17.1 + 140.0 * math.exp(-0.0053 * k) + 0.55 * input_data.training_pace_sec_km
            pm_study = 17.1 + 140.0 * math.exp(-0.0053 * k) + 0.55 * study_mean_pace
            tanda_plot_data.append(
                TandaPlotDataPoint(
                    training_weekly_km=k,
                    predicted_pace_sec_km=round(pm_user, 1),
                    study_baseline_pace_sec_km=round(pm_study, 1)
                )
            )

    return CalculationResult(
        vo2_lt=round(vo2_lt, 2),
        marathon_speed_kmh=round(marathon_speed_kmh, 2),
        marathon_time=format_time(marathon_speed_kmh),
        plot_data=plot_data,
        current_point=CurrentPoint(
            vo2_lt=round(vo2_lt, 2), speed=round(marathon_speed_kmh, 2)
        ),
        tanda_speed_kmh=tanda_speed_kmh,
        tanda_time=tanda_time,
        tanda_plot_data=tanda_plot_data,
        tanda_study_data=tanda_study_data,
    )
