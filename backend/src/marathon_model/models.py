from pydantic import BaseModel
from typing import List, Optional


class CalculationInput(BaseModel):
    vo2_max: float
    lactate_mmol: float
    economy_factor: float
    training_weekly_km: Optional[float] = None
    training_pace_sec_km: Optional[float] = None


class CurrentPoint(BaseModel):
    vo2_lt: float
    speed: float


class PlotDataPoint(BaseModel):
    vo2_lt: int
    speed_high: float
    speed_low: float
    speed_avg: float
    speed_range: List[float]


class TandaPlotDataPoint(BaseModel):
    training_weekly_km: int
    predicted_pace_sec_km: float
    study_baseline_pace_sec_km: float


class TandaStudyPoint(BaseModel):
    k: float
    pm: float


class CalculationResult(BaseModel):
    vo2_lt: float
    marathon_speed_kmh: float
    marathon_time: str
    plot_data: List[PlotDataPoint]
    current_point: CurrentPoint
    tanda_time: Optional[str] = None
    tanda_speed_kmh: Optional[float] = None
    tanda_plot_data: Optional[List[TandaPlotDataPoint]] = None
    tanda_study_data: Optional[List[TandaStudyPoint]] = None
