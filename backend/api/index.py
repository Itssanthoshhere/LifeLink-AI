import sys
from pathlib import Path

# Add parent directory to sys.path so src imports work seamlessly
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from src.api import app

# Export app for Vercel Serverless Functions
__all__ = ["app"]
