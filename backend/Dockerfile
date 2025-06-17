# Use the official Python image as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /backend

# Copy the current directory contents into the container at /app
COPY . .

RUN apt-get update && apt-get install -y bash

# Install dependencies and Tesseract using the install-requirements.sh script
RUN bash install-requirements.sh

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 9000

# Command to run the FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]