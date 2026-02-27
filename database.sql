-- PostgreSQL Database Schema for Eco-Decision-Guide
-- Created for Vercel PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    city VARCHAR(100),
    sustainability_score INT DEFAULT 0 CHECK (sustainability_score >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daily Habits Table
CREATE TABLE IF NOT EXISTS daily_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transport_type VARCHAR(50) CHECK (transport_type IN ('car','bike','bus','walk','train')),
    electricity_hours DECIMAL(5,2) CHECK (electricity_hours >= 0),
    meat_meals INT CHECK (meat_meals >= 0),
    plastic_items INT CHECK (plastic_items >= 0),
    water_usage_liters DECIMAL(8,2) CHECK (water_usage_liters >= 0),
    habit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, habit_date)
);

-- 3. Carbon Emission Log
CREATE TABLE IF NOT EXISTS carbon_emission_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_emission DECIMAL(10,3) NOT NULL CHECK (total_emission >= 0),
    emission_level VARCHAR(20) CHECK (emission_level IN ('low','medium','high')),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Eco Suggestions (AI Output)
CREATE TABLE IF NOT EXISTS eco_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    suggestion TEXT NOT NULL,
    impact_reduction DECIMAL(8,3),
    category VARCHAR(50), -- transport, food, electricity, water
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rewards & Gamification
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    points INT DEFAULT 0 CHECK (points >= 0),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Green Action Blockchain Proof (Optional Web3 Layer)
CREATE TABLE IF NOT EXISTS green_actions_proof (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100),
    carbon_saved DECIMAL(8,3) CHECK (carbon_saved >= 0),
    blockchain_tx_hash TEXT UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Decisions Table (Legacy - kept for compatibility)
CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    original_action TEXT NOT NULL,
    original_co2_kg NUMERIC NOT NULL,
    eco_alternative TEXT NOT NULL,
    eco_co2_kg NUMERIC NOT NULL,
    co2_saved_kg NUMERIC NOT NULL,
    percentage_reduction NUMERIC NOT NULL,
    sustainability_score INT NOT NULL,
    encouragement_message TEXT NOT NULL
);

-- Recommended Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_habits_user ON daily_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_user ON carbon_emission_log(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON eco_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_green_actions_user ON green_actions_proof(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
