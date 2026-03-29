-- ============================================
-- MERES SANAT ATÖLYESİ — Supabase Database Setup
-- ============================================
-- Run this in your Supabase SQL Editor:
-- Go to supabase.com → Your Project → SQL Editor → New Query
-- Paste all of this and click "Run"
-- ============================================

-- 1. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. LESSONS TABLE
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  capacity INTEGER NOT NULL DEFAULT 10,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('paid', 'pending', 'partial')),
  paid_amount NUMERIC(10, 2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one student per lesson
  UNIQUE (lesson_id, student_id)
);

-- 5. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lesson ON enrollments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- 6. ROW LEVEL SECURITY (RLS)
-- For development, allow all access with anon key
-- In production, you should add proper auth policies

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (development mode)
CREATE POLICY "Allow all for teachers" ON teachers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for lessons" ON lessons
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for students" ON students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for enrollments" ON enrollments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- OPTIONAL: Insert a sample teacher to get started
-- ============================================
-- INSERT INTO teachers (name) VALUES ('Fatih');
