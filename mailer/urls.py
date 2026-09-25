from django.urls import path
from . import views

app_name = 'mailer'

urlpatterns = [
    path('', views.index, name='index'),
    path('setup/', views.setup_credentials, name='setup_credentials'),
    path('logout/', views.logout_credentials, name='logout_credentials'),
    path('history/', views.history_view, name='history'),
    path('api/history/<int:log_id>/delete/', views.delete_log_api, name='delete_log_api'),
    path('api/history/clear/', views.clear_history_api, name='clear_history_api'),
    path('api/get-template/', views.get_template_api, name='get_template_api'),
    path('api/validate-email/', views.validate_email_api, name='validate_email_api'),
    path('api/send-email/', views.send_email_api, name='send_email_api'),
    path('api/log/<int:log_id>/', views.log_detail_api, name='log_detail_api'),
]
