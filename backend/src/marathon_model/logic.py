from .models import CalculationInput, CalculationResult, PlotDataPoint, CurrentPoint

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
    time_hours = 42.195 / speed_kmh
    hours = int(time_hours)
    minutes = int((time_hours - hours) * 60)
    seconds = int((((time_hours - hours) * 60) - minutes) * 60)
    return f"{hours}:{minutes:02d}:{seconds:02d}"

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
        plot_data.append(PlotDataPoint(
            vo2_lt=v,
            speed_high=round(s_high, 2),
            speed_low=round(s_low, 2),
            speed_avg=round(s_avg, 2),
            speed_range=[round(s_low, 2), round(s_high, 2)]
        ))
        
    return CalculationResult(
        vo2_lt=round(vo2_lt, 2),
        marathon_speed_kmh=round(marathon_speed_kmh, 2),
        marathon_time=format_time(marathon_speed_kmh),
        plot_data=plot_data,
        current_point=CurrentPoint(vo2_lt=round(vo2_lt, 2), speed=round(marathon_speed_kmh, 2))
    )
