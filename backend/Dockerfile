# Use an official Python slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

# Copy project metadata
COPY pyproject.toml .

# Copy the source code (needed for pip install . with src layout)
COPY src/ ./src/

# Install the package and its dependencies
RUN pip install --no-cache-dir .

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "marathon_model.main:app", "--host", "0.0.0.0", "--port", "8000"]
