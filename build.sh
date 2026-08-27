#!/usr/bin/env bash
# exit on error
set -o errexit

cd backend
pip install -r requirements.txt
python manage.py migrate
