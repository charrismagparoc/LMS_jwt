from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-library-system-secret-key-2024'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'djoser',
    'cloudinary',
    'cloudinary_storage',
    'books',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'library_project.urls'

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

WSGI_APPLICATION = 'library_project.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
FRONTEND_URL = 'http://localhost:3000'

# ── Cloudinary (for media/photo storage) ──────────────────────────────────────
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': 'your_cloud_name',   # replace with your Cloudinary cloud name
    'API_KEY':    'your_api_key',      # replace with your Cloudinary API key
    'API_SECRET': 'your_api_secret',   # replace with your Cloudinary API secret
}
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ── Email (console for development — shows email in terminal) ─────────────────
# Use this during development to see emails printed in the terminal:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── Email (SMTP Gmail — use this in production) ───────────────────────────────
# Uncomment below and comment the console backend above when ready for real emails:
EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST         = 'smtp.gmail.com'
EMAIL_PORT         = 587
EMAIL_HOST_USER    = 'rhissyrhissy@gmail.com'   # your Gmail address
EMAIL_HOST_PASSWORD = 'jnkxaagjdasgzisu'     # Gmail App Password (not your normal password)
EMAIL_USE_TLS      = True
DEFAULT_FROM_EMAIL = 'rhissyrhissy@gmail.com'

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
}

# ── Djoser (email activation) ─────────────────────────────────────────────────
DJOSER = {
    'ACTIVATION_URL':         'activate/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL':  True,
    'USER_CREATE_PASSWORD_RETYPE': False,
    'EMAIL': {
        'activation': 'books.email.CustomActivationEmail',
    },
}
