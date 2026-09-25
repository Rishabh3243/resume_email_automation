from django.urls import path
from . import views

app_name = 'mailer'

urlpatterns = [
    path('', views.index, name='index'),
    path('setup/', views.setup_credentials, name='setup_credentials'),
    path('logout/', views.logout_credentials, name='logout_credentials'),
    path('api/get-template/', views.get_template_api, name='get_template_api'),
    path('api/validate-email/', views.validate_email_api, name='validate_email_api'),
    path('api/send-email/', views.send_email_api, name='send_email_api'),
]
