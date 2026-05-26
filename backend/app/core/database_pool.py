import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from ..config import settings

logger = logging.getLogger(__name__)

class DatabasePool:
    def __init__(self):
        self.engine = None
        self.session_factory = None

    async def initialize(self):
        """Initialize database connection pool"""
        if self.session_factory is not None:
            return

        url = settings.database_url
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        self.engine = create_async_engine(
            url,
            pool_size=20,
            max_overflow=30,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        logger.info("Database connection pool initialized (%s)", url.split("@")[-1])
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
    
    def get_session(self) -> AsyncSession:
        """Return a fresh AsyncSession (usable as an async context manager)."""
        if not self.session_factory:
            raise RuntimeError("Database pool not initialized")
        return self.session_factory()

db_pool = DatabasePool()

async def get_db_session():
    """FastAPI dependency that yields an AsyncSession."""
    async with db_pool.get_session() as session:
        yield session
