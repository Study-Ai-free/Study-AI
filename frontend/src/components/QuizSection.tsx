import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface QuizResponse {
  quiz: Quiz;
}

const QuizSection: React.FC = () => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (): Promise<QuizResponse> => {
      const response = await api.post('/api/quiz/generate', {
        subjectId: 'default-subject-id', // TODO: Allow subject selection
        difficulty: 3,
        questionCount: 5,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentQuiz(data.quiz);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setQuizCompleted(false);
    },
  });

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    if (!currentQuiz) return { score: 0, total: 0, percentage: 0 };
    
    const correctAnswers = currentQuiz.questions.filter(q => 
      answers[q.id] === q.correctAnswer
    ).length;
    
    return {
      score: correctAnswers,
      total: currentQuiz.questions.length,
      percentage: Math.round((correctAnswers / currentQuiz.questions.length) * 100)
    };
  };

  const startNewQuiz = () => {
    generateQuizMutation.mutate();
  };

  if (!currentQuiz && !generateQuizMutation.isPending) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Ready to Test Your Knowledge?
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Generate a personalized quiz based on your uploaded study materials
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={startNewQuiz}
          sx={{ mt: 2 }}
          startIcon={<QuizIcon />}
        >
          Generate Quiz
        </Button>
      </Box>
    );
  }

  if (generateQuizMutation.isPending) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Generating your personalized quiz...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we analyze your study materials
        </Typography>
      </Box>
    );
  }

  if (generateQuizMutation.error) {
    return (
      <Alert severity="error">
        Failed to generate quiz: {(generateQuizMutation.error as any)?.response?.data?.message || 'Unknown error'}
      </Alert>
    );
  }

  if (showResults) {
    const { score, total, percentage } = calculateScore();
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
          Quiz Results
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="primary" gutterBottom>
              {percentage}%
            </Typography>
            <Typography variant="h6" gutterBottom>
              {score} out of {total} correct
            </Typography>
            <Chip 
              label={percentage >= 70 ? 'Great Job!' : percentage >= 50 ? 'Keep Practicing' : 'Need More Study'}
              color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        {/* Question Review */}
        <Typography variant="h6" gutterBottom>
          Question Review
        </Typography>
        {currentQuiz?.questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {answers[question.id] === question.correctAnswer ? (
                  <CheckIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
                <Typography variant="subtitle2">
                  Question {index + 1}
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                {question.question}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your answer: {answers[question.id] || 'Not answered'}
              </Typography>
              
              <Typography variant="body2" color="success.main" gutterBottom>
                Correct answer: {question.correctAnswer}
              </Typography>
              
              {question.explanation && (
                <Typography variant="body2" color="text.secondary">
                  Explanation: {question.explanation}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button variant="contained" onClick={startNewQuiz}>
            Take Another Quiz
          </Button>
        </Box>
      </Box>
    );
  }

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const progress = currentQuiz ? ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100 : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {currentQuiz?.title || 'Quiz'}
      </Typography>
      
      {/* Progress */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">
            Question {currentQuestionIndex + 1} of {currentQuiz?.questions.length}
          </Typography>
          <Typography variant="body2">
            {Math.round(progress)}% Complete
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 8, backgroundColor: 'grey.200', borderRadius: 1 }}>
          <Box 
            sx={{ 
              width: `${progress}%`, 
              height: '100%', 
              backgroundColor: 'primary.main', 
              borderRadius: 1,
              transition: 'width 0.3s ease'
            }} 
          />
        </Box>
      </Box>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {currentQuestion.question}
            </Typography>
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNextQuestion}
          disabled={currentQuestion && !answers[currentQuestion.id]}
        >
          {currentQuestionIndex === (currentQuiz?.questions.length || 0) - 1 ? 'Finish Quiz' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default QuizSection;