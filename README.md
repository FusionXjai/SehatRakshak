# SehatRakshak

🏥 **Hospital-Connected Digital Health Assistant**

आपकी सेहत, हमारा वचन - Ensuring patients take medicines on time, follow treatment plans, and stay connected to their doctors after discharge.

## 🎯 Key Features

- 📋 **Digital Prescriptions** - Paperless prescriptions with complete medication tracking
- 🔔 **Automated Reminders** - WhatsApp & IVR medicine reminders
- 🤖 **AI Health Assistant** - Multilingual support for medicine queries and health guidance
- 📊 **Compliance Tracking** - Real-time monitoring of patient adherence
- 👥 **Real-time Updates** - Instant doctor dashboard updates when receptionist adds patients
- 📧 **Welcome Emails** - Automatic role-based welcome emails for new users
- 🔐 **Role-Based Access** - Secure access for Doctors, Receptionists, Care Managers, Admins, and Patients

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Email service configured (optional for welcome emails)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will run on `http://localhost:8080`

### Environment Variables

Create a `.env` file in the project root:

```env
# Email Configuration (for welcome emails)
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# Or use custom API
VITE_EMAIL_API_URL=http://localhost:3000/api/send-email
```

See `EMAIL_SETUP.md` for detailed email configuration instructions.

## 📚 Documentation

- **EMAIL_SETUP.md** - Complete guide for setting up welcome emails with Hostinger SMTP
- **EMAIL_FEATURE_SUMMARY.md** - Technical overview of the email feature
- **Supabase Migrations** - Located in `supabase/migrations/`

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: EmailJS / Hostinger SMTP
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

## 👥 User Roles

- **Doctors**: Manage patients, create prescriptions, track compliance
- **Receptionists**: Register patients, assign doctors, manage records
- **Care Managers**: Monitor AI interactions, track compliance, coordinate care
- **Hospital Admins**: Oversee operations, manage staff, view analytics
- **Super Admins**: Full system access and configuration

## 🔧 Development

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 Recent Updates

### ✨ Real-time Patient Updates
- Doctor dashboard now updates in real-time when receptionist adds a patient
- No page refresh needed
- Toast notifications for new patient assignments

### 📧 Welcome Email System
- Automatic welcome emails for all new user registrations
- Role-specific email content
- Professional HTML templates
- Multiple email service options (EmailJS, Custom API, Edge Functions)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

Copyright © 2025 Sehat Rakshak. All rights reserved.

## 📞 Support

For issues or questions:
- 📧 Email: support@sehatrakshak.com
- 📚 Documentation: See `EMAIL_SETUP.md` for setup guides
