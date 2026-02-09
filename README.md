# 🚀 WorkflowHub

**WorkflowHub** is a comprehensive, open-source workflow automation and form building platform. It empowers teams to design complex business processes, build dynamic forms with ease, and manage approval cycles in a sleek, modern interface.

---

## ✨ Features

### 🛠️ Form Builder (Pro Max)
- **Drag & Drop Interface**: Rearrange form fields with a modern, fluid DnD experience powered by `@dnd-kit`.
- **Flexible Grid Layout**: Configure fields to span 50% (half) or 100% (full) width of the container.
- **Rich Field Types**: Support for Text, Numbers, Dates, Select Menus, Radio Groups, Checkboxes, People Pickers, and File Attachments.
- **On-the-fly Migration**: Seamlessly handles and migrates legacy form data structures.

### ⛓️ Workflow Designer
- **Multi-stage Processes**: Define sequential or parallel approval stages.
- **Stage-specific Rules**: Configure field-level visibility (Show/Hide), editability (Read-only/Editable), and requirements (Mandatory/Optional) based on the current workflow stage.
- **Dynamic Approver Resolution**: Resolve approvers based on user roles, departments, or specific individuals.

### 👤 User Portal
- **Modern Experience**: A premium, responsive interface built with **NextUI** and **Tailwind CSS**.
- **Process Visualization**: Real-time preview of approval chains and simulated approver paths.
- **Task Management**: Sleek dashboard for tracking submitted requests and pending actions.
- **Audit Trails**: Full transparency with detailed history logs for every action taken.

---

## 🏗️ Architecture

The project is split into two specialized applications sharing a common Supabase backend:

| Application | Role | Tech Stack |
| :--- | :--- | :--- |
| **Workflow-Hub** | Admin/System Management | React, Vite, Material UI (MUI), Zustand |
| **User Portal** | End-User Experience | React, Vite, NextUI, Tailwind CSS, Zustand |

- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State**: Zustand (Local) & React Hook Form (Forms)
- **Validation**: Zod (Schema-based validation)
- **Layout**: CSS Grid & Flexbox

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HuuLongNguyen/WorkflowHub.git
   cd WorkflowHub
   ```

2. **Setup Admin Portal (`Workflow-Hub`)**:
   ```bash
   cd Workflow-Hub
   npm install
   cp .env.example .env # Add your Supabase credentials
   npm run dev
   ```

3. **Setup User Portal (`user-portal`)**:
   ```bash
   cd ../user-portal
   npm install
   cp .env.example .env # Add your Supabase credentials
   npm run dev
   ```

### Database Setup
Run the SQL scripts provided in `Workflow-Hub/supabase_schema.sql` and `Workflow-Hub/seed_data.sql` in your Supabase SQL Editor to initialize the tables and seed initial directory data.

---

## 🔧 Environment Variables

Both projects require the following variables in their respective `.env` files:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 📸 Screenshots

> **Note**: Add screenshots of your Form Builder, Workflow Designer, and User Portal to showcase the UI.

### Form Builder
![Form Builder](./docs/screenshots/form-builder.png)

### User Portal
![User Portal](./docs/screenshots/request-portal.png)

---

## 🗺️ Roadmap
- [x] **Conditional Branching in Workflows** ✅ (Implemented!)
- [ ] Parallel Approval Stages
- [ ] Email Notifications via Resend/Postmark
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics Dashboard
- [ ] Webhook Integration for External Systems

---

## 📄 License
MIT © [HuuLongNguyen](https://github.com/HuuLongNguyen)
