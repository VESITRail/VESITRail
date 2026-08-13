<div align="center">

<img src="https://vesitrail.vercel.app/opengraph-image.png" alt="VESITRail - Streamlined Railway Concessions" width="512" style="border-radius: 8px; margin-bottom: 20px;">

# VESITRail

**Streamlined Railway Concessions with Real-time Tracking**

_A modern web application for VESIT students to apply and manage railway concessions with ease_

</div>

---

## 🌟 Features

### For Students

- 🎓 **Easy Application Process** - Apply for railway concessions with auto-filled details
- 📊 **Real-time Tracking** - Monitor application status with live updates
- 🏠 **Address Management** - Update home station and address details seamlessly
- 📱 **Progressive Web App** - Install and use offline with native app experience
- 🔔 **Smart Notifications** - Get push notifications about application updates
- 📋 **Application History** - View past applications and their status
- 📄 **Digital Booklets** - Download digital concession booklets

### For Administrators

- 👥 **Student Management** - Review and approve student registrations
- 📝 **Application Processing** - Efficiently handle concession applications
- 📈 **Analytics Dashboard** - Track applications and generate reports
- 🎫 **Booklet Management** - Generate and manage concession booklets
- 📊 **Comprehensive Reports** - Generate detailed analytics and insights
- 🔄 **Address Change Requests** - Process student address change requests

### Technical Features

- ⚡ **Lightning Fast** - Optimized performance with Next.js 15
- 🎨 **Modern UI/UX** - Beautiful interface with Radix UI components
- 🔐 **Secure Authentication** - Google OAuth with Better Auth
- 📱 **Fully Responsive** - Works perfectly on all devices
- 🌙 **Dark Mode Support** - Toggle between light and dark themes
- 🔄 **Real-time Updates** - Live status updates and push notifications
- 📊 **Analytics** - PostHog integration for insights

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
      <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React">
      <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
      <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    </td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
      <img src="https://img.shields.io/badge/Better%20Auth-FF6B6B?logoColor=white" alt="Better Auth">
      <img src="https://img.shields.io/badge/Zod-FF4154?logo=zod&logoColor=white" alt="Zod">
    </td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
    </td>
  </tr>
  <tr>
    <td><strong>UI Components</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Radix%20UI-161618?logo=radixui&logoColor=white" alt="Radix UI">
      <img src="https://img.shields.io/badge/Lucide-F56565?logo=lucide&logoColor=white" alt="Lucide Icons">
      <img src="https://img.shields.io/badge/React%20Hook%20Form-EC5990?logo=reacthookform&logoColor=white" alt="React Hook Form">
    </td>
  </tr>
  <tr>
    <td><strong>File Upload & PDF</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary">
      <img src="https://img.shields.io/badge/jsPDF-FF6B6B?logoColor=white" alt="jsPDF">
    </td>
  </tr>
  <tr>
    <td><strong>Notifications</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black" alt="Firebase">
    </td>
  </tr>
  <tr>
    <td><strong>Testing</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white" alt="Playwright">
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

**Prerequisites:**

- PostgreSQL database
- Node.js 18+ and pnpm
- Google OAuth credentials
- Cloudflare R2 bucket (for file storage)
- Firebase project (for push notifications)

**Installation:**

1. **Clone the repository**

   ```bash
   git clone https://github.com/VESITRail/VESITRail.git
   cd VESITRail
   ```

2. **Install dependencies**

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:

   ```env
   # Site Configuration
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"

   # BetterAuth
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="your-32-character-secret-key"

   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/vesitrail"

   # Google OAuth
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Firebase (Push Notifications)
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   # ... other Firebase config
   ```

4. **Database Setup**

   ```bash
   pnpm exec prisma generate
   pnpm exec prisma db push
   ```

5. **Run the development server**

   ```bash
   pnpm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Documentation

For detailed architectural information, system design, and technical specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups
│   │   └── dashboard/     # Dashboard routes
│   ├── globals.css        # Global styles
│   └── manifest.ts        # PWA manifest
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── onboarding/       # Onboarding flow
│   ├── student/          # Student-specific components
│   └── admin/            # Admin-specific components
├── lib/                   # Utility libraries
├── actions/              # Server actions
├── hooks/                # Custom React hooks
├── config/               # Configuration files
└── generated/            # Generated types and schemas
```

### Key Features Implementation

#### 🎓 Student Onboarding

Students complete a multi-step onboarding process:

- Personal information
- Academic details
- Travel preferences
- Document verification
- Profile review

#### 📝 Concession Application

- Auto-filled forms based on student profile
- Support for new and renewal applications
- Real-time status tracking
- Document upload with Cloudflare R2

#### 🏠 Address Change Management

- Station-based address updates
- Admin approval workflow
- Document verification requirements

#### 👨‍💼 Admin Dashboard

- Student registration approval
- Application processing
- Booklet management
- Analytics and reporting

#### 🔔 Push Notifications

- Firebase Cloud Messaging integration
- Real-time application status updates
- Cross-platform notification support
- Customizable notification preferences

---

## 🎨 Design System

VESITRail uses a comprehensive design system built with:

- **Color Palette**: Custom CSS variables for consistent theming
- **Typography**: Inter font family with responsive scaling
- **Components**: shadcn/ui with custom variants
- **Icons**: Lucide React for consistent iconography
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Theme Support

```tsx
// Light and dark mode support
const { theme, setTheme } = useTheme();

// Toggle theme
<Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun /> : <Moon />}</Button>;
```

---

## 📱 Progressive Web App

VESITRail is a fully-featured PWA with:

- 📱 **Installable** - Add to home screen on mobile devices
- ⚡ **Fast Loading** - Optimized performance and caching
- 🔄 **Offline Support** - Basic functionality works offline
- 📸 **App Screenshots** - Rich install prompts with screenshots
- 🎯 **Native Feel** - App-like experience across platforms
- 🔔 **Push Notifications** - Firebase-powered notifications

---

## 🔐 Security Features

- **Authentication**: Secure Google OAuth integration
- **Authorization**: Role-based access control (Student/Admin)
- **Data Validation**: Comprehensive input validation with Zod
- **File Upload**: Secure document upload with Cloudflare R2
- **Email Verification**: @ves.ac.in domain restriction
- **CSRF Protection**: Built-in security measures
- **Database Security**: PostgreSQL with SSL connections

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** automatically on push to main branch

### Manual Deployment

```bash
# Build the application
pnpm run build

# Start production server
pnpm start
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Custom configuration for Next.js
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Semantic commit messages

### Testing

VESITRail uses **Playwright** for end-to-end testing to ensure application reliability across browsers.

```bash
# Install Playwright browsers (first time only)
pnpm run test:e2e:install

# Run E2E tests
pnpm run test:e2e

# Run tests in UI mode (interactive)
pnpm exec playwright test --ui

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed
```

**Test Configuration:**

- Test files: Place E2E tests in `tests/` directory with `.spec.ts` extension
- Browsers: Tests run on Chromium, Firefox, and WebKit
- CI/CD: Automatically runs on pull requests
- Reports: HTML test reports generated after test runs

For more on writing tests, see the [Playwright documentation](https://playwright.dev).

---

## 📜 License & Policies

This project is released under the **VESITRail Community License v1.0** (custom, source-available, restricted deployment). Only **Vivekanand Education Society's Institute of Technology (VESIT)** is authorized to deploy operational instances. External contributors are welcome to submit improvements under the same license.

- License: See [`LICENSE`](LICENSE)
- Contributing: See [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Code of Conduct: See [`CODE_OF_CONDUCT.md`](./.github/CODE_OF_CONDUCT.md)
- Security Policy: See [`SECURITY.md`](./.github/SECURITY.md)

If you need a different license arrangement or deployment permission, open a discussion or contact the maintainer privately.
