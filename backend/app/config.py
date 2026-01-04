import os

# Directorios
STATIC_DIR = "static"
PRODUCT_IMAGES_DIR = os.path.join(STATIC_DIR, "products")

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

# Tipos de imagen permitidos
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Crear carpetas si no existen
os.makedirs(PRODUCT_IMAGES_DIR, exist_ok=True)
