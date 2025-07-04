import React from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.jpeg";
import heroImg from "../assets/pic.png";
import "../styles/landingpage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* ---- HEADER ---- */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src={logoImg} alt="JuaLearn Logo" />
          <span className="logo-text">JuaLearn</span>
        </div>
        <nav className="landing-nav">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#courses">Courses</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="login-btn" onClick={() => navigate("/login")}>
          Login
        </button>
      </header>

      {/* ---- HERO SECTION ---- */}
      <main className="landing-hero">
        <section className="hero-text">
          <h1>
            Welcome to JuaLearn <br />
            Empowering Secondary Education in South Sudan
          </h1>
          <br />
          <p>
            JuaLearn’s mission is to provide high-quality educational resources to learners across South Sudan.<br />
            Whether you're a student or passionate about lifelong learning, JuaLearn offers a wide range of curriculum-aligned courses, tutorials, and interactive experiences tailored to the South Sudanese secondary school curriculum.
          </p>
          <br />
          <p>
            Join our community of learners and embark on a journey of discovery, knowledge, and personal development.<br />
            Let’s learn, grow, and shape the future together with JuaLearn!
          </p>
        </section>
        <section className="hero-image">
          <img src={heroImg} alt="Learning illustration" />
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
