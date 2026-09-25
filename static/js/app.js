/**
 * Resume Mailer Automation - Client Logic
 * Handles dynamic preview, template reset, email-validator integration,
 * and multi-step checkpoint modal animation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Form Inputs
    const recruiterEmailInput = document.getElementById('id_recruiter_email');
    const jobRoleInput = document.getElementById('id_job_role');
    const companyNameInput = document.getElementById('id_company_name');
    const subjectInput = document.getElementById('id_subject');
    const bodyTextInput = document.getElementById('id_body_text');
    const bodyHtmlInput = document.getElementById('id_body_html');

    // UI Elements
    const previewFrame = document.getElementById('preview-frame');
    const previewTo = document.getElementById('preview-to');
    const previewSubject = document.getElementById('preview-subject');
    const templateHint = document.getElementById('template-hint-text');
    const emailValidationBadge = document.getElementById('email-validation-badge');
    const emailValidationMsg = document.getElementById('email-validation-msg');

    // Track previous role to update body text dynamically
    let previousRole = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';

    // Buttons
    const btnResetTemplate = document.getElementById('btn-reset-template');
    const btnSyncPreview = document.getElementById('btn-sync-preview');
    const btnValidateQuick = document.getElementById('btn-validate-email-quick');
    const btnOpenSendModal = document.getElementById('btn-open-send-modal');
    const btnMobilePreview = document.getElementById('btn-mobile-preview-toggle');

    // Modal Elements
    const checkpointModal = document.getElementById('checkpoint-modal');
    const modalCloseX = document.getElementById('modal-close-x');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalHistoryBtn = document.getElementById('modal-history-btn');
    const modalResultBanner = document.getElementById('modal-result-banner');

    // Helper: Escape HTML
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper: Convert plain text into clean, simple, left-aligned HTML email
    function convertPlainTextToHtml(text, companyName) {
        if (!text || !text.trim()) {
            return '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #888; padding: 20px; text-align: left;">No email content specified.</div>';
        }

        const trimmed = text.trim();
        // If raw full HTML was provided, return as-is
        if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
            return trimmed;
        }

        const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const rawParagraphs = normalized.split(/\n{2,}/);

        const formattedParagraphs = [];
        rawParagraphs.forEach(p => {
            let pClean = p.trim();
            if (!pClean) return;

            // Standalone horizontal line
            if (/^-{3,}$/.test(pClean)) {
                formattedParagraphs.push('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">');
                return;
            }

            let hasLeadingHr = false;
            if (/^-{3,}\s*\n/.test(pClean)) {
                hasLeadingHr = true;
                pClean = pClean.replace(/^-{3,}\s*\n+/, '');
            }

            let safe = escapeHtml(pClean);

            // Support markdown bolding: **word** -> <strong>word</strong>
            safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Bold company name if provided and present
            if (companyName && companyName.trim()) {
                const cEscaped = escapeHtml(companyName.trim());
                const escapedRegex = cEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const compRegex = new RegExp(`(?<!<strong>)${escapedRegex}(?!</strong>)`, 'gi');
                safe = safe.replace(compRegex, `<strong>${cEscaped}</strong>`);
            }

            // Bold key technical domains: "Computer Vision, Edge AI, and Generative AI"
            const skillsRegex1 = /(?<!<strong>)(Computer Vision,\s*Edge AI,?\s*and\s*Generative AI)(?!<\/strong>)/gi;
            const skillsRegex2 = /(?<!<strong>)(Computer Vision,\s*Edge AI\s*and\s*Generative AI)(?!<\/strong>)/gi;
            safe = safe.replace(skillsRegex1, '<strong>$1</strong>');
            safe = safe.replace(skillsRegex2, '<strong>$1</strong>');

            // Bold name and contact labels
            safe = safe.replace(/(?<!<strong>)(Rishabh Bharatbhai Parmar)(?!<\/strong>)/g, '<strong>$1</strong>');
            safe = safe.replace(/(?<!<strong>)(Email:)(?!<\/strong>)/g, '<strong>$1</strong>');
            safe = safe.replace(/(?<!<strong>)(Phone:)(?!<\/strong>)/g, '<strong>$1</strong>');
            safe = safe.replace(/(?<!<strong>)(LinkedIn:)(?!<\/strong>)/g, '<strong>$1</strong>');

            // Linkify URLs: https://...
            safe = safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');

            // Linkify emails
            safe = safe.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1" style="color: #2563eb; text-decoration: underline;">$1</a>');

            // Line breaks
            safe = safe.replace(/\n/g, '<br>');

            if (hasLeadingHr) {
                formattedParagraphs.push('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">');
            }

            formattedParagraphs.push(`<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #222222; text-align: left;">${safe}</p>`);
        });

        const bodyInner = formattedParagraphs.join('\n        ');
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #222222; background-color: #ffffff; text-align: left;">
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #222222; text-align: left; padding: 10px 0;">
        ${bodyInner}
    </div>
</body>
</html>`;
    }

    // Helper: Get CSRF Token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken') || (document.querySelector('[name=csrfmiddlewaretoken]')?.value);

    // 1. Update Preview Render
    function renderPreview() {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : `Application for ${role} Role – Rishabh Parmar`;
        const bodyText = bodyTextInput ? bodyTextInput.value : '';

        // Update Header Preview
        if (previewTo) {
            previewTo.textContent = email ? email : '(Recruiter email will appear here)';
        }
        if (previewSubject) {
            previewSubject.textContent = subject || `Application for ${role} Role – Rishabh Parmar`;
        }

        // Convert plain text to clean, simple, left-aligned HTML email
        const generatedHtml = convertPlainTextToHtml(bodyText, company);

        // Keep hidden HTML input in sync
        if (bodyHtmlInput) {
            bodyHtmlInput.value = generatedHtml;
        }

        // Update iframe preview (simple, left-aligned, no template container effects)
        if (previewFrame) {
            const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            doc.open();
            doc.write(generatedHtml);
            doc.close();
        }

        // Update Template Hint
        if (templateHint) {
            if (company) {
                templateHint.innerHTML = `Company specified (<strong>${company}</strong>): Using <strong>Template A</strong> (with company name).`;
            } else {
                templateHint.innerHTML = `Company name omitted: Using <strong>Template B</strong> (without company name).`;
            }
        }
    }

    // Dynamic Job Role change: Update Subject Line Role dynamically
    function handleRoleChange() {
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        
        // Always update the subject line role
        if (subjectInput) {
            subjectInput.value = `Application for ${role} Role – Rishabh Parmar`;
        }

        // Also dynamically update role inside body text if present
        if (bodyTextInput && previousRole && previousRole !== role) {
            const currentBody = bodyTextInput.value;
            if (currentBody.includes(previousRole)) {
                bodyTextInput.value = currentBody.split(previousRole).join(role);
            }
        }

        previousRole = role;
        renderPreview();
    }

    // Dynamic Company Name change: Update preview & template hint in real-time
    function handleCompanyChange() {
        renderPreview();
    }

    // Attach Live Input Listeners
    if (bodyTextInput) bodyTextInput.addEventListener('input', renderPreview);
    if (jobRoleInput) jobRoleInput.addEventListener('input', handleRoleChange);
    if (companyNameInput) companyNameInput.addEventListener('input', handleCompanyChange);
    if (subjectInput) subjectInput.addEventListener('input', renderPreview);
    if (recruiterEmailInput) recruiterEmailInput.addEventListener('input', renderPreview);
    if (btnSyncPreview) btnSyncPreview.addEventListener('click', renderPreview);

    // 2. Reset to Default Template Button
    async function resetToDefaultTemplate() {
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';

        try {
            btnResetTemplate.disabled = true;
            btnResetTemplate.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i> Resetting...';

            const response = await fetch(`/api/get-template/?job_role=${encodeURIComponent(role)}&company_name=${encodeURIComponent(company)}`);
            const data = await response.json();

            if (data.success) {
                if (subjectInput) subjectInput.value = data.subject;
                if (bodyTextInput) bodyTextInput.value = data.body_text;
                if (bodyHtmlInput) bodyHtmlInput.value = data.body_html;
                previousRole = role;
                renderPreview();
            }
        } catch (err) {
            console.error('Failed to reset template:', err);
            alert('Failed to reset template from server.');
        } finally {
            btnResetTemplate.disabled = false;
            btnResetTemplate.innerHTML = '<i class="fa-solid fa-arrow-rotate-left text-slate-500"></i> Reset to Default';
        }
    }

    if (btnResetTemplate) {
        btnResetTemplate.addEventListener('click', resetToDefaultTemplate);
    }

    // When company input changes on blur, offer automatic template update if needed
    let lastCompanyState = Boolean(companyNameInput ? companyNameInput.value.trim() : false);
    if (companyNameInput) {
        companyNameInput.addEventListener('blur', () => {
            const currentCompanyState = Boolean(companyNameInput.value.trim());
            if (currentCompanyState !== lastCompanyState) {
                lastCompanyState = currentCompanyState;
                resetToDefaultTemplate();
            }
        });
    }

    // 3. Email Validation (email-validator API)
    async function validateEmail(showSuccessState = true) {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        if (!email) {
            if (emailValidationBadge) {
                emailValidationBadge.className = 'text-xs text-rose-500 font-medium flex items-center gap-1';
                emailValidationBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Email cannot be empty';
                emailValidationBadge.classList.remove('hidden');
            }
            return false;
        }

        if (emailValidationBadge) {
            emailValidationBadge.className = 'text-xs text-blue-500 font-medium flex items-center gap-1';
            emailValidationBadge.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i> Validating with email-validator...';
            emailValidationBadge.classList.remove('hidden');
        }

        try {
            const res = await fetch('/api/validate-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ email: email })
            });
            const data = await res.json();

            if (data.is_valid) {
                if (emailValidationBadge && showSuccessState) {
                    emailValidationBadge.className = 'text-xs text-emerald-600 font-medium flex items-center gap-1';
                    emailValidationBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Valid (${data.normalized})`;
                }
                return true;
            } else {
                if (emailValidationBadge) {
                    emailValidationBadge.className = 'text-xs text-rose-600 font-medium flex items-center gap-1';
                    emailValidationBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${data.error || 'Invalid recruiter email'}`;
                }
                return false;
            }
        } catch (err) {
            if (emailValidationBadge) {
                emailValidationBadge.className = 'text-xs text-amber-600 font-medium flex items-center gap-1';
                emailValidationBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Validation server error`;
            }
            return false;
        }
    }

    if (btnValidateQuick) {
        btnValidateQuick.addEventListener('click', () => validateEmail(true));
    }
    if (recruiterEmailInput) {
        recruiterEmailInput.addEventListener('blur', () => {
            if (recruiterEmailInput.value.trim()) {
                validateEmail(true);
            }
        });
    }

    // 4. Modal and Checkpoints UI Management
    function resetCheckpoints() {
        for (let i = 1; i <= 5; i++) {
            const cp = document.getElementById(`cp-${i}`);
            if (cp) {
                cp.className = 'checkpoint-item flex items-start space-x-3.5 p-3 rounded-xl border border-slate-200 transition-all bg-slate-50';
                const icon = cp.querySelector('.cp-icon');
                if (icon) icon.innerHTML = '<i class="fa-regular fa-circle text-slate-400 text-base"></i>';
                const status = cp.querySelector('.cp-status');
                if (status) {
                    status.className = 'cp-status text-xs font-mono font-medium text-slate-500';
                    status.textContent = 'Pending';
                }
            }
        }

        if (modalResultBanner) {
            modalResultBanner.className = 'hidden rounded-xl p-4 text-xs font-medium border';
            modalResultBanner.innerHTML = '';
        }
        if (modalCloseBtn) modalCloseBtn.classList.add('hidden');
        if (modalCloseX) modalCloseX.style.display = 'none';
        if (modalHistoryBtn) modalHistoryBtn.classList.add('hidden');
    }

    function updateCheckpointUI(stepNum, status, detailMessage) {
        const cp = document.getElementById(`cp-${stepNum}`);
        if (!cp) return;

        const icon = cp.querySelector('.cp-icon');
        const statusSpan = cp.querySelector('.cp-status');
        const detailP = cp.querySelector('.cp-detail');

        if (detailMessage && detailP) {
            detailP.textContent = detailMessage;
        }

        if (status === 'running') {
            cp.className = 'checkpoint-item checkpoint-running flex items-start space-x-3.5 p-3 rounded-xl border border-blue-400 bg-blue-50/60 shadow-sm';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-spinner spinner-icon text-blue-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-blue-600';
                statusSpan.textContent = 'Processing...';
            }
        } else if (status === 'passed') {
            cp.className = 'checkpoint-item checkpoint-passed flex items-start space-x-3.5 p-3 rounded-xl border border-emerald-400 bg-emerald-50/60 shadow-sm';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-emerald-700';
                statusSpan.textContent = 'Done ✓';
            }
        } else if (status === 'failed') {
            cp.className = 'checkpoint-item checkpoint-failed flex items-start space-x-3.5 p-3 rounded-xl border border-rose-400 bg-rose-50/70 shadow-sm';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-rose-700';
                statusSpan.textContent = 'Failed ✗';
            }
        }
    }

    // 5. Send Email with Animated Checkpoints Popup
    async function handleSendApplication() {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : `Application for ${role} Role – Rishabh Parmar`;
        const bodyText = bodyTextInput ? bodyTextInput.value.trim() : '';
        let bodyHtml = bodyHtmlInput ? bodyHtmlInput.value.trim() : '';

        if (!bodyHtml && bodyText) {
            bodyHtml = convertPlainTextToHtml(bodyText, company);
        }

        if (!email) {
            alert('Please enter a recruiter email address.');
            if (recruiterEmailInput) recruiterEmailInput.focus();
            return;
        }

        // Open Modal
        resetCheckpoints();
        checkpointModal.classList.remove('hidden');

        // Step 1: Client displays Step 1 Running
        updateCheckpointUI(1, 'running', `Verifying recruiter email (${email}) with email-validator...`);

        // Prepare Payload
        const payload = {
            recruiter_email: email,
            job_role: role,
            company_name: company,
            subject: subject,
            body_text: bodyText,
            body_html: bodyHtml
        };

        try {
            // Simulated visual cadence for the checkpoints while the backend executes
            setTimeout(() => {
                const cp1 = document.getElementById('cp-1');
                if (cp1 && cp1.classList.contains('checkpoint-running')) {
                    updateCheckpointUI(2, 'running', 'Verifying resume attachment at ./ASSETS/resume.pdf...');
                }
            }, 500);

            setTimeout(() => {
                const cp2 = document.getElementById('cp-2');
                if (cp2 && cp2.classList.contains('checkpoint-running')) {
                    updateCheckpointUI(3, 'running', 'Compiling MIME multipart structure & resume binary...');
                }
            }, 1000);

            // Trigger Backend AJAX Execution
            const response = await fetch('/api/send-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // Reconcile and apply all checkpoints reported by backend
            if (result.checkpoints && result.checkpoints.length > 0) {
                result.checkpoints.forEach(cp => {
                    const stepNum = Math.min(cp.step, 5);
                    updateCheckpointUI(stepNum, cp.status, cp.detail);
                });
            }

            if (result.success) {
                // All 5 steps completed
                for (let i = 1; i <= 5; i++) {
                    updateCheckpointUI(i, 'passed');
                }

                if (modalResultBanner) {
                    modalResultBanner.className = 'rounded-xl p-4 text-xs font-medium border bg-emerald-50 border-emerald-300 text-emerald-900 flex items-start gap-3';
                    modalResultBanner.innerHTML = `
                        <i class="fa-solid fa-circle-check text-emerald-600 text-lg mt-0.5"></i>
                        <div>
                            <strong class="font-bold text-emerald-800 text-sm block">Application Successfully Dispatched!</strong>
                            <p class="mt-0.5 text-emerald-700">Email delivered to <strong>${result.normalized_email || email}</strong> with attached resume.</p>
                        </div>
                    `;
                    modalResultBanner.classList.remove('hidden');
                }
            } else {
                // Encountered error
                const errorMsg = result.error || 'An error occurred during dispatch.';
                if (modalResultBanner) {
                    modalResultBanner.className = 'rounded-xl p-4 text-xs font-medium border bg-rose-50 border-rose-300 text-rose-900 flex items-start gap-3';
                    modalResultBanner.innerHTML = `
                        <i class="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5"></i>
                        <div>
                            <strong class="font-bold text-rose-800 text-sm block">Dispatch Failed</strong>
                            <p class="mt-0.5 text-rose-700">${errorMsg}</p>
                        </div>
                    `;
                    modalResultBanner.classList.remove('hidden');
                }
            }

        } catch (err) {
            console.error('Send error:', err);
            updateCheckpointUI(4, 'failed', 'Network or connection error.');
            if (modalResultBanner) {
                modalResultBanner.className = 'rounded-xl p-4 text-xs font-medium border bg-rose-50 border-rose-300 text-rose-900 flex items-start gap-3';
                modalResultBanner.innerHTML = `
                    <i class="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5"></i>
                    <div>
                        <strong class="font-bold text-rose-800 text-sm block">Request Failed</strong>
                        <p class="mt-0.5 text-rose-700">${err.message || 'Server error occurred'}</p>
                    </div>
                `;
                modalResultBanner.classList.remove('hidden');
            }
        } finally {
            if (modalCloseBtn) modalCloseBtn.classList.remove('hidden');
            if (modalCloseX) modalCloseX.style.display = 'block';
            if (modalHistoryBtn) modalHistoryBtn.classList.remove('hidden');
        }
    }

    if (btnOpenSendModal) {
        btnOpenSendModal.addEventListener('click', handleSendApplication);
    }

    // Modal Close Triggers
    function closeModal() {
        checkpointModal.classList.add('hidden');
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCloseX) modalCloseX.addEventListener('click', closeModal);

    // Mobile Preview scroll
    if (btnMobilePreview) {
        btnMobilePreview.addEventListener('click', () => {
            const previewCard = document.getElementById('preview-container');
            if (previewCard) previewCard.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initial render
    renderPreview();
});
