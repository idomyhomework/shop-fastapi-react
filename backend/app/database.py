from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Ruta de la base de datos SQLite (archivo local)
DATABASE_URL = "sqlite+aiosqlite:///./app.db"  # ./app.db en la carpeta backend

# Conexión al motor de SQLite
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necesario para SQLite + threads
    echo=False,  # True para debug
)


# Clase base para los modelos
class Base(DeclarativeBase):
    pass


# Factoría de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


# Dependencia de inyección asíncrona
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
