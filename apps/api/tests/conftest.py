"""
Pytest configuration. Run from apps/api with: pytest tests/ -v
Or: python -m pytest tests/ -v
"""
import sys
from pathlib import Path

# Ensure app is importable when running tests from apps/api
api_root = Path(__file__).resolve().parent.parent
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))
