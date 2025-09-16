-- Sample data for Study AI Database
-- This file contains sample data for testing and development

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'alice@example.com', '$2b$10$example_hash_here', 'Alice', 'Johnson', true),
('22222222-2222-2222-2222-222222222222', 'bob@example.com', '$2b$10$example_hash_here', 'Bob', 'Smith', true),
('33333333-3333-3333-3333-333333333333', 'carol@example.com', '$2b$10$example_hash_here', 'Carol', 'Davis', false);

-- Insert sample subjects
INSERT INTO subjects (id, user_id, name, description, color) VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Mathematics', 'Calculus and Linear Algebra', '#FF6B6B'),
('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Computer Science', 'Data Structures and Algorithms', '#4ECDC4'),
('aaaa3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Physics', 'Quantum Mechanics', '#45B7D1'),
('aaaa4444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Chemistry', 'Organic Chemistry', '#96CEB4');

-- Insert sample content
INSERT INTO content (id, user_id, subject_id, original_filename, file_path, file_type, file_size, upload_status, processed_content) VALUES
('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'calculus_chapter1.pdf', '/uploads/calc_ch1.pdf', 'pdf', 2048576, 'processed', 
'{"topics": ["derivatives", "limits", "continuity"], "summary": "Introduction to differential calculus", "key_concepts": ["limit definition", "derivative rules", "chain rule"]}'),
('bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'algorithms_lecture.mp4', '/uploads/algo_lect.mp4', 'video', 15728640, 'processed',
'{"topics": ["sorting algorithms", "time complexity", "space complexity"], "summary": "Overview of sorting algorithms and their analysis", "key_concepts": ["Big O notation", "quicksort", "mergesort"]}');

-- Insert sample topics
INSERT INTO topics (id, content_id, subject_id, name, description, keywords, difficulty_level, importance_score) VALUES
('cccc1111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Derivatives', 'Rate of change and slopes of curves', ARRAY['derivative', 'slope', 'tangent', 'rate of change'], 3, 0.95),
('cccc2222-2222-2222-2222-222222222222', 'bbbb1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Limits', 'Behavior of functions as they approach a value', ARRAY['limit', 'approach', 'epsilon-delta', 'continuity'], 4, 0.90),
('cccc3333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 'Sorting Algorithms', 'Methods for organizing data in order', ARRAY['sort', 'algorithm', 'quicksort', 'mergesort', 'efficiency'], 3, 0.85),
('cccc4444-4444-4444-4444-444444444444', 'bbbb2222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 'Time Complexity', 'Analysis of algorithm efficiency', ARRAY['big O', 'complexity', 'performance', 'analysis'], 4, 0.92);

-- Insert sample quizzes
INSERT INTO quizzes (id, user_id, subject_id, title, description, difficulty_level, total_questions, time_limit_minutes, quiz_type, status) VALUES
('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Daily Calculus Practice', 'Basic derivatives and limits', 3, 10, 30, 'daily', 'completed'),
('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'Algorithm Analysis Quiz', 'Time complexity and sorting', 4, 8, 25, 'practice', 'completed'),
('dddd3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333', 'Quantum Mechanics Basics', 'Introduction to quantum concepts', 5, 12, 45, 'exam_prep', 'active');

-- Insert sample quiz questions
INSERT INTO quiz_questions (id, quiz_id, topic_id, question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index) VALUES
('eeee1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'cccc1111-1111-1111-1111-111111111111', 'What is the derivative of x²?', 'multiple_choice', '["x", "2x", "x²", "2x²"]', '2x', 'Using the power rule: d/dx(x²) = 2x¹ = 2x', 2, 1, 1),
('eeee2222-2222-2222-2222-222222222222', 'dddd1111-1111-1111-1111-111111111111', 'cccc2222-2222-2222-2222-222222222222', 'The limit of sin(x)/x as x approaches 0 is 1.', 'true_false', null, 'true', 'This is a fundamental limit in calculus, often proven using the squeeze theorem.', 3, 1, 2),
('eeee3333-3333-3333-3333-333333333333', 'dddd2222-2222-2222-2222-222222222222', 'cccc3333-3333-3333-3333-333333333333', 'What is the average time complexity of quicksort?', 'multiple_choice', '["O(n)", "O(n log n)", "O(n²)", "O(log n)"]', 'O(n log n)', 'Quicksort has an average case time complexity of O(n log n), though worst case is O(n²).', 3, 1, 1);

-- Insert sample quiz attempts
INSERT INTO quiz_attempts (id, quiz_id, user_id, started_at, completed_at, total_score, max_possible_score, time_taken_minutes, status) VALUES
('ffff1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2024-01-15 10:00:00+00', '2024-01-15 10:25:00+00', 8, 10, 25, 'completed'),
('ffff2222-2222-2222-2222-222222222222', 'dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2024-01-16 14:30:00+00', '2024-01-16 14:50:00+00', 7, 8, 20, 'completed');

-- Insert sample quiz responses
INSERT INTO quiz_responses (id, attempt_id, question_id, user_answer, is_correct, points_earned, time_taken_seconds, answered_at) VALUES
('gggg1111-1111-1111-1111-111111111111', 'ffff1111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', '2x', true, 1, 45, '2024-01-15 10:05:00+00'),
('gggg2222-2222-2222-2222-222222222222', 'ffff1111-1111-1111-1111-111111111111', 'eeee2222-2222-2222-2222-222222222222', 'true', true, 1, 30, '2024-01-15 10:08:00+00'),
('gggg3333-3333-3333-3333-333333333333', 'ffff2222-2222-2222-2222-222222222222', 'eeee3333-3333-3333-3333-333333333333', 'O(n log n)', true, 1, 60, '2024-01-16 14:35:00+00');

-- Insert sample performance analytics
INSERT INTO performance_analytics (id, user_id, subject_id, topic_id, analytics_date, total_questions, correct_answers, accuracy_rate, average_difficulty, time_spent_minutes, improvement_trend) VALUES
('hhhh1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'cccc1111-1111-1111-1111-111111111111', '2024-01-15', 5, 4, 0.8000, 2.5, 15, 'improving'),
('hhhh2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'cccc2222-2222-2222-2222-222222222222', '2024-01-15', 3, 2, 0.6667, 3.0, 10, 'stable'),
('hhhh3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'cccc3333-3333-3333-3333-333333333333', '2024-01-16', 4, 4, 1.0000, 3.2, 20, 'improving');

-- Insert sample study sessions
INSERT INTO study_sessions (id, user_id, subject_id, session_type, duration_minutes, activities_completed, started_at, ended_at) VALUES
('iiii1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'quiz', 25, 1, '2024-01-15 10:00:00+00', '2024-01-15 10:25:00+00'),
('iiii2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'quiz', 20, 1, '2024-01-16 14:30:00+00', '2024-01-16 14:50:00+00'),
('iiii3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', null, 'upload', 5, 1, '2024-01-17 09:00:00+00', '2024-01-17 09:05:00+00');