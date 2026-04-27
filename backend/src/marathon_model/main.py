from fastapi import FastAPI
from .models import CalculationInput, CalculationResult
from .logic import perform_marathon_calculation

app = FastAPI(title="Marathon Performance Model API")

@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "message": "Marathon Model API is running"}

@app.post("/api/calculate", response_model=CalculationResult)
async def calculate(input_data: CalculationInput) -> CalculationResult:
    return perform_marathon_calculation(input_data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
