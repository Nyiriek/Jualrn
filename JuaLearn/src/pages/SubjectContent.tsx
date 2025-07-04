import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Typography, Box, Card, CardContent } from '@mui/material';

const SubjectContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/subjects/${id}/`)
      .then(res => setSubject(res.data));
  }, [id]);

  if (!subject) return <div>Loading...</div>;

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h4">{subject.name}</Typography>
          {/* Add more info/resources here as needed */}
        </CardContent>
      </Card>
      {/* Render lessons, resources, etc. here */}
    </Box>
  );
};

export default SubjectContent;
