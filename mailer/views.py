import json
import os
from pathlib import Path
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .forms import ComposeEmailForm
from .email_service import EmailService


def setup_credentials(request):
    """
    Startup view for capturing SENDER_EMAIL and GMAIL_APP_PASSWORD into active browser session.
    No credentials stored to disk or .env. Automatically destroyed on browser close.
    """
    error = None
    if request.method == 'POST':
        sender_email = request.POST.get('sender_email', '').strip()
        gmail_app_password = request.POST.get('gmail_app_password', '').strip().replace(' ', '')

        if not sender_email:
            error = "Please enter your Gmail address."
        else:
            is_valid, norm = EmailService.validate_recruiter_email(sender_email)
            if not is_valid:
                error = f"Invalid sender email address: {norm}"
            elif not gmail_app_password:
                error = "Please enter your 16-character Google App Password."
            elif len(gmail_app_password) < 8:
                error = "Google App Password appears too short. It should be 16 characters."
            else:
                # Store in signed session cookie (transient, vanishes on browser close)
                request.session['sender_email'] = sender_email
                request.session['gmail_app_password'] = gmail_app_password
                request.session.modified = True
                return redirect('mailer:index')

    current_email = request.session.get('sender_email', '')
    return render(request, 'mailer/setup.html', {
        'error': error,
        'current_email': current_email,
    })


def logout_credentials(request):
    """
    Flushes the transient browser session and deletes in-memory credentials.
    """
    request.session.flush()
    return redirect('mailer:setup_credentials')


def index(request):
    """
    Main MVC view for composing, editing, previewing, and sending job applications.
    Zero-migration setup. Requires active session credentials.
    """
    sender_email = request.session.get('sender_email')
    gmail_app_password = request.session.get('gmail_app_password')

    if not sender_email or not gmail_app_password:
        return redirect('mailer:setup_credentials')

    initial_job_role = "Junior AI/ML Engineer"
    initial_company = ""
    default_subject = EmailService.get_default_subject(initial_job_role)
    raw_plain = EmailService.get_plain_text_template(has_company=False)
    initial_body_text = EmailService.render_plain_text(raw_plain, initial_job_role, initial_company)
    initial_body_html = EmailService.plain_text_to_html(initial_body_text, initial_company)

    form = ComposeEmailForm(initial={
        'job_role': initial_job_role,
        'company_name': initial_company,
        'subject': default_subject,
        'body_text': initial_body_text,
        'body_html': initial_body_html,
    })

    # Check environment & session configuration health
    resume_path_obj = EmailService.resolve_resume_path()
    env_status = {
        'sender_email': sender_email,
        'has_password': True,
        'smtp_host': settings.SMTP_HOST,
        'smtp_port': settings.SMTP_PORT,
        'resume_path': settings.RESUME_PATH,
        'resume_exists': resume_path_obj.exists() and resume_path_obj.is_file(),
        'resume_filename': resume_path_obj.name,
        'delay_seconds': settings.DELAY_BETWEEN_EMAILS,
    }

    context = {
        'form': form,
        'env_status': env_status,
        'default_job_role': initial_job_role,
    }
    return render(request, 'mailer/index.html', context)


@require_http_methods(["GET", "POST"])
def get_template_api(request):
    """
    API endpoint returning original default template populated with job_role and company_name.
    Used by the 'Reset to Original Template' button and dynamic live generator.
    """
    job_role = request.GET.get('job_role', '').strip() or request.POST.get('job_role', '').strip()
    company_name = request.GET.get('company_name', '').strip() or request.POST.get('company_name', '').strip()

    if not job_role:
        job_role = "Junior AI/ML Engineer"

    has_company = bool(company_name)
    raw_plain = EmailService.get_plain_text_template(has_company=has_company)
    rendered_text = EmailService.render_plain_text(raw_plain, job_role, company_name)
    rendered_html = EmailService.plain_text_to_html(rendered_text, company_name)
    subject = EmailService.get_default_subject(job_role)

    return JsonResponse({
        'success': True,
        'has_company': has_company,
        'template_used': 'with_company.html' if has_company else 'without_company.html',
        'subject': subject,
        'body_text': rendered_text,
        'body_html': rendered_html,
    })


@require_http_methods(["POST"])
def validate_email_api(request):
    """
    Endpoint validating recruiter email using email-validator library.
    """
    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        email = data.get('email', '').strip()
    except Exception:
        email = request.POST.get('email', '').strip()

    is_valid, msg = EmailService.validate_recruiter_email(email)
    return JsonResponse({
        'is_valid': is_valid,
        'normalized': msg if is_valid else None,
        'error': msg if not is_valid else None,
    })


@require_http_methods(["POST"])
def send_email_api(request):
    """
    Handles step-by-step sending with real-time checkpoints for the popup dialog.
    Uses transient credentials from the user's active session.
    """
    sender_email = request.session.get('sender_email')
    gmail_password = request.session.get('gmail_app_password')

    if not sender_email or not gmail_password:
        return JsonResponse({
            'success': False,
            'error': 'Session expired or credentials missing. Please set your credentials on the startup screen.'
        }, status=401)

    try:
        if request.content_type == 'application/json':
            payload = json.loads(request.body)
        else:
            payload = request.POST
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"Invalid request body: {str(e)}"}, status=400)

    recruiter_email = payload.get('recruiter_email', '').strip()
    job_role = payload.get('job_role', '').strip() or "Junior AI/ML Engineer"
    company_name = payload.get('company_name', '').strip()
    subject = payload.get('subject', '').strip()
    body_text = payload.get('body_text', '').strip()
    body_html = payload.get('body_html', '').strip()

    if not body_html and body_text:
        body_html = EmailService.plain_text_to_html(body_text, company_name)

    # Execute sending through EmailService with session credentials
    result = EmailService.send_application_email(
        recruiter_email=recruiter_email,
        job_role=job_role,
        company_name=company_name,
        custom_subject=subject,
        custom_body_html=body_html,
        custom_body_text=body_text,
        sender_email=sender_email,
        gmail_password=gmail_password,
    )

    return JsonResponse({
        'success': result['success'],
        'checkpoints': result['checkpoints'],
        'error': result.get('error'),
    })
