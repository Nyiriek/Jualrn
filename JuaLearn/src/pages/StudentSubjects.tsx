import React from "react";
import Grid from '@mui/material/Grid';
import { Card, CardContent, Typography, CardMedia } from "@mui/material";
import mathImg from "../assets/maths.jpg";
import englishImg from "../assets/English.jpg";
import biologyImg from "../assets/Bio.jpg";

const subjects = [
  { name: "Mathematics", img: mathImg, desc: "Explore lessons, assignments, and resources in Mathematics." },
  { name: "English", img: englishImg, desc: "Improve your English language skills and communication." },
  { name: "Biology", img: biologyImg, desc: "Dive into the study of living things and ecosystems." },
];

const StudentSubjects = () => (
  <div style={{ padding: 32 }}>
    <Typography variant="h4" gutterBottom>Subjects</Typography>
    <Grid container spacing={3} sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr 1fr",
        md: "1fr 1fr 1fr",
        lg: "1fr 1fr 1fr 1fr"
      },
      gap: 3,
    }}>
      {subjects.map(subj => (
        <Card sx={{ height: "100%" }} key={subj.name}>
          <CardMedia
            component="img"
            height="140"
            image={subj.img}
            alt={subj.name}
          />
          <CardContent>
            <Typography variant="h6">{subj.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subj.desc}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Grid>
  </div>
);

export default StudentSubjects;
