# JobApp Dispatcher – Resume Email Automation Platform

A modern, full-stack, lightweight Django web application implementing the MVC architecture designed to streamline, personalize, validate, and automate job application email dispatches for **Rishabh Bharatbhai Parmar** (AI/ML Engineer specializing in Computer Vision, Edge AI, and Applied Generative AI).

> **Zero Migration / Zero Database Required**:  
> This project requires **no database configuration and no `python manage.py migrate` command**. You can start it immediately with `python manage.py runserver`!

---

## Key Features

### 1. In-Memory Session Credential Security (Zero Disk Storage)
- **Zero Secrets on Disk**: Sender Gmail address and Google App Password are never saved to disk or `.env`.
- **Transient Session Cookies**: Credentials are kept securely in encrypted, signed browser session cookies and are automatically destroyed upon closing the browser.
- **Switch Credentials Anytime**: Easily log out or switch Gmail sender accounts from the top navigation bar.

### 2. Dual Resume Support (Default vs. Custom Upload)
- **Default Resume (`ASSETS/Rishabh_Parmar_Resume.pdf`)**: Pre-configured, verified, and ready to attach with a single click.
- **Custom Resume Upload**: Drag-and-drop or select any custom resume file (`.pdf`, `.docx`, `.doc` up to 10MB) per application.
- **Dynamic Header Preview**: The live email preview header instantly reflects the selected resume attachment filename and file type icon.

### 3. Dynamic Dual-Template Personalization Engine
- **Template A (With Company Name)**: When a company name is supplied (e.g., *NVIDIA*, *Google*, or *Apple*), the email automatically personalizes the body to mention the company.
- **Template B (Without Company Name)**: If company name is left blank, the email seamlessly falls back to a clean direct opening without awkward syntax.
- **Auto-Highlighting**: Key technical specializations (*Computer Vision, Edge AI, and Generative AI*) and contact labels are automatically bolded and formatted.

### 4. Interactive Application Composer & Live Email Preview
- **Real-Time Sandbox Preview**: Embedded preview simulating an actual email client (recipient view, From, To, Subject, and Attachment badges).
- **Update Live Email Button**: Instantly regenerates and syncs the tailored template for the current job role and company selection with built-in instant client-side resilience.
- **Automatic Real-Time Sync**: Smoothly updates the live email preview as you type, eliminating the need for manual preview refresh buttons.

### 5. Pre-Flight Recruiter Email Validation (`email-validator`)
- Uses Python's `email-validator` library to check syntax and verify domain MX deliverability before sending.
- Inline validation badge with quick "Validate" button and feedback.

### 6. Automated 5-Step Pipeline Checkpoints Modal
Clicking **Send Application** triggers an animated checkpoint modal showing real-time progress:
1. **Recruiter Email Validation** (`email-validator` syntax & deliverability)
2. **Resume Attachment Verification** (validates default PDF or uploaded custom file)
3. **HTML Content Compilation** (MIME multipart encapsulation)
4. **Gmail SMTP Authentication** (TLS connection to `smtp.gmail.com:587`)
5. **Transmission & Delivery** (streams payload and binary resume attachment)

---

## Project Structure

```
resume_email_automation/
├── .env                       # Environment configuration (SMTP, Resume path, Throttling)
├── .gitignore                 # Git ignore file for secrets and cache
├── requirements.txt           # Python dependencies
├── manage.py                  # Django CLI entrypoint
├── README.md                  # Complete documentation
├── ASSETS/
│   └── Rishabh_Parmar_Resume.pdf # Default candidate resume PDF
├── resume_mailer/             # Django project settings
│   ├── __init__.py
│   ├── settings.py            # Zero-migration session & SMTP settings
│   ├── urls.py                # Main URL router
│   ├── wsgi.py
│   └── asgi.py
├── mailer/                    # Mailer Django application
│   ├── __init__.py
│   ├── apps.py                # App configuration
│   ├── forms.py               # Compose form definition (text & file upload)
│   ├── email_service.py       # email-validator & SMTP transmission engine
│   ├── views.py               # Controllers, session setup & API endpoints
│   └── urls.py                # Application routes
├── static/
│   ├── css/
│   │   └── style.css          # Checkpoint animations, dropzone & preview styles
│   └── js/
│       └── app.js             # Client logic: preview, upload, reset, modal
└── templates/
    ├── base.html              # Base layout with navbar and footer
    └── mailer/
        ├── setup.html         # Session credentials setup screen
        └── index.html         # Application composer, resume switcher & live preview
```

---

## Quick Start Guide

### 1. Clone or Open the Repository
```bash
cd resume_email_automation
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Verify Environment Settings (`.env`)
The `.env` file controls non-sensitive automation settings:
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Resume and Automation Settings
RESUME_PATH=./ASSETS/Rishabh_Parmar_Resume.pdf
DELAY_BETWEEN_EMAILS=3.0

# Django Settings
DJANGO_SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

### 4. Start the Application
```bash
python manage.py runserver
```

Open your browser and navigate to:
```
http://127.0.0.1:8000/
```

---

## How to Generate a Google App Password

For security, Gmail requires an **App Password** for SMTP automation:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is enabled.
3. Open [Google App Passwords](https://myaccount.google.com/apppasswords).
4. Enter an application name (e.g., `ResumeMailer`) and click **Create**.
5. Copy the 16-character code (e.g., `xxxx xxxx xxxx xxxx`).
6. Paste your Gmail address and 16-character password into the JobApp Dispatcher startup screen.

---

## API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/setup/` | `GET`, `POST` | Setup transient browser session credentials. |
| `/logout/` | `GET` | Flush browser session and credentials from memory. |
| `/` | `GET` | Main application composer and preview dashboard. |
| `/api/get-template/` | `GET`, `POST` | Returns default template populated with `job_role` and `company_name`. |
| `/api/validate-email/` | `POST` | Validates recruiter email syntax and domain deliverability via `email-validator`. |
| `/api/send-email/` | `POST` | Dispatches email and attached resume (supports `multipart/form-data` for uploads). |

---

## License & Author

- **Author**: [Rishabh Bharatbhai Parmar](https://www.linkedin.com/in/rishabh-parmar-650541200)
- **Role**: AI/ML Engineer (Computer Vision, Edge AI & Applied Generative AI)
- **Email**: [rishabhpar7@gmail.com](mailto:rishabhpar7@gmail.com)
