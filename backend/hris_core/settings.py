"""
Django settings for hris_core project.
HRIS OmahVisual — Django 5.1.4 + Python 3.13
"""

from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ======================================================
# Environment Variables
# ======================================================
env = environ.Env(
    DEBUG=(bool, True),
    USE_SQLITE=(bool, True),
    USE_REDIS=(bool, False),
)
environ.Env.read_env(BASE_DIR / '.env')

# ======================================================
# Core Settings
# ======================================================
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# ======================================================
# Application Definition
# ======================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_celery_beat',
    'django_celery_results',

    # Local apps
    'accounts',
    'employees',
    'attendance',
    'daily_report',
    'leave',
    'contracts',
    'roster',
    'dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS harus di atas CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hris_core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hris_core.wsgi.application'

# ======================================================
# Database — Toggle antara SQLite (dev) dan PostgreSQL (prod)
# ======================================================
if env('USE_SQLITE'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            # Saat PostGIS siap, ganti ENGINE ke: 'django.contrib.gis.db.backends.postgis'
            'NAME': env('DB_NAME'),
            'USER': env('DB_USER'),
            'PASSWORD': env('DB_PASSWORD'),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
        }
    }

# ======================================================
# Custom User Model
# ======================================================
AUTH_USER_MODEL = 'accounts.User'

# ======================================================
# Password Validation
# ======================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ======================================================
# Internationalization
# ======================================================
LANGUAGE_CODE = 'id-ID'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

# ======================================================
# Static & Media Files
# ======================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / env('MEDIA_ROOT', default='media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ======================================================
# Django REST Framework
# ======================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'hris_core.renderers.StandardJSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'hris_core.exceptions.custom_exception_handler',
}

# ======================================================
# JWT Settings
# ======================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ======================================================
# CORS Settings
# ======================================================
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://127.0.0.1:5173']
)
CORS_ALLOW_CREDENTIALS = True

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-device-id',
]

# ======================================================
# Celery Settings
# ======================================================
if env('USE_REDIS'):
    CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
else:
    # Development: gunakan Django DB sebagai broker
    CELERY_BROKER_URL = 'django-db'
    CELERY_RESULT_BACKEND = 'django-db'
    CELERY_CACHE_BACKEND = 'django-cache'

CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Jakarta'

# ======================================================
# Celery Beat Schedules (Cron Jobs)
# ======================================================
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Fase 6 — Leave: Auto-reject pengajuan PENDING di H-1 pukul 23:59
    'auto-reject-pending-leaves': {
        'task': 'leave.auto_reject_pending_leaves',
        'schedule': crontab(hour=23, minute=59),
    },
    # Fase 7 — Contracts: Reminder kontrak H-30 & ulang tahun pukul 08:00
    'contract-and-birthday-reminders': {
        'task': 'contracts.send_daily_reminders',
        'schedule': crontab(hour=8, minute=0),
    },
}
