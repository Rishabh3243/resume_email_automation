"""
ASGI config for resume_mailer project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_mailer.settings')

application = get_asgi_application()
