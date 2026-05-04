# Use the official Python 3.11 slim image as the base
# 'slim' means it's a minimal version — smaller file size, faster to build
# We specify 3.11 to match our local development environment exactly
FROM python:3.11-slim

# Set the working directory inside the container
# All subsequent commands will run from this directory
# Think of it like cd /app inside the container
WORKDIR /app

# Copy the requirements file first — before copying the rest of the code
# This is a Docker best practice called layer caching
# If requirements.txt hasn't changed, Docker skips reinstalling packages
# which makes rebuilds much faster
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir means don't store the download cache — keeps the image smaller
# --upgrade pip ensures we have the latest pip before installing
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code into the container
# The first . means "everything in the current directory on your Mac"
# The second . means "put it in the current WORKDIR (/app) in the container"
COPY . .

# Tell Docker this container listens on port 8000
# This is documentation — it doesn't actually open the port
# The actual port binding happens when you run the container
EXPOSE 8000

# The command to run when the container starts
# This is the same command we use locally but without --reload
# We don't want auto-reload in production — it's a development feature
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]