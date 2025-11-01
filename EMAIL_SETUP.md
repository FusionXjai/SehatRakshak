# Welcome Email Setup Guide

This document explains how to set up automatic welcome emails for new users (Doctors, Receptionists, Care Managers, and Hospital Admins) in Sehat Rakshak.

## Features

- ✅ Automatic welcome emails sent when new users register
- ✅ Role-specific email content
- ✅ Professional HTML email templates
- ✅ Multiple email service options
- ✅ Non-blocking email sending (doesn't affect user registration if email fails)

## Setup Options

### Option 1: EmailJS (Recommended - Easiest)

EmailJS is a third-party service that handles SMTP configuration for you. It's free for up to 200 emails/month.

#### Steps:

1. **Sign up at EmailJS**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Create a free account

2. **Add an Email Service**
   - In EmailJS dashboard, go to "Email Services"
   - Click "Add New Service"
   - Choose your email provider:
     - **Gmail** (uses your Google account)
     - **Outlook** (uses your Microsoft account)
     - **Custom SMTP** (for Hostinger)

3. **Configure Hostinger SMTP (if using Custom SMTP)**
   - In EmailJS, select "Custom SMTP"
   - Use these Hostinger settings:
     ```
     Host: smtp.hostinger.com
     Port: 465 (SSL) or 587 (TLS)
     Username: your-email@yourdomain.com
     Password: your-email-password
     ```

4. **Create an Email Template**
   - Go to "Email Templates" in EmailJS dashboard
   - Click "Create New Template"
   - Use this HTML template (works for both welcome and prescription emails):

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="UTF-8">
     <title>{{subject}}</title>
   </head>
   <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
     <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
       <h1 style="color: #1e40af; text-align: center;">🏥 Sehat Rakshak</h1>
       <p style="text-align: center; color: #64748b; font-style: italic;">आपकी सेहत, हमारा वचन</p>
       
       <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
         <h2 style="margin: 0 0 10px 0;">{{subject}}</h2>
       </div>

       <p>Dear {{to_name}},</p>

       <div style="white-space: pre-line;">
         {{message}}
       </div>

       <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #f59e0b;">
         <p style="margin: 5px 0;"><strong>Need Help?</strong></p>
         <p style="margin: 5px 0;">If you have any questions, please contact our support team.</p>
         <p style="margin: 5px 0;">📧 Email: support@sehatrakshak.com</p>
         <p style="margin: 5px 0;">📞 Phone: +91-XXXXXXXXXX</p>
       </div>

       <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
         <p><strong>Sehat Rakshak</strong> - Ensuring patients take medicines on time, follow treatment plans, and stay connected to their doctors after discharge.</p>
         <p>This is an automated email. Please do not reply to this message.</p>
       </div>
     </div>
   </body>
   </html>
   ```

   **Template Variables to add in EmailJS:**
   - `to_email` - Recipient's email address
   - `to_name` - Recipient's name
   - `subject` - Email subject
   - `message` - Main email content (formatted text)
   - `patient_name` (optional) - Patient name
   - `patient_mrn` (optional) - Medical Record Number
   - `doctor_name` (optional) - Doctor's name

5. **Get Your API Keys**
   - In EmailJS dashboard, go to "Account" → "General"
   - Copy your **Public Key**
   - Copy your **Service ID** (from Email Services)
   - Copy your **Template ID** (from Email Templates)

6. **Configure Environment Variables**
   - Create a `.env` file in the project root
   - Add these variables:

   ```env
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   ```

7. **Install EmailJS Package**
   ```bash
   npm install @emailjs/browser
   ```

8. **Restart Your Development Server**
   ```bash
   npm run dev
   ```

---

### Option 2: Custom Backend API

If you prefer to use your own backend or have more control over email sending:

#### Steps:

1. **Create Backend API Endpoint**
   
   Example Node.js endpoint using Nodemailer:
   
   ```javascript
   // backend/routes/email.js
   const express = require('express');
   const router = express.Router();
   const nodemailer = require('nodemailer');

   const transporter = nodemailer.createTransport({
     host: 'smtp.hostinger.com',
     port: 465,
     secure: true,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASSWORD,
     },
   });

   router.post('/send-email', async (req, res) => {
     const { to, subject, html, text } = req.body;

     try {
       await transporter.sendMail({
         from: '"Sehat Rakshak" <noreply@yourdomain.com>',
         to,
         subject,
         html,
         text,
       });

       res.json({ success: true });
     } catch (error) {
       console.error('Email error:', error);
       res.status(500).json({ error: 'Failed to send email' });
     }
   });

   module.exports = router;
   ```

2. **Configure Environment Variables**
   - Add to `.env`:

   ```env
   VITE_EMAIL_API_URL=http://localhost:3000/api/send-email
   ```

3. **Deploy Your Backend**
   - Deploy to Heroku, Vercel, AWS, or any hosting service
   - Update `VITE_EMAIL_API_URL` to your production URL

---

### Option 3: Supabase Edge Functions (Advanced)

For production applications, you can use Supabase Edge Functions to send emails server-side.

#### Steps:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Create Edge Function**
   ```bash
   supabase functions new send-welcome-email
   ```

3. **Implement the Function**
   ```typescript
   // supabase/functions/send-welcome-email/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };

   serve(async (req) => {
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders });
     }

     try {
       const { recipientEmail, emailSubject, emailBody } = await req.json();

       // Use EmailJS API or Nodemailer to send email
       const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send';
       
       const emailjsResponse = await fetch(emailjsUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
           template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
           user_id: Deno.env.get('EMAILJS_PUBLIC_KEY'),
           template_params: {
             recipientEmail,
             emailSubject,
             emailBody,
           },
         }),
       });

       return new Response(
         JSON.stringify({ success: true }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
       );
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
       );
     }
   });
   ```

4. **Deploy the Function**
   ```bash
   supabase functions deploy send-welcome-email
   ```

---

## Testing

1. **Test User Registration**
   - Go to `/signup` in your application
   - Fill out the registration form
   - Select a role (Doctor, Receptionist, Care Manager, etc.)
   - Submit the form

2. **Check for Email**
   - Check the user's email inbox
   - Look in spam folder if not found
   - Check browser console for email sending logs

3. **Verify Console Logs**
   - Open browser DevTools
   - Look for:
     - ✅ Success: `"Welcome email sent successfully via EmailJS to: user@example.com"`
     - ⚠️ Warning: `"Email configuration is missing"`
     - ❌ Error: `"Failed to send welcome email"`

---

## Troubleshooting

### Email Not Being Sent

**Issue:** Console shows "Email configuration is missing"

**Solution:**
- Verify `.env` file exists in project root
- Check environment variables are correctly set
- Restart development server after changing `.env`
- For EmailJS: verify all three IDs are correct

**Issue:** EmailJS API error

**Solution:**
- Check EmailJS account is active
- Verify service and template IDs are correct
- Check email service is connected in EmailJS dashboard
- Try creating a new template

**Issue:** SMTP authentication failed (for Custom Backend)

**Solution:**
- Verify Hostinger email credentials
- Check SMTP settings (port 465 for SSL, 587 for TLS)
- Ensure your IP isn't blocked by Hostinger
- Try using a different email account

### Email Going to Spam

**Solutions:**
- Add SPF records to your domain DNS
- Add DKIM records to your domain DNS
- Use a verified sending domain
- Avoid spam trigger words in email content
- Test with a professional email service like SendGrid

---

## Email Templates by Role

The system automatically generates different welcome messages based on user role:

- **Doctor**: Medical professional features and workflows
- **Receptionist**: Patient management and front desk tools
- **Care Manager**: Patient compliance and coordination features
- **Hospital Admin**: Administrative and oversight capabilities
- **Super Admin**: Full system access and configuration
- **Patient**: Patient-specific health management features

---

## Environment Variables Reference

### EmailJS Configuration
```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

### Custom API Configuration
```env
VITE_EMAIL_API_URL=https://your-api.com/api/send-email
```

### Traditional SMTP Configuration
```env
VITE_SMTP_HOST=smtp.hostinger.com
VITE_SMTP_PORT=465
VITE_SMTP_USER=your-email@yourdomain.com
VITE_SMTP_PASSWORD=your_password
VITE_SMTP_FROM=noreply@yourdomain.com
```

---

## Support

For issues or questions:
- 📧 Email: support@sehatrakshak.com
- 📞 Phone: +91-XXXXXXXXXX
- 📚 Documentation: [Your Docs URL]

---

## License

Sehat Rakshak © 2025. All rights reserved.

