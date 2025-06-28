import logging
from logging.handlers import RotatingFileHandler


def setup_logger():
    logger = logging.getLogger()  # root logger
    logger.setLevel(logging.INFO)

    # Remove any existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Set up the rotating file handler
    handler = RotatingFileHandler(
        filename="logs.txt",  # Log file name
        maxBytes=10 * 1024 * 1024,  # Max size in bytes (1 MB here)
        backupCount=3,  # Number of rotated backups to keep (e.g., logs.txt.1, logs.txt.2, etc.)
    )
    # Set formatter
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)

    # Set up the logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    # Optional: also log to console
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)

    return logger
