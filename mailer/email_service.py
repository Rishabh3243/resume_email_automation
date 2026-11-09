import os
import re
import html
import time
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import smtplib
from django.conf import settings
from email_validator import validate_email, EmailNotValidError

class EmailService:
    """
    Handles recruiter email validation, template interpolation,
    resume attachment (default file or uploaded custom file),
    and SMTP transmission with checkpoint tracking.
    """

    @staticmethod
    def validate_recruiter_email(email_str):
        """
        Validates email using python email-validator package.
        Checks syntax and deliverability.
        Returns (is_valid: bool, normalized_or_error: str)
        """
        if not email_str or not email_str.strip():
            return False, "Recruiter email cannot be blank."
        
        email_str = email_str.strip()
        try:
            try:
                validation = validate_email(email_str, check_deliverability=True)
            except Exception:
                validation = validate_email(email_str, check_deliverability=False)
            
            return True, validation.normalized
        except EmailNotValidError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Email validation failed: {str(e)}"

    @staticmethod
    def get_plain_text_template(has_company: bool) -> str:
        """
        Returns clean, standard plain text email body.
        """
        if has_company:
            return (
                "Respected HR Team,\n\n"
                "I’m reaching out to express my interest in the <job_role> position at <company_name>. "
                "The role closely aligns with my experience and interests in Computer Vision, Edge AI, and Generative AI.\n\n"
                "I have been working as a Junior AI/ML Engineer with hands-on experience in developing and deploying "
                "end-to-end AI solutions across both Edge Computer Vision and Applied Generative AI. My core work involves "
                "designing hardware-aware deep learning pipelines using technologies like Python, PyTorch, YOLO, TensorRT, "
                "and ONNX Runtime for embedded platforms including NVIDIA Jetson, NXP, and Raspberry Pi. Alongside my "
                "computer vision background, I also actively build Retrieval-Augmented Generation (RAG) architectures "
                "leveraging LLMs, LangChain, and ChromaDB to solve complex real-world problems.\n\n"
                "I am passionate about bridging the gap between advanced AI models and practical hardware constraints to "
                "deliver highly optimized, real-time applications. I believe my comprehensive technical stack, hands-on "
                "industry experience, and strong problem-solving abilities would allow me to make an immediate and meaningful "
                "impact on the innovative projects at <company_name>.\n\n"
                "I have attached my resume for your consideration. I would sincerely appreciate the opportunity to discuss "
                "how my experience aligns with your team's requirements. Thank you for your time, and I look forward to "
                "hearing from you.\n\n"
                "---\n"
                "**Rishabh Bharatbhai Parmar**\n\n"
                "**Email:** rishabhpar7@gmail.com\n"
                "**Phone:** +91 9998217585\n"
                "**LinkedIn:** https://www.linkedin.com/in/rishabh-parmar-650541200"
            )
        else:
            return (
                "Respected HR Team,\n\n"
                "I’m reaching out to express my interest in the <job_role> position. "
                "The role closely aligns with my experience and interests in Computer Vision, Edge AI, and Generative AI.\n\n"
                "I have been working as a Junior AI/ML Engineer with hands-on experience in developing and deploying "
                "end-to-end AI solutions across both Edge Computer Vision and Applied Generative AI. My core work involves "
                "designing hardware-aware deep learning pipelines using technologies like Python, PyTorch, YOLO, TensorRT, "
                "and ONNX Runtime for embedded platforms including NVIDIA Jetson, NXP, and Raspberry Pi. Alongside my "
                "computer vision background, I also actively build Retrieval-Augmented Generation (RAG) architectures "
                "leveraging LLMs, LangChain, and ChromaDB to solve complex real-world problems.\n\n"
                "I am passionate about bridging the gap between advanced AI models and practical hardware constraints to "
                "deliver highly optimized, real-time applications. I believe my comprehensive technical stack, hands-on "
                "industry experience, and strong problem-solving abilities would allow me to make an immediate and meaningful "
                "impact on the innovative projects.\n\n"
                "I have attached my resume for your consideration. I would sincerely appreciate the opportunity to discuss "
                "how my experience aligns with your team's requirements. Thank you for your time, and I look forward to "
                "hearing from you.\n\n"
                "---\n"
                "**Rishabh Bharatbhai Parmar**\n\n"
                "**Email:** rishabhpar7@gmail.com\n"
                "**Phone:** +91 9998217585\n"
                "**LinkedIn:** https://www.linkedin.com/in/rishabh-parmar-650541200"
            )

    @staticmethod
    def render_plain_text(template_str: str, job_role: str, company_name: str = "") -> str:
        """
        Populates placeholders in plain text template.
        """
        role = job_role.strip() if job_role else "Junior AI/ML Engineer"
        company = company_name.strip() if company_name else ""
        rendered = template_str.replace('<job_role>', role).replace('<company_name>', company)
        rendered = rendered.replace('&lt;job_role&gt;', role).replace('&lt;company_name&gt;', company)
        return rendered

    @staticmethod
    def plain_text_to_html(text: str, company_name: str = "") -> str:
        """
        Converts user plain text into clean, modern, left-aligned HTML email,
        safely highlighting key domains and contact info.
        """
        if not text:
            return ""

        trimmed = text.strip()
        if trimmed.lower().startswith('<!doctype') or trimmed.lower().startswith('<html'):
            return trimmed

        normalized = trimmed.replace('\r\n', '\n').replace('\r', '\n')
        paragraphs = re.split(r'\n{2,}', normalized)

        formatted_paragraphs = []
        for p in paragraphs:
            p_clean = p.strip()
            if not p_clean:
                continue

            # Standalone horizontal divider
            if re.match(r'^-{3,}$', p_clean):
                formatted_paragraphs.append('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">')
                continue

            has_leading_hr = False
            if re.match(r'^-{3,}\s*\n', p_clean):
                has_leading_hr = True
                p_clean = re.sub(r'^-{3,}\s*\n+', '', p_clean)

            # Escape HTML entities
            p_escaped = html.escape(p_clean)

            # Support markdown bold syntax: **word** -> <strong>word</strong>
            p_escaped = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p_escaped)

            # Bold company name if present and not already bolded
            if company_name and company_name.strip():
                c_name = html.escape(company_name.strip())
                pattern = rf'(?<!<strong>)\b{re.escape(c_name)}\b(?!</strong>)'
                p_escaped = re.sub(pattern, f'<strong>{c_name}</strong>', p_escaped, flags=re.IGNORECASE)

            # Bold key domains if not already wrapped
            skills_patterns = [
                r'Computer Vision,\s*Edge AI,?\s*and\s*Generative AI',
                r'Computer Vision,\s*Edge AI\s*and\s*Generative AI',
            ]
            for pat in skills_patterns:
                p_escaped = re.sub(rf'(?<!<strong>)({pat})(?!</strong>)', r'<strong>\1</strong>', p_escaped, flags=re.IGNORECASE)

            # Bold name and contact labels
            for sig in [r'Rishabh Bharatbhai Parmar', r'Email:', r'Phone:', r'LinkedIn:']:
                p_escaped = re.sub(rf'(?<!<strong>)({sig})(?!</strong>)', r'<strong>\1</strong>', p_escaped)

            # Linkify URLs: https://...
            p_escaped = re.sub(
                r'(https?://[^\s<]+)',
                r'<a href="\1" target="_blank" style="color: #2563eb; text-decoration: underline;">\1</a>',
                p_escaped
            )

            # Linkify email addresses
            p_escaped = re.sub(
                r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b',
                r'<a href="mailto:\1" style="color: #2563eb; text-decoration: underline;">\1</a>',
                p_escaped
            )

            p_escaped = p_escaped.replace('\n', '<br>')

            if has_leading_hr:
                formatted_paragraphs.append('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">')

            formatted_paragraphs.append(
                f'<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.65; color: #1e293b; text-align: left;">{p_escaped}</p>'
            )

        body_inner = '\n        '.join(formatted_paragraphs)
        return (
            '<!DOCTYPE html>\n'
            '<html lang="en">\n'
            '<head>\n'
            '    <meta charset="UTF-8">\n'
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            '</head>\n'
            '<body style="margin: 0; padding: 20px 24px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #1e293b; background-color: #ffffff; text-align: left;">\n'
            '    <div style="max-width: 680px; margin: 0 auto; text-align: left;">\n'
            f'        {body_inner}\n'
            '    </div>\n'
            '</body>\n'
            '</html>'
        )

    @staticmethod
    def get_default_subject(job_role: str) -> str:
        """
        Returns default subject formatted with job_role.
        """
        role = job_role.strip() if job_role else "Junior AI/ML Engineer"
        return f"Application for {role} Role – Rishabh Parmar"

    @staticmethod
    def resolve_resume_path(custom_path: str = None) -> Path:
        """
        Resolves absolute path for default resume PDF.
        """
        target = custom_path or getattr(settings, 'RESUME_PATH', './ASSETS/Rishabh_Parmar_Resume.pdf')
        path_obj = Path(target)
        if not path_obj.is_absolute():
            path_obj = (Path(settings.BASE_DIR) / path_obj).resolve()
        
        # Fallback if target does not exist
        if not path_obj.exists():
            alt = Path(settings.BASE_DIR) / 'ASSETS' / 'Rishabh_Parmar_Resume.pdf'
            if alt.exists():
                return alt
        return path_obj

    @classmethod
    def send_application_email(cls, recruiter_email: str, job_role: str, company_name: str,
                               custom_subject: str, custom_body_html: str,
                               resume_choice: str = 'default',
                               custom_resume_file = None,
                               custom_body_text: str = None,
                               sender_email: str = None,
                               gmail_password: str = None):
        """
        Executes the step-by-step email sending process with checkpoint reporting.
        Supports both default resume file and user-uploaded custom resume.
        """
        checkpoints = []

        # Checkpoint 1: Email Validation using email-validator
        checkpoints.append({
            'step': 1,
            'title': 'Recruiter Email Validation',
            'status': 'running',
            'detail': f"Validating '{recruiter_email}' using email-validator..."
        })

        is_valid, email_result = cls.validate_recruiter_email(recruiter_email)
        if not is_valid:
            checkpoints[-1]['status'] = 'failed'
            checkpoints[-1]['detail'] = f"Validation Error: {email_result}"
            return {
                'success': False,
                'checkpoints': checkpoints,
                'error': email_result
            }
        
        normalized_email = email_result
        checkpoints[-1]['status'] = 'passed'
        checkpoints[-1]['detail'] = f"Valid Recruiter Email confirmed ({normalized_email})."

        # Checkpoint 2: Verify Resume File (Default vs Uploaded)
        checkpoints.append({
            'step': 2,
            'title': 'Resume Attachment Verification',
            'status': 'running',
            'detail': 'Verifying resume attachment...'
        })

        attachment_bytes = None
        attachment_filename = None
        is_custom_resume = (resume_choice == 'upload')

        if is_custom_resume:
            if not custom_resume_file:
                err_msg = "Custom resume option was chosen, but no file was uploaded. Please attach a resume or select 'Use Default Resume'."
                checkpoints[-1]['status'] = 'failed'
                checkpoints[-1]['detail'] = err_msg
                return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

            try:
                if hasattr(custom_resume_file, 'read'):
                    attachment_bytes = custom_resume_file.read()
                    attachment_filename = getattr(custom_resume_file, 'name', 'Resume.pdf')
                elif isinstance(custom_resume_file, bytes):
                    attachment_bytes = custom_resume_file
                    attachment_filename = 'Resume.pdf'

                if not attachment_bytes:
                    err_msg = "Uploaded resume file is empty (0 bytes)."
                    checkpoints[-1]['status'] = 'failed'
                    checkpoints[-1]['detail'] = err_msg
                    return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

                size_kb = round(len(attachment_bytes) / 1024, 2)
                checkpoints[-1]['status'] = 'passed'
                checkpoints[-1]['detail'] = f"Custom resume verified: {attachment_filename} ({size_kb} KB)."
            except Exception as e:
                err_msg = f"Failed to process custom resume file: {str(e)}"
                checkpoints[-1]['status'] = 'failed'
                checkpoints[-1]['detail'] = err_msg
                return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}
        else:
            # Default Resume File
            default_path = cls.resolve_resume_path()
            if not default_path.exists() or not default_path.is_file():
                err_msg = f"Default resume file not found at: {default_path}. Please verify ASSETS directory."
                checkpoints[-1]['status'] = 'failed'
                checkpoints[-1]['detail'] = err_msg
                return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

            try:
                attachment_bytes = default_path.read_bytes()
                attachment_filename = default_path.name
                size_kb = round(len(attachment_bytes) / 1024, 2)
                checkpoints[-1]['status'] = 'passed'
                checkpoints[-1]['detail'] = f"Default resume verified: {attachment_filename} ({size_kb} KB)."
            except Exception as e:
                err_msg = f"Failed reading default resume file: {str(e)}"
                checkpoints[-1]['status'] = 'failed'
                checkpoints[-1]['detail'] = err_msg
                return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

        # Checkpoint 3: Email Preparation & Personalization
        checkpoints.append({
            'step': 3,
            'title': 'Email Compilation & Personalization',
            'status': 'running',
            'detail': 'Compiling email subject and HTML content...'
        })

        final_subject = custom_subject.strip() if custom_subject else cls.get_default_subject(job_role)

        if custom_body_html and '<html' in custom_body_html.lower():
            final_html = custom_body_html.strip()
            final_text = custom_body_text.strip() if custom_body_text else ""
        elif custom_body_text:
            final_text = custom_body_text.strip()
            final_html = cls.plain_text_to_html(final_text, company_name)
        elif custom_body_html:
            final_text = custom_body_html.strip()
            final_html = cls.plain_text_to_html(custom_body_html, company_name)
        else:
            final_text = cls.render_plain_text(
                cls.get_plain_text_template(bool(company_name.strip())), job_role, company_name
            )
            final_html = cls.plain_text_to_html(final_text, company_name)

        checkpoints[-1]['status'] = 'passed'
        checkpoints[-1]['detail'] = f"Subject: '{final_subject}'. Email payload ready."

        # Checkpoint 4: SMTP Gmail Connection & Authentication
        checkpoints.append({
            'step': 4,
            'title': 'Gmail SMTP Authentication',
            'status': 'running',
            'detail': f"Connecting to {settings.SMTP_HOST}:{settings.SMTP_PORT} via TLS..."
        })

        clean_sender = (sender_email or '').strip()
        clean_password = (gmail_password or '').strip().replace(' ', '')

        if not clean_sender or not clean_password:
            err_msg = "Sender email or Gmail App Password is not provided for this session."
            checkpoints[-1]['status'] = 'failed'
            checkpoints[-1]['detail'] = err_msg
            return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

        # Build MIME Message
        msg = MIMEMultipart('mixed')
        msg['Subject'] = final_subject
        msg['From'] = f"Rishabh Parmar <{clean_sender}>"
        msg['To'] = normalized_email

        # Attach alternative body (plain text + clean HTML)
        msg_body = MIMEMultipart('alternative')
        if final_text:
            text_part = MIMEText(final_text, 'plain', 'utf-8')
            msg_body.attach(text_part)
        html_part = MIMEText(final_html, 'html', 'utf-8')
        msg_body.attach(html_part)
        msg.attach(msg_body)

        # Attach Resume
        try:
            subtype = 'pdf'
            fname_lower = (attachment_filename or '').lower()
            if fname_lower.endswith('.docx'):
                subtype = 'vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif fname_lower.endswith('.doc'):
                subtype = 'msword'

            pdf_attachment = MIMEApplication(attachment_bytes, _subtype=subtype)
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=attachment_filename)
            msg.attach(pdf_attachment)
        except Exception as e:
            err_msg = f"Failed to attach resume file: {str(e)}"
            checkpoints[-1]['status'] = 'failed'
            checkpoints[-1]['detail'] = err_msg
            return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

        # Checkpoint 5: Sending Email via SMTP
        checkpoints.append({
            'step': 5,
            'title': 'Sending Application Email',
            'status': 'running',
            'detail': f"Dispatching email with {attachment_filename} to {normalized_email}..."
        })

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=25) as server:
                server.ehlo()
                if getattr(settings, 'EMAIL_USE_TLS', True):
                    server.starttls()
                    server.ehlo()
                server.login(clean_sender, clean_password)

                checkpoints[-2]['status'] = 'passed'
                checkpoints[-2]['detail'] = f"Authenticated securely as {clean_sender}."

                server.sendmail(clean_sender, [normalized_email], msg.as_string())

            checkpoints[-1]['status'] = 'passed'
            checkpoints[-1]['detail'] = f"Email successfully dispatched to {normalized_email}."
        except smtplib.SMTPAuthenticationError:
            err_msg = "SMTP Authentication Failed. Please verify your 16-character Google App Password."
            checkpoints[-2]['status'] = 'failed'
            checkpoints[-2]['detail'] = err_msg
            checkpoints[-1]['status'] = 'failed'
            checkpoints[-1]['detail'] = "Transmission aborted due to authentication error."
            return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}
        except Exception as e:
            err_msg = f"SMTP Transmission error: {str(e)}"
            checkpoints[-1]['status'] = 'failed'
            checkpoints[-1]['detail'] = err_msg
            return {'success': False, 'checkpoints': checkpoints, 'error': err_msg}

        # Checkpoint 6: Delay / Rate Limiting
        delay_sec = float(getattr(settings, 'DELAY_BETWEEN_EMAILS', 3.0))
        checkpoints.append({
            'step': 6,
            'title': 'Automation Delay Throttling',
            'status': 'running',
            'detail': f"Throttling {delay_sec}s between email dispatches..."
        })

        if delay_sec > 0:
            time.sleep(delay_sec)

        checkpoints[-1]['status'] = 'passed'
        checkpoints[-1]['detail'] = f"Throttle delay of {delay_sec}s completed. Delivery finalized."

        return {
            'success': True,
            'checkpoints': checkpoints,
            'normalized_email': normalized_email,
            'subject': final_subject,
            'attachment_filename': attachment_filename,
            'error': None
        }
