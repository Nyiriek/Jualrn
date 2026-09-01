import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.jpeg";
import heroImg from "../assets/pic.png";
import englishImg from "../assets/English.jpg";
import biologyImg from "../assets/Bio.jpg";
import mathsImg from "../assets/maths.jpg";
import "../styles/landingpage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHasScrolled(window.scrollY > 18);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className="lp-shell">
      <header className={`lp-header${hasScrolled ? " lp-header-scrolled" : ""}`}>
        <button className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="JuaLearn home">
          <img src={logoImg} alt="" /><span>Jua<span>Learn</span></span>
        </button>
        <nav className="lp-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#learning">Learning library</a>
          <a href="#for-you">For you</a>
        </nav>
        <div className="lp-header-actions"><button className="lp-text-button" onClick={() => navigate("/login")}>Log in</button><button className="lp-header-button" onClick={() => navigate("/login")}>Get started</button></div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-label">A better way to learn and teach</span>
            <h1>Learning that feels <em>clear, connected</em> and within reach.</h1>
            <p>JuaLearn brings curriculum-aligned courses, practice and teacher tools into one dependable space for secondary education.</p>
            <div className="lp-hero-actions"><button className="lp-primary" onClick={() => navigate("/login")}>Start learning <span>→</span></button><a href="#learning" className="lp-link-button">Explore the library <span>↓</span></a></div>
            <div className="lp-hero-notes"><div><b>Built for real classrooms</b><span>Simple workflows for teachers and learners</span></div><div><b>Ready across devices</b><span>Designed for mobile, tablet and desktop</span></div></div>
          </div>
          <div className="lp-hero-media" aria-hidden="true">
            <div className="lp-media-bg" /><div className="lp-image-frame"><img src={heroImg} alt="" /></div>
            <div className="lp-media-stat"><span className="lp-check">✓</span><div><strong>Everything in one place</strong><small>Courses, resources and assessments</small></div></div>
            <div className="lp-media-chip"><span>✦</span> Made for meaningful progress</div>
          </div>
        </section>

        <section className="lp-trust-bar"><p>Built to support stronger learning habits, more confident teaching and access to quality resources.</p><div><span>Learn</span><i /> <span>Practise</span><i /> <span>Progress</span></div></section>

        <section className="lp-section lp-value-section" id="how-it-works">
          <div className="lp-section-heading"><span className="lp-label">One platform, practical support</span><h2>Make every learning moment count.</h2><p>Whether it is finding the right reading, assigning work or checking progress, JuaLearn keeps the next step straightforward.</p></div>
          <div className="lp-value-grid">
            <article><div className="lp-icon mint">⌁</div><h3>Learn with direction</h3><p>Students can open structured course content, revisit notes and work through relevant practice at their own pace.</p><span>Explore courses</span></article>
            <article><div className="lp-icon gold">✦</div><h3>Build with confidence</h3><p>Teachers start from a resource repository, then adapt courses, activities, assignments and quizzes for their classes.</p><span>Use teaching resources</span></article>
            <article><div className="lp-icon blue">↗</div><h3>See meaningful progress</h3><p>Clear assessment and progress tools help learners understand their work and help teachers respond sooner.</p><span>Track growth</span></article>
          </div>
        </section>

        <section className="lp-library" id="learning">
          <div className="lp-library-top"><div><span className="lp-label">Discover the learning library</span><h2>Start with content that connects to the curriculum.</h2></div><button className="lp-outline-button" onClick={() => navigate("/courses")}>View all resources <span>→</span></button></div>
          <div className="lp-course-grid">
            <article className="lp-course-card"><div className="lp-course-image"><img src={englishImg} alt="" /><span>Language</span></div><div className="lp-course-copy"><span className="lp-card-tag">English</span><h3>Read, communicate and think critically</h3><p>Topics that strengthen language skills through relevant ideas and activities.</p><button onClick={() => navigate("/login")}>Explore English <span>→</span></button></div></article>
            <article className="lp-course-card"><div className="lp-course-image"><img src={biologyImg} alt="" /><span>Science</span></div><div className="lp-course-copy"><span className="lp-card-tag">Biology</span><h3>Understand life from cells to ecosystems</h3><p>Course resources that support investigation, explanation and discovery.</p><button onClick={() => navigate("/login")}>Explore Biology <span>→</span></button></div></article>
            <article className="lp-course-card"><div className="lp-course-image"><img src={mathsImg} alt="" /><span>STEM</span></div><div className="lp-course-copy"><span className="lp-card-tag">Maths &amp; science</span><h3>Build the habits of problem solving</h3><p>Practical learning pathways that encourage reasoning and application.</p><button onClick={() => navigate("/login")}>Explore STEM <span>→</span></button></div></article>
          </div>
        </section>

        <section className="lp-section lp-workflow-section"><div className="lp-workflow-panel"><div className="lp-workflow-steps"><div><b>01</b><span>Choose your role</span></div><div><b>02</b><span>Find your course</span></div><div><b>03</b><span>Learn, create and grow</span></div></div><div className="lp-workflow-art"><span>J</span><i>+</i><strong>Knowledge<br />in motion</strong></div></div><div className="lp-workflow-copy"><span className="lp-label">Simple from the first visit</span><h2>Your next step is already clear.</h2><p>Students use JuaLearn to explore their learning. Teachers use it to guide a class with purposeful, reusable content.</p><a href="#for-you" className="lp-inline-link">Find the right path for you <span>→</span></a></div></section>

        <section className="lp-roles" id="for-you"><div className="lp-roles-intro"><span className="lp-label">Choose your experience</span><h2>Designed around the people who make learning happen.</h2></div><div className="lp-role-grid"><article className="lp-role-card student"><span className="lp-role-icon">S</span><h3>For students</h3><p>Open courses, submit work, practise with quizzes and stay aware of your progress.</p><button onClick={() => navigate("/login/student")}>Student login <span>→</span></button></article><article className="lp-role-card teacher"><span className="lp-role-icon">T</span><h3>For teachers</h3><p>Use the resource repository to create better courses and deliver meaningful assessment.</p><button onClick={() => navigate("/login/teacher")}>Teacher login <span>→</span></button></article></div></section>

        <section className="lp-final-cta"><div><span className="lp-label">JuaLearn is ready when you are</span><h2>Bring learning, resources and progress together.</h2><p>Start with a role, then make the platform your own.</p></div><button className="lp-primary" onClick={() => navigate("/login")}>Get started <span>→</span></button></section>
      </main>
      <footer className="lp-footer"><div className="lp-footer-wordmark">Jua<span>Learn</span></div><p>Learning tools for stronger secondary education.</p><span>© {new Date().getFullYear()} JuaLearn</span></footer>
    </div>
  );
};

export default LandingPage;
