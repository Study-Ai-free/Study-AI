import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Quiz as QuizIcon,
  Analytics as AnalyticsIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import FileUpload from './FileUpload';
import QuizSection from './QuizSection';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Upload your study materials and start generating personalized quizzes
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SchoolIcon color="primary" />
                <Box>
                  <Typography variant="h6">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Subjects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <UploadIcon color="primary" />
                <Box>
                  <Typography variant="h6">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Files Uploaded
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <QuizIcon color="primary" />
                <Box>
                  <Typography variant="h6">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quizzes Taken
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="primary" />
                <Box>
                  <Typography variant="h6">-</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Upload Content" />
            <Tab label="Take Quiz" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>
        <TabPanel value={currentTab} index={0}>
          <FileUpload />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <QuizSection />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Analytics Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your learning progress and identify areas for improvement.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Dashboard;