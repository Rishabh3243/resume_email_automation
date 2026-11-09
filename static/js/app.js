/**
 * Resume Mailer Automation - Client Logic
 * Handles live preview, instant template reset, email-validator integration,
 * custom resume file upload vs default resume selection, and checkpoint modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // CSRF Helper
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

    // Form Inputs
    const recruiterEmailInput = document.getElementById('id_recruiter_email');
    const jobRoleInput = document.getElementById('id_job_role');
    const companyNameInput = document.getElementById('id_company_name');
    const subjectInput = document.getElementById('id_subject');
    const bodyTextInput = document.getElementById('id_body_text');
    const bodyHtmlInput = document.getElementById('id_body_html');
    const resumeChoiceInput = document.getElementById('id_resume_choice');
    const customResumeInput = document.getElementById('id_custom_resume');
    const bodyCharCount = document.getElementById('body-char-count');

    // UI Buttons
    const btnUpdateLiveEmail = document.getElementById('btn-update-live-email');
    const updateLiveIcon = document.getElementById('update-live-icon');
    const updateLiveBtnText = document.getElementById('update-live-btn-text');
    const btnValidateQuick = document.getElementById('btn-validate-email-quick');
    const btnOpenSendModal = document.getElementById('btn-open-send-modal');
    const btnMobilePreview = document.getElementById('btn-mobile-preview-toggle');

    // Preview Elements
    const previewCard = document.getElementById('preview-card');
    const previewFrame = document.getElementById('preview-frame');
    const previewTo = document.getElementById('preview-to');
    const previewSubject = document.getElementById('preview-subject');
    const previewAttachName = document.getElementById('preview-attach-name');
    const previewAttachIcon = document.getElementById('preview-attach-icon');
    const templateHint = document.getElementById('template-hint-text');
    const emailValidationBadge = document.getElementById('email-validation-badge');

    // Resume Option Switcher Elements
    const tabResumeDefault = document.getElementById('tab-resume-default');
    const tabResumeUpload = document.getElementById('tab-resume-upload');
    const viewResumeDefault = document.getElementById('view-resume-default');
    const viewResumeUpload = document.getElementById('view-resume-upload');
    const resumeStatusBadge = document.getElementById('resume-status-badge');
    const defaultResumeName = document.getElementById('default-resume-name');
    const dropzone = document.getElementById('dropzone');
    const dropzonePrompt = document.getElementById('dropzone-prompt');
    const dropzoneFileInfo = document.getElementById('dropzone-file-info');
    const customFileName = document.getElementById('custom-file-name');
    const customFileSize = document.getElementById('custom-file-size');
    const customFileIcon = document.getElementById('custom-file-icon');
    const btnRemoveCustomResume = document.getElementById('btn-remove-custom-resume');
    const topResumeLabel = document.getElementById('top-resume-label');

    // Modal Elements
    const checkpointModal = document.getElementById('checkpoint-modal');
    const modalCloseX = document.getElementById('modal-close-x');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalResultBanner = document.getElementById('modal-result-banner');

    // Default Resume Name
    const defaultFilename = (defaultResumeName ? defaultResumeName.textContent.trim() : 'Rishabh_Parmar_Resume.pdf') || 'Rishabh_Parmar_Resume.pdf';

    // State Tracking
    let currentResumeChoice = 'default'; // 'default' | 'upload'
    let selectedCustomFile = null;

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper: Format file size
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // Default Template Text Builder (Instant Client-Side Fallback)
    function buildDefaultPlainText(role, company) {
        const roleClean = role || 'Junior AI/ML Engineer';
        if (company) {
            return `Respected HR Team,

I’m reaching out to express my interest in the ${roleClean} position at ${company}. The role closely aligns with my experience and interests in Computer Vision, Edge AI, and Generative AI.

I have been working as a Junior AI/ML Engineer with hands-on experience in developing and deploying end-to-end AI solutions across both Edge Computer Vision and Applied Generative AI. My core work involves designing hardware-aware deep learning pipelines using technologies like Python, PyTorch, YOLO, TensorRT, and ONNX Runtime for embedded platforms including NVIDIA Jetson, NXP, and Raspberry Pi. Alongside my computer vision background, I also actively build Retrieval-Augmented Generation (RAG) architectures leveraging LLMs, LangChain, and ChromaDB to solve complex real-world problems.

I am passionate about bridging the gap between advanced AI models and practical hardware constraints to deliver highly optimized, real-time applications. I believe my comprehensive technical stack, hands-on industry experience, and strong problem-solving abilities would allow me to make an immediate and meaningful impact on the innovative projects at ${company}.

I have attached my resume for your consideration. I would sincerely appreciate the opportunity to discuss how my experience aligns with your team's requirements. Thank you for your time, and I look forward to hearing from you.

---
**Rishabh Bharatbhai Parmar**

**Email:** rishabhpar7@gmail.com
**Phone:** +91 9998217585
**LinkedIn:** https://www.linkedin.com/in/rishabh-parmar-650541200`;
        } else {
            return `Respected HR Team,

I’m reaching out to express my interest in the ${roleClean} position. The role closely aligns with my experience and interests in Computer Vision, Edge AI, and Generative AI.

I have been working as a Junior AI/ML Engineer with hands-on experience in developing and deploying end-to-end AI solutions across both Edge Computer Vision and Applied Generative AI. My core work involves designing hardware-aware deep learning pipelines using technologies like Python, PyTorch, YOLO, TensorRT, and ONNX Runtime for embedded platforms including NVIDIA Jetson, NXP, and Raspberry Pi. Alongside my computer vision background, I also actively build Retrieval-Augmented Generation (RAG) architectures leveraging LLMs, LangChain, and ChromaDB to solve complex real-world problems.

I am passionate about bridging the gap between advanced AI models and practical hardware constraints to deliver highly optimized, real-time applications. I believe my comprehensive technical stack, hands-on industry experience, and strong problem-solving abilities would allow me to make an immediate and meaningful impact on the innovative projects.

I have attached my resume for your consideration. I would sincerely appreciate the opportunity to discuss how my experience aligns with your team's requirements. Thank you for your time, and I look forward to hearing from you.

---
**Rishabh Bharatbhai Parmar**

**Email:** rishabhpar7@gmail.com
**Phone:** +91 9998217585
**LinkedIn:** https://www.linkedin.com/in/rishabh-parmar-650541200`;
        }
    }

    // Helper: Convert plain text into clean, modern, left-aligned HTML email
    function convertPlainTextToHtml(text, companyName) {
        if (!text || !text.trim()) {
            return '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #64748b; padding: 24px;">(No email content written yet)</body></html>';
        }

        const trimmed = text.trim();
        if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
            return trimmed;
        }

        const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const rawParagraphs = normalized.split(/\n{2,}/);

        const formattedParagraphs = [];
        rawParagraphs.forEach(p => {
            let pClean = p.trim();
            if (!pClean) return;

            // Standalone horizontal rule
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

            // Markdown bolding: **word** -> <strong>word</strong>
            safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Bold company name if present and not already bolded
            if (companyName && companyName.trim()) {
                const cEscaped = escapeHtml(companyName.trim());
                const escapedRegex = cEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const compRegex = new RegExp(`(?<!<strong>)\\b${escapedRegex}\\b(?!<\\/strong>)`, 'gi');
                safe = safe.replace(compRegex, `<strong>${cEscaped}</strong>`);
            }

            // Bold key technical domains
            const skillsRegex = /(?<!<strong>)(Computer Vision,\s*Edge AI,?\s*and\s*Generative AI)(?!<\/strong>)/gi;
            safe = safe.replace(skillsRegex, '<strong>$1</strong>');

            // Bold name and contact labels
            const labelsRegex = /(?<!<strong>)(Rishabh Bharatbhai Parmar|Email:|Phone:|LinkedIn:)(?!<\/strong>)/g;
            safe = safe.replace(labelsRegex, '<strong>$1</strong>');

            // Linkify URLs
            safe = safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');

            // Linkify email addresses
            safe = safe.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1" style="color: #2563eb; text-decoration: underline;">$1</a>');

            // Line breaks
            safe = safe.replace(/\n/g, '<br>');

            if (hasLeadingHr) {
                formattedParagraphs.push('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">');
            }

            formattedParagraphs.push(`<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.65; color: #1e293b; text-align: left;">${safe}</p>`);
        });

        const bodyInner = formattedParagraphs.join('\n        ');
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #1e293b; background-color: #ffffff; text-align: left;">
    <div style="max-width: 680px; margin: 0 auto; text-align: left;">
        ${bodyInner}
    </div>
</body>
</html>`;
    }

    // 1. Live Email Preview Renderer
    function renderPreview() {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : `Application for ${role} Role – Rishabh Parmar`;
        const bodyText = bodyTextInput ? bodyTextInput.value : '';

        // Character count
        if (bodyCharCount) {
            bodyCharCount.textContent = `${bodyText.length} characters`;
        }

        // Update To & Subject in preview header
        if (previewTo) {
            previewTo.textContent = email ? email : '(recruiter email will appear here)';
        }
        if (previewSubject) {
            previewSubject.textContent = subject || `Application for ${role} Role – Rishabh Parmar`;
        }

        // Update Attachment badge in preview header
        if (previewAttachName && previewAttachIcon) {
            if (currentResumeChoice === 'upload' && selectedCustomFile) {
                previewAttachName.textContent = selectedCustomFile.name;
                const isDocx = selectedCustomFile.name.toLowerCase().endsWith('.docx') || selectedCustomFile.name.toLowerCase().endsWith('.doc');
                previewAttachIcon.className = isDocx ? 'fa-solid fa-file-word text-blue-600' : 'fa-solid fa-file-pdf text-red-500';
            } else if (currentResumeChoice === 'upload') {
                previewAttachName.textContent = '(Upload a resume file)';
                previewAttachIcon.className = 'fa-solid fa-cloud-arrow-up text-amber-500';
            } else {
                previewAttachName.textContent = defaultFilename;
                previewAttachIcon.className = 'fa-solid fa-file-pdf text-red-500';
            }
        }

        // Generate HTML
        const generatedHtml = convertPlainTextToHtml(bodyText, company);
        if (bodyHtmlInput) {
            bodyHtmlInput.value = generatedHtml;
        }

        // Render in sandboxed iframe using srcdoc for instant reliable rendering
        if (previewFrame) {
            previewFrame.srcdoc = generatedHtml;
        }

        // Update Template Hint
        if (templateHint) {
            if (company) {
                templateHint.innerHTML = `Company specified (<strong>${escapeHtml(company)}</strong>): Using <strong>Template A</strong> (personalized company mention).`;
            } else {
                templateHint.innerHTML = `Company name omitted: Using <strong>Template B</strong> (direct greeting without company mention).`;
            }
        }
    }

    // Debounced Preview for Smooth Typing
    let previewDebounceTimer = null;
    function debouncedPreview() {
        clearTimeout(previewDebounceTimer);
        previewDebounceTimer = setTimeout(() => {
            renderPreview();
        }, 150);
    }

    // Handle Role Changes: update subject line gracefully
    function handleRoleChange() {
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        if (subjectInput) {
            // Only update default subject if not heavily customized
            const currentSubj = subjectInput.value;
            if (!currentSubj || currentSubj.startsWith('Application for ')) {
                subjectInput.value = `Application for ${role} Role – Rishabh Parmar`;
            }
        }
        debouncedPreview();
    }

    // Attach Input Event Listeners
    if (bodyTextInput) bodyTextInput.addEventListener('input', debouncedPreview);
    if (jobRoleInput) jobRoleInput.addEventListener('input', handleRoleChange);
    if (companyNameInput) companyNameInput.addEventListener('input', debouncedPreview);
    if (subjectInput) subjectInput.addEventListener('input', debouncedPreview);
    if (recruiterEmailInput) recruiterEmailInput.addEventListener('input', debouncedPreview);

    // 2. Update Live Email Template Button
    async function updateLiveEmailTemplate() {
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';

        try {
            if (btnUpdateLiveEmail) {
                btnUpdateLiveEmail.disabled = true;
                if (updateLiveIcon) updateLiveIcon.className = 'fa-solid fa-spinner spinner-icon text-blue-600';
                if (updateLiveBtnText) updateLiveBtnText.textContent = 'Updating...';
            }

            // Attempt server template fetch
            const response = await fetch(`/api/get-template/?job_role=${encodeURIComponent(role)}&company_name=${encodeURIComponent(company)}`);
            const data = await response.json();

            if (data.success) {
                if (subjectInput) subjectInput.value = data.subject;
                if (bodyTextInput) bodyTextInput.value = data.body_text;
                if (bodyHtmlInput) bodyHtmlInput.value = data.body_html;
            } else {
                // Client-side fallback
                if (subjectInput) subjectInput.value = `Application for ${role} Role – Rishabh Parmar`;
                if (bodyTextInput) bodyTextInput.value = buildDefaultPlainText(role, company);
            }
        } catch (err) {
            console.warn('Server template fetch failed, using instant client fallback:', err);
            // Bulletproof instant client fallback
            if (subjectInput) subjectInput.value = `Application for ${role} Role – Rishabh Parmar`;
            if (bodyTextInput) bodyTextInput.value = buildDefaultPlainText(role, company);
        } finally {
            renderPreview();
            if (btnUpdateLiveEmail) {
                if (updateLiveIcon) updateLiveIcon.className = 'fa-solid fa-check text-emerald-600';
                if (updateLiveBtnText) updateLiveBtnText.textContent = 'Live Email Updated!';
                setTimeout(() => {
                    btnUpdateLiveEmail.disabled = false;
                    if (updateLiveIcon) updateLiveIcon.className = 'fa-solid fa-arrows-rotate text-slate-500';
                    if (updateLiveBtnText) updateLiveBtnText.textContent = 'Update Live Email';
                }, 1200);
            }
        }
    }

    if (btnUpdateLiveEmail) {
        btnUpdateLiveEmail.addEventListener('click', updateLiveEmailTemplate);
    }

    // 3. Resume Selection Logic: Default vs Upload Custom
    function setResumeMode(mode) {
        currentResumeChoice = mode;
        if (resumeChoiceInput) {
            resumeChoiceInput.value = mode;
        }

        if (mode === 'default') {
            // Tab styling
            if (tabResumeDefault) {
                tabResumeDefault.className = 'py-2 px-3 rounded-md transition text-center flex items-center justify-center gap-1.5 bg-white text-blue-700 shadow-xs font-semibold';
            }
            if (tabResumeUpload) {
                tabResumeUpload.className = 'py-2 px-3 rounded-md transition text-center flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium';
            }

            // View toggle
            if (viewResumeDefault) viewResumeDefault.classList.remove('hidden');
            if (viewResumeUpload) viewResumeUpload.classList.add('hidden');

            // Badge
            if (resumeStatusBadge) {
                resumeStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800';
                resumeStatusBadge.textContent = 'Default Resume Active';
            }
            if (topResumeLabel) {
                topResumeLabel.textContent = defaultFilename;
            }
        } else {
            // Upload mode tab styling
            if (tabResumeUpload) {
                tabResumeUpload.className = 'py-2 px-3 rounded-md transition text-center flex items-center justify-center gap-1.5 bg-white text-blue-700 shadow-xs font-semibold';
            }
            if (tabResumeDefault) {
                tabResumeDefault.className = 'py-2 px-3 rounded-md transition text-center flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium';
            }

            // View toggle
            if (viewResumeDefault) viewResumeDefault.classList.add('hidden');
            if (viewResumeUpload) viewResumeUpload.classList.remove('hidden');

            // Badge
            if (resumeStatusBadge) {
                if (selectedCustomFile) {
                    resumeStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800';
                    resumeStatusBadge.textContent = 'Custom Resume Ready';
                } else {
                    resumeStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800';
                    resumeStatusBadge.textContent = 'Select File to Upload';
                }
            }
            if (topResumeLabel) {
                topResumeLabel.textContent = selectedCustomFile ? selectedCustomFile.name : '(Custom file)';
            }
        }

        renderPreview();
    }

    if (tabResumeDefault) {
        tabResumeDefault.addEventListener('click', () => setResumeMode('default'));
    }
    if (tabResumeUpload) {
        tabResumeUpload.addEventListener('click', () => setResumeMode('upload'));
    }

    // Custom Resume File Selection Handler
    function handleCustomFile(file) {
        if (!file) return;

        // Check size (< 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File exceeds 10MB limit. Please choose a smaller file.');
            return;
        }

        selectedCustomFile = file;

        if (customFileName) customFileName.textContent = file.name;
        if (customFileSize) customFileSize.textContent = formatBytes(file.size);

        if (customFileIcon) {
            const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');
            customFileIcon.className = isDocx ? 'fa-solid fa-file-word text-blue-600' : 'fa-solid fa-file-pdf text-red-500';
        }

        if (dropzonePrompt) dropzonePrompt.classList.add('hidden');
        if (dropzoneFileInfo) dropzoneFileInfo.classList.remove('hidden');

        if (resumeStatusBadge) {
            resumeStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800';
            resumeStatusBadge.textContent = 'Custom Resume Ready';
        }
        if (topResumeLabel) {
            topResumeLabel.textContent = file.name;
        }

        renderPreview();
    }

    // Dropzone interactions
    if (dropzone && customResumeInput) {
        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('#btn-remove-custom-resume')) return;
            customResumeInput.click();
        });

        customResumeInput.addEventListener('change', () => {
            if (customResumeInput.files && customResumeInput.files[0]) {
                handleCustomFile(customResumeInput.files[0]);
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dropzone-dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dropzone-dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dropzone-dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                customResumeInput.files = e.dataTransfer.files;
                handleCustomFile(file);
            }
        });
    }

    // Remove custom file
    if (btnRemoveCustomResume) {
        btnRemoveCustomResume.addEventListener('click', (e) => {
            e.stopPropagation();
            if (customResumeInput) customResumeInput.value = '';
            selectedCustomFile = null;
            if (dropzonePrompt) dropzonePrompt.classList.remove('hidden');
            if (dropzoneFileInfo) dropzoneFileInfo.classList.add('hidden');
            setResumeMode('default');
        });
    }

    // 4. Email Validation via email-validator API
    async function validateEmail(showSuccessState = true) {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        if (!email) {
            if (emailValidationBadge) {
                emailValidationBadge.className = 'text-xs text-rose-500 font-medium flex items-center gap-1';
                emailValidationBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Recruiter email is required';
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
                    emailValidationBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Valid Recruiter (${data.normalized})`;
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

    // 5. Modal and Checkpoints UI Management
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
            cp.className = 'checkpoint-item checkpoint-running flex items-start space-x-3.5 p-3 rounded-xl border border-blue-400 bg-blue-50/60 shadow-xs';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-spinner spinner-icon text-blue-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-blue-600';
                statusSpan.textContent = 'Processing...';
            }
        } else if (status === 'passed') {
            cp.className = 'checkpoint-item checkpoint-passed flex items-start space-x-3.5 p-3 rounded-xl border border-emerald-400 bg-emerald-50/60 shadow-xs';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-emerald-700';
                statusSpan.textContent = 'Done ✓';
            }
        } else if (status === 'failed') {
            cp.className = 'checkpoint-item checkpoint-failed flex items-start space-x-3.5 p-3 rounded-xl border border-rose-400 bg-rose-50/70 shadow-xs';
            if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-600 text-base"></i>';
            if (statusSpan) {
                statusSpan.className = 'cp-status text-xs font-mono font-bold text-rose-700';
                statusSpan.textContent = 'Failed ✗';
            }
        }
    }

    // 6. Send Email with Animated Checkpoints Modal
    async function handleSendApplication() {
        const email = recruiterEmailInput ? recruiterEmailInput.value.trim() : '';
        const role = jobRoleInput ? (jobRoleInput.value.trim() || 'Junior AI/ML Engineer') : 'Junior AI/ML Engineer';
        const company = companyNameInput ? companyNameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : `Application for ${role} Role – Rishabh Parmar`;
        const bodyText = bodyTextInput ? bodyTextInput.value.trim() : '';
        let bodyHtml = bodyHtmlInput ? bodyHtmlInput.value.trim() : '';

        if (!email) {
            alert('Please enter a recruiter email address.');
            if (recruiterEmailInput) recruiterEmailInput.focus();
            return;
        }

        if (currentResumeChoice === 'upload' && !selectedCustomFile) {
            alert('You selected "Upload Custom Resume", but haven\'t chosen a file yet. Please upload a file or click "Use Default Resume".');
            return;
        }

        if (!bodyHtml && bodyText) {
            bodyHtml = convertPlainTextToHtml(bodyText, company);
        }

        // Open Modal
        resetCheckpoints();
        checkpointModal.classList.remove('hidden');

        // Step 1: Pre-flight UI indicator
        updateCheckpointUI(1, 'running', `Verifying recruiter email (${email}) with email-validator...`);

        // Prepare FormData to handle both text fields and binary file uploads
        const formData = new FormData();
        formData.append('recruiter_email', email);
        formData.append('job_role', role);
        formData.append('company_name', company);
        formData.append('subject', subject);
        formData.append('body_text', bodyText);
        formData.append('body_html', bodyHtml);
        formData.append('resume_choice', currentResumeChoice);

        if (currentResumeChoice === 'upload' && selectedCustomFile) {
            formData.append('custom_resume', selectedCustomFile);
        }

        try {
            // Visual timing hints for user experience
            setTimeout(() => {
                const cp1 = document.getElementById('cp-1');
                if (cp1 && cp1.classList.contains('checkpoint-running')) {
                    const resumeTarget = (currentResumeChoice === 'upload' && selectedCustomFile) ? selectedCustomFile.name : defaultFilename;
                    updateCheckpointUI(2, 'running', `Verifying resume attachment (${resumeTarget})...`);
                }
            }, 600);

            setTimeout(() => {
                const cp2 = document.getElementById('cp-2');
                if (cp2 && cp2.classList.contains('checkpoint-running')) {
                    updateCheckpointUI(3, 'running', 'Compiling MIME multipart structure & resume binary...');
                }
            }, 1100);

            // Execute POST to Backend
            const response = await fetch('/api/send-email/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken
                },
                body: formData
            });

            const result = await response.json();

            // Apply all checkpoint outcomes reported from backend
            if (result.checkpoints && result.checkpoints.length > 0) {
                result.checkpoints.forEach(cp => {
                    const stepNum = Math.min(cp.step, 5);
                    updateCheckpointUI(stepNum, cp.status, cp.detail);
                });
            }

            if (result.success) {
                for (let i = 1; i <= 5; i++) {
                    updateCheckpointUI(i, 'passed');
                }

                if (modalResultBanner) {
                    modalResultBanner.className = 'rounded-xl p-4 text-xs font-medium border bg-emerald-50 border-emerald-300 text-emerald-900 flex items-start gap-3';
                    modalResultBanner.innerHTML = `
                        <i class="fa-solid fa-circle-check text-emerald-600 text-lg mt-0.5"></i>
                        <div>
                            <strong class="font-bold text-emerald-800 text-sm block">Application Successfully Dispatched!</strong>
                            <p class="mt-0.5 text-emerald-700">Delivered to <strong>${result.normalized_email || email}</strong> with attached resume (<strong>${result.attachment_filename || defaultFilename}</strong>).</p>
                        </div>
                    `;
                    modalResultBanner.classList.remove('hidden');
                }
            } else {
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
        }
    }

    if (btnOpenSendModal) {
        btnOpenSendModal.addEventListener('click', handleSendApplication);
    }

    // Modal Close
    function closeModal() {
        checkpointModal.classList.add('hidden');
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCloseX) modalCloseX.addEventListener('click', closeModal);

    // Mobile Preview Scroll
    if (btnMobilePreview) {
        btnMobilePreview.addEventListener('click', () => {
            const previewSection = document.getElementById('preview-container');
            if (previewSection) previewSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initial Preview Rendering
    renderPreview();
});
