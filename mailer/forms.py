from django import forms

class ComposeEmailForm(forms.Form):
    recruiter_email = forms.EmailField(
        required=True,
        label="Recruiter Email",
        widget=forms.EmailInput(attrs={
            'class': 'form-input w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800 text-sm shadow-sm',
            'placeholder': 'e.g. hr@company.com or recruiter@gmail.com',
            'id': 'id_recruiter_email'
        })
    )
    job_role = forms.CharField(
        max_length=200,
        required=True,
        initial="Junior AI/ML Engineer",
        label="Job Role",
        widget=forms.TextInput(attrs={
            'class': 'form-input w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800 text-sm shadow-sm',
            'placeholder': 'e.g. Junior AI/ML Engineer / Computer Vision Engineer',
            'id': 'id_job_role'
        })
    )
    company_name = forms.CharField(
        max_length=200,
        required=False,
        label="Company Name (Optional)",
        widget=forms.TextInput(attrs={
            'class': 'form-input w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800 text-sm shadow-sm',
            'placeholder': 'Leave blank to use without-company template',
            'id': 'id_company_name'
        })
    )
    subject = forms.CharField(
        max_length=300,
        required=True,
        label="Email Subject",
        widget=forms.TextInput(attrs={
            'class': 'form-input w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800 text-sm shadow-sm',
            'placeholder': 'Application for <job_role> Role – Rishabh Parmar',
            'id': 'id_subject'
        })
    )
    body_text = forms.CharField(
        required=True,
        label="Email Body",
        widget=forms.Textarea(attrs={
            'class': 'form-textarea w-full font-sans text-sm px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm h-80 resize-y leading-relaxed text-gray-800',
            'placeholder': 'Write your email body in plain text...',
            'id': 'id_body_text'
        })
    )
    body_html = forms.CharField(
        required=False,
        widget=forms.HiddenInput(attrs={
            'id': 'id_body_html'
        })
    )

