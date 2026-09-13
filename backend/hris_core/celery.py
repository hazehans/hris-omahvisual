"""
Celery Configuration — HRIS OmahVisual
"""

import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hris_core.settings')

app = Celery('hris_core')

# Baca konfigurasi dari Django settings (prefix CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks dari semua installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

