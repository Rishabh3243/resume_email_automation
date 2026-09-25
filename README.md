# Resume Email Automation Website (Django MVC - Zero Migration)

A full-stack, lightweight Django web application implementing the MVC architecture designed to streamline, personalize, validate, and automate job application email dispatches for **Rishabh Parmar** (AI/ML Engineer specializing in Computer Vision, Edge AI, and Applied Generative AI).

> **Zero Migration / Zero Database Setup**:
> This project is designed for zero friction. It requires **no database configuration and no `python manage.py migrate` command**. You can start it immediately with `python manage.py runserver`!

---

## Key Features

1. **Lightweight Django MVC Architecture**:
   - **Model / State**: Sent application history is stored in a clean local JSON file (`data/sent_history.json`), avoiding complex SQL migrations while still providing full audit history.
   - **View / Controller (`mailer/views.py` & `mailer/email_service.py`)**: Handles template switching, validation using `email-validator`, MIME assembly with resume attachments, Gmail SMTP connection, and real-time checkpoint responses.
   - **Templates (`templates/`)**: Built with responsive Tailwind CSS styling, dual-pane composer & live email preview, and interactive progress dialogs.

2. **Single `.env` Configuration**:
   All sensitive and operational variables are controlled from a single `.env` file:
   - `SENDER_EMAIL`: Your Gmail address.
   - `GMAIL_APP_PASSWORD`: 16-character Gmail App Password.
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `RESUME_PATH`: Path to resume PDF (`./ASSETS/resume.pdf`).
   - `DELAY_BETWEEN_EMAILS`: Automation throttle delay (`3.0` seconds).

3. **Dynamic Dual-Template System**:
   - **Template A (With Company Name)**: When a company name is supplied (e.g., *Google* or *NVIDIA*), the email automatically personalizes the body to mention the company.
   - **Template B (Without Company Name)**: If company name is left blank, the email seamlessly falls back to the clean generic opening without awkward phrasing.
   - Dynamic placeholders `<job_role>` and `<company_name>` are automatically populated.

4. **Editable Content with Live Preview & Reset**:
   - **Editable Subject & HTML**: Fine-tune the application email directly in the built-in editor before dispatching.
   - **Live Sandbox Preview**: Real-time iframe simulation showing exactly what the recruiter will see.
   - **Reset to Default Button**: Instantly restores the original template for the current job role and company selection.

5. **Recruiter Email Validation via `email-validator`**:
   - Fast syntax and MX deliverability validation using Python's `email-validator` library.
   - Inline feedback and pre-flight validation prior to dispatch.

6. **Interactive Checkpoint Modal Dialog**:
   - Clicking **Send Application** triggers an animated popup dialog showing real-time checkpoints:
     1. Recruiter Email Validation (`email-validator`)
     2. Resume PDF Attachment Verification
     3. HTML Content Compilation
     4. Gmail SMTP Authentication
     5. Transmission & Resume Delivery
     6. Audit Logging

---

## Project Structure

```
resume_email_automation/
├── .env                       # Active environment configuration
├── .env.example               # Reference environment variables
├── .gitignore                 # Git ignore file for secrets and cache
├── requirements.txt           # Python dependencies
├── manage.py                  # Django CLI entrypoint
├── README.md                  # Documentation
├── ASSETS/
│   └── resume.pdf             # Resume PDF attachment
├── data/
│   └── sent_history.json      # File-based audit log (zero migration)
├── resume_mailer/             # Django project settings
│   ├── __init__.py
│   ├── settings.py            # Reads .env, static & email settings (No DB needed)
│   ├── urls.py                # Main URL router
│   ├── wsgi.py
│   └── asgi.py
├── mailer/                    # Mailer Django application
│   ├── __init__.py
│   ├── forms.py               # Compose form definition
│   ├── email_service.py       # email-validator & SMTP delivery engine
│   ├── views.py               # Controllers and API endpoints
│   └── urls.py                # App-level routes
├── static/
│   ├── css/
│   │   └── style.css          # Custom styling & animations
│   └── js/
│       └── app.js             # Client-side preview, validation & checkpoints
└── templates/
    ├── base.html              # Base layout
    ├── mailer/
    │   ├── index.html         # Main compose & checkpoint interface
    │   └── history.html       # Email log audit dashboard
    └── emails/
        ├── with_company.html   # Template A (With Company)
        └── without_company.html# Template B (Without Company)
```

---

## Setup & Running (No Migrations Needed!)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Your `.env` File

Open `.env` and verify your Gmail credentials:

```env
SENDER_EMAIL=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
RESUME_PATH=./ASSETS/resume.pdf
DELAY_BETWEEN_EMAILS=3.0
```

> **How to generate a Gmail App Password:**
> 1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
> 2. Ensure **2-Step Verification** is turned ON.
> 3. Go to [App Passwords](https://myaccount.google.com/apppasswords).
> 4. Create a new app password (e.g. named "ResumeMailer") and copy the 16-character code into `GMAIL_APP_PASSWORD`.

### 3. Start the Server Directly

```bash
python manage.py runserver
```

Open your browser and navigate to:
```
http://127.0.0.1:8000/
```
No migrations or database commands are required!
