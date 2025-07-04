
## JuaLearn – Empowering Secondary Education in South Sudan

JuaLearn is an AI-powered e-learning platform designed to provide high-quality educational resources for secondary school students and teachers in South Sudan. The platform offers curriculum-aligned courses, interactive lessons, assessments, and progress tracking, all through a modern, responsive web application.


<!-- ## 🚀 Live Demo

[**View Live App Here**](https://your-live-demo-link.com) -->


## 📂 Repository

[**GitHub Repository**](https://github.com/Nyiriek/Jualrn.git)


## 🖥️ Features

- **Landing Page**: Welcomes users and provides app overview.
- **Role-Based Login**: Separate login for students and teachers.
- **Responsive Dashboard**: Custom dashboard for both students and teachers.
- **Subject Explorer**: View available subjects and courses.
- **Assignments & Progress Tracking**: For students.
- **Teacher Tools**: Manage courses, gradebooks, and reports.
- **Profile & Notifications**: Update profile, view notifications.
- **Theme Toggle**: Switch between light and dark mode.
- **Mobile-First Design**: Fully responsive for all screen sizes.

---

## 🎨 Design

- **Figma Mockups**: [View on Figma](https://www.figma.com/design/k6Yv3nJTRARvB16VVmGkW2/JuaLearn?t=PWEJQoeGFeT8JZzf-1)

## UML Diagrams
- **UseCase Diaagram**:
    ![Usecase diagram](../JuaLearn/src/assets/use-case.png)

- **Entity Relational Diagram**:
    ![ER Diadgram](../JuaLearn/src/assets/ERD.png)

- **Interface Screenshots**:  
  ![Landing Page](./screenshots/landing.png)
  ![Student Dashboard](./screenshots/studentdashboard.png)
  ![Mobile View](./screenshots/mobilemode.png)



## Tech Stack

- **Frontend**: React, TypeScript, MUI (Material-UI), CSS Modules
- **Backend**: Django REST Framework, Python
- **Database**: PostgreSQL
- **Deployment**: Vercel (frontend), Render (backend)

---

## Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/Nyiriek/Jualrn.git
cd jualearn
````

### 2. Frontend Setup

```bash
cd JuaLearn
npm install
npm run dev        # or npm start
```

### 3. Backend Setup

```bash
cd ../jualearn_backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 4. Environment Variables

Create a `.env` file in the backend directory with:

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:password@localhost:5432/jualearn
```

---

## Project Structure

```
jualearn/
  frontend/
    src/
      pages/
      components/
      context/
      styles/
  backend/
    jualearn/
    users/
    assignments/
    subjects/
    ...
  screenshots/
  README.md
```

---

## Sample Code

### Frontend: Responsive Navigation (React + CSS)

```jsx
// src/pages/LandingPage.tsx
<header className="landing-header">
  <div className="landing-logo">...</div>
  <nav className="landing-nav">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    ...
  </nav>
  <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
</header>
```

```css
@media (max-width: 650px) {
  .landing-header, .landing-hero {
    padding: 1.1rem 1rem;
  }
  .landing-nav {
    gap: 1.1rem;
    font-size: 0.98rem;
  }
}
```

### Backend: DRF Endpoint

```python
# assignments/views.py
class AssignmentListView(generics.ListCreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
```

---

## Database Schema (Simplified)

**User**

* id, username, email, password, role (student/teacher/admin), profile\_picture

**Subject**

* id, name, description

**Assignment**

* id, title, subject (ForeignKey), assigned\_to (ForeignKey), created\_by (ForeignKey)

---

## Deployment Plan

* **Frontend:** Deployed on [Vercel](https://vercel.com/)
  `npm run build` → auto deploy from GitHub.
* **Backend:** Deployed on [Render](https://render.com/)
  Configured with environment variables and PostgreSQL.
* **Database:** PostgreSQL on [Render](https://render.com/) or [Supabase](https://supabase.com/).
* **CORS:** Configured to allow frontend origin.

---

## 🎥 Video Demo

* [**Watch the 8-min demo here**](https://youtu.be/your-demo-link)

  * Features: Landing, Login, Dashboard, Teacher/Student Views, Responsiveness, Theme Toggle


# Thank you for exploring JuaLearn!

