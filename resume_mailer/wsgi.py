"""
WSGI config for resume_mailer project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_mailer.settings')

application = get_wsgi_application()
