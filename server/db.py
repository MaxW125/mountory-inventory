import os
import psycopg


DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "inventory_db"),
    "user": os.getenv("DB_USER", "inventory_user"),
    "password": os.getenv("DB_PASSWORD", "inventory_password"),
    "sslmode": os.getenv("DB_SSLMODE", "disable"),
}


def get_connection():
    """
    Create and return a new database connection.
    Caller is responsible for closing it.
    """
    return psycopg.connect(**DB_CONFIG)