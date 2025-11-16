# Profile Hub - Paperless Management System

A comprehensive multi-company profile management system with document management, role-based access control, and real-time notifications. Built with Next.js, Convex, and shadcn/ui.

## Features

### 🔐 Authentication & Authorization
- **Admin Registration**: First admin self-registers via hidden registration page
- **Auto-Generated Passwords**: Members receive secure 8-digit passwords automatically
- **Member Access**: Members can view their own profiles and documents
- **Secure Login**: Password-based authentication with bcrypt hashing
- **Role-Based Access Control (RBAC)**: Separate dashboards and permissions for admins and members

### 🏢 Multi-Company Support
- Manage multiple companies within a single system
- Each company has its own workspace with dedicated members and documents
- Company CRUD operations (Create, Read, Update, Delete)

### 👥 Member Management
- Add, edit, and delete member profiles
- **Auto-Generated 8-Digit Passwords**: System generates secure passwords for new members
- Comprehensive member information:
  - Personal details (name, email, phone, address, date of birth)
  - Professional details (position, department, date joined)
  - Status tracking (active/dormant)
- Search and filter members by company and status
- Quick status toggle (active/dormant)
- Automatic user account creation when adding members

### 📄 Document Management
- Upload documents for members (images, PDFs, Word documents)
- Document metadata tracking (title, description, file type, size)
- View and download documents
- Organized by member and company

### 🔔 Real-time Notifications
- Notification bell with unread count badge
- Automatic notifications for:
  - New member additions
  - Document uploads
- Mark notifications as read/unread
- Real-time updates using Convex

### 📱 Responsive Design
- Optimized for all screen sizes
- Mobile-first approach with collapsible sidebar
- Touch-friendly interface elements
- Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Convex (real-time database)
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Authentication**: Custom auth with bcrypt
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- A Convex account (free tier available at https://convex.dev)

### Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   
   This will:
   - Create a new Convex project (or link to an existing one)
   - Generate your Convex deployment URL
   - Start the Convex development server
   - Watch for changes to your Convex functions

4. **Configure environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
   ```
   
   Replace `your-deployment-url` with the URL provided by `npx convex dev`

5. **Start the development server** (in a new terminal):
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

6. **Register the first admin**:
   
   Navigate to the hidden admin registration page:
   ```
   http://localhost:3000/register-admin
   ```
   
   **Important Notes**:
   - This page is only accessible for the **first admin registration**
   - After the first admin is created, this route will be automatically disabled
   - The registration page is not linked anywhere in the UI for security
   - Create a strong password (minimum 8 characters)
   - Save your admin credentials securely!

7. **Access the application**:
   
   After registration, you'll be automatically logged in and redirected to the admin dashboard
   
   Or login at: [http://localhost:3000](http://localhost:3000)

## Usage Guide

### First-Time Setup

1. **Register as First Admin**:
   - Navigate to `/register-admin`
   - Fill in your details and create a strong password
   - You'll be automatically logged in

2. **Create Companies**:
   - Navigate to "Companies" in the sidebar
   - Click "Add Company"
   - Fill in company details (name and description)

3. **Add Members**:
   - Navigate to "Members" in the sidebar
   - Click "Add Member"
   - Fill in member details and assign to a company
   - **System automatically generates an 8-digit password**
   - **Copy the password** from the success dialog and share with the member
   - Member can now login with their email and the 8-digit password

4. **Upload Documents**:
   - Navigate to "Documents" in the sidebar
   - Click "Upload Document"
   - Select the member and upload the file
   - Supported formats: images (jpg, png, gif), PDFs, Word documents

### Admin Features

**Dashboard**:
- View real-time statistics (companies, members, documents)
- Active members count
- Recent activities overview

**Companies Management**:
- Create, edit, and delete companies
- View company details and member count

**Members Management**:
- Add new members with complete profile information
- **Auto-generated 8-digit passwords** displayed after creation
- Edit existing member details
- Delete members (with confirmation)
- Search members across all companies
- Filter members by company and status (active/dormant)
- **Quick status toggle** - one-click to switch between active and dormant
- Status overview cards showing total, active, and dormant counts

**Documents Management**:
- Upload documents for any member
- View document details (type, size, upload date)
- Download documents
- Delete documents (with confirmation)

**Notifications**:
- Receive real-time notifications for system activities
- Click the bell icon to view all notifications
- Mark notifications as read

### Member Features

**Personal Dashboard**:
- View profile information
- See account status (active/dormant)
- See document statistics

**Documents**:
- View all personal documents
- Download documents
- See document metadata

**Login**:
- Use email and the 8-digit password provided by admin
- Members cannot self-register

## Password Management

### Auto-Generated Member Passwords

When an admin creates a new member:

1. **System generates** a secure 8-digit random password (e.g., `12345678`)
2. **Password is displayed** in a success dialog with a copy button
3. **Admin copies** the password and shares it securely with the member
4. **Member logs in** using their email and the 8-digit password

**Security Features**:
- Passwords are hashed with bcrypt (10 salt rounds)
- Original password is only shown once during creation
- Cannot be retrieved later (admin would need to create a new member account)

### Admin Passwords

- Admins create their own passwords during registration
- Minimum 8 characters required
- Must be strong and unique

## Admin Management

### Creating Additional Admins

**Option 1: Via Convex Dashboard** (Recommended)

1. Go to your Convex dashboard
2. Navigate to "Functions"
3. Run `admin:createAdmin` with the new admin's details:
   ```json
   {
     "email": "newadmin@example.com",
     "password": "secure-password",
     "firstName": "Jane",
     "lastName": "Admin"
   }
   ```

**Option 2: Via Hidden Registration** (If first admin doesn't exist)

Only works if no admin exists in the system:
- Navigate to `/register-admin`
- Complete the registration form

### Promoting a Member to Admin

If you need to promote an existing member to admin:

1. Go to your Convex dashboard
2. Navigate to "Functions"
3. Run `admin:updateUserRole` with:
   ```json
   {
     "userId": "user-id-here",
     "role": "admin"
   }
   ```

You can find the user ID in the "Data" tab under the "users" table.

## Database Schema

### Users Table
- Authentication and role management
- Fields: email, passwordHash, role, firstName, lastName, companyId (optional)

### Companies Table
- Company profiles
- Fields: name, description, createdAt, createdBy

### Members Table
- Detailed member profiles
- Fields: userId, companyId, firstName, lastName, email, phone, address, dateOfBirth, position, department, dateJoined, status

### Documents Table
- Document storage and metadata
- Fields: memberId, companyId, title, description, fileUrl, fileType, fileSize, uploadedBy, uploadedAt

### Notifications Table
- Real-time notification system
- Fields: userId, title, message, type, read, createdAt, relatedId

## File Upload Configuration

Supported file types:
- Images: JPG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Maximum file size: Configured in your Convex storage settings

## Security Considerations

1. **Password Security**: 
   - Passwords are hashed using bcrypt with 10 salt rounds
   - Never store plain-text passwords
   - Auto-generated passwords are cryptographically random

2. **Admin Registration**: 
   - Hidden registration route (`/register-admin`)
   - Only accessible for first admin
   - Automatically disabled after first registration

3. **Member Passwords**: 
   - 8-digit secure random passwords
   - Displayed only once during creation
   - Admin must securely share with member

4. **Role-Based Access**: 
   - Routes are protected based on user roles
   - Middleware checks authentication on every request

5. **Data Validation**: 
   - All inputs are validated on both client and server
   - Email uniqueness is enforced

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub**

2. **Deploy Convex to production**:
   ```bash
   npx convex deploy
   ```

3. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable:
     ```
     NEXT_PUBLIC_CONVEX_URL=your-production-convex-url
     ```

4. **Register first admin in production**:
   - Navigate to `https://your-app.vercel.app/register-admin`
   - Complete registration (only works for first admin)

## Troubleshooting

### Convex Connection Issues
- Ensure `npx convex dev` is running
- Check that your `.env.local` has the correct Convex URL
- Verify your internet connection

### Registration Issues
- `/register-admin` only works for first admin
- If admin already exists, you'll see a "Registration Closed" message
- Use Convex dashboard to create additional admins

### Login Issues
- Ensure you registered or were created as a user
- Check that the email and password are correct
- Members use 8-digit password provided by admin
- Clear browser cache and localStorage

### Password Issues
- Admin passwords: minimum 8 characters
- Member passwords: auto-generated 8 digits
- Cannot retrieve passwords after creation
- Admin must create new member account if password is lost

### File Upload Issues
- Check file size limits in Convex storage settings
- Ensure the file type is supported
- Verify you have sufficient storage in your Convex plan

## Workflow Summary

### Admin Workflow
1. Register at `/register-admin` (first time only)
2. Login and create companies
3. Add members → System generates 8-digit password
4. Copy password and share securely with member
5. Upload documents for members
6. Manage member status (active/dormant)
7. Receive notifications for activities

### Member Workflow
1. Receive email and 8-digit password from admin
2. Login at main page
3. View personal dashboard and profile
4. View and download personal documents
5. Receive notifications for new documents

## Contributing

This is a production-ready system that can be extended with:
- Email notifications
- Password reset functionality
- Advanced search and filtering
- Bulk operations
- Audit logs
- Data export functionality
- Custom member fields
- Document version control

## License

MIT License - feel free to use this system for your organization!

## Support

For issues or questions:
1. Check the Convex documentation: https://docs.convex.dev
2. Review the Next.js documentation: https://nextjs.org/docs
3. Check your Convex dashboard logs for backend errors
4. Review browser console for frontend errors
