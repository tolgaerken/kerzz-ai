#!/bin/bash
# Navigate to script directory
cd "$(dirname "$0")"
source venv/bin/activate
python embedding_service.py
