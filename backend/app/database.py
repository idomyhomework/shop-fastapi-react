from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Ruta de la base de datos SQLite (archivo local)
DATABASE_URL = "sqlite:///./app.db"  # ./app.db en la carpeta backend

# Conexión al motor de SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necesario para SQLite + threads
)


# Clase base para los modelos
class Base(DeclarativeBase):
    pass


# Factoría de sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Dependencia para obtener una sesión de BD por petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
