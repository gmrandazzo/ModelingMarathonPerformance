from pydantic import BaseModel
from typing import List, Dict

class CalculationInput(BaseModel):
    vo2_max: float
    lactate_mmol: float
    economy_factor: float

class CurrentPoint(BaseModel):
    vo2_lt: float
    speed: float

class PlotDataPoint(BaseModel):
    vo2_lt: int
    speed_high: float
    speed_low: float
    speed_avg: float
    speed_range: List[float]

class CalculationResult(BaseModel):
    vo2_lt: float
    marathon_speed_kmh: float
    marathon_time: str
    plot_data: List[PlotDataPoint]
    current_point: CurrentPoint
