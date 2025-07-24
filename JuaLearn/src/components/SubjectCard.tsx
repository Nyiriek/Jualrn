import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, CardMedia, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import mathImg from "../assets/maths.jpg";
import englishImg from "../assets/English.jpg";
import biologyImg from "../assets/Bio.jpg";
import defaultImg from "../assets/default-image.jpeg";
import '../styles/SubjectCard.css';

type Subject = {
  id: number;
  name: string;
  description?: string; 
  image?: string;
};

const subjectImages: { [key: string]: string } = {
  Mathematics: mathImg,
  English: englishImg,
  Biology: biologyImg,
};

const SubjectCard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useThemeMode();

  useEffect(() => {
    if (!user) {
      setError('You must be logged in to view subjects.');
      return;
    }
    axios.get('/subjects/')
      .then(res => setSubjects(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load subjects.');
        }
      });

    if (user.role === 'student') {
      axios.get('/enrollments/')
        .then(res => {
          const enrolledIds = res.data.map((enrollment: any) => enrollment.subject.id);
          setEnrolledSubjectIds(enrolledIds);
        })
        .catch(() => {
          // silently ignore or set error if you want
        });
    }
  }, [user]);

  const handleEnroll = async (subjectId: number) => {
    try {
      await axios.post('/enrollments/', { subject_id: subjectId });
      setEnrolledSubjectIds(prev => [...prev, subjectId]);
    } catch {
      alert('Failed to enroll in subject.');
    }
  };

  const handleCardClick = (subjectId: number) => {
    navigate(`/student/subject/${subjectId}`);
  };

  if (error) {
    return <Typography color="error" align="center" sx={{ mt: 4 }}>{error}</Typography>;
  }

  return (
    <div className="subject-cards">
      {Array.isArray(subjects) && subjects.map((subject) => {
        const isEnrolled = enrolledSubjectIds.includes(subject.id);
        return (
          <Card
            className="subject-card"
            key={subject.id}
            sx={{
              background: mode === "dark" ? "#23262d" : "#fff",
              color: mode === "dark" ? "#fff" : "#23395d",
              boxShadow: mode === "dark"
                ? "0 0 18px 3px #3895ff99, 0 2px 8px rgba(0,0,0,0.2)"
                : "0 2px 8px rgba(0,0,0,0.08)",
              borderRadius: 3,
              border: mode === "dark" ? "1.5px solid #333a" : "1.5px solid #e0e0e0",
              transition: "background 0.3s, color 0.3s, box-shadow 0.3s",
            }}
          >
            <CardMedia
              className="subject-card-img"
              component="img"
              height="140"
              image={subjectImages[subject.name] || defaultImg}
              alt={subject.name}
              sx={{
                filter: mode === "dark" ? "brightness(0.8)" : "none"
              }}
            />
            <CardContent>
              <Typography variant="h6">{subject.name}</Typography>
              <Typography variant="body2" color={mode === "dark" ? "#bfc7d1" : "text.secondary"} gutterBottom>
                {subject.description || 'View resources and lessons'}
              </Typography>
              {user?.role === 'student' ? (
                <Button
                  size="small"
                  variant="contained"
                  color={isEnrolled ? "success" : "primary"}
                  disabled={isEnrolled}
                  onClick={() => !isEnrolled && handleEnroll(subject.id)}
                  sx={{
                    mt: 1,
                    bgcolor: isEnrolled
                      ? (mode === "dark" ? "#4caf50" : "#388e3c")
                      : (mode === "dark" ? "#3895ff" : undefined),
                    color: mode === "dark" ? "#fff" : undefined,
                  }}
                >
                  {isEnrolled ? "Enrolled" : "Enroll"}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleCardClick(subject.id)}
                  sx={{
                    mt: 1,
                    bgcolor: mode === "dark" ? "#3895ff" : undefined,
                    color: mode === "dark" ? "#fff" : undefined,
                  }}
                >
                  View Subject
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SubjectCard;
