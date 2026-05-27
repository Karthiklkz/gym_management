-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role_enum AS ENUM (
'super_admin',
'gym_admin',
'trainer',
'member'
);

CREATE TYPE user_status_enum AS ENUM (
'active',
'inactive',
'suspended'
);

CREATE TYPE membership_status_enum AS ENUM (
'active',
'expired',
'cancelled'
);

CREATE TYPE payment_status_enum AS ENUM (
'pending',
'success',
'failed',
'refunded'
);

CREATE TYPE payment_method_enum AS ENUM (
'cash',
'card',
'upi',
'online'
);

CREATE TYPE equipment_status_enum AS ENUM (
'active',
'maintenance',
'retired'
);

CREATE TYPE notification_type_enum AS ENUM (
'system',
'promotion',
'reminder'
);

CREATE TYPE device_type_enum AS ENUM (
'android',
'ios'
);

CREATE TYPE class_level_enum AS ENUM (
'beginner',
'intermediate',
'advanced'
);

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

CREATE TABLE subscription_plans (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(100) NOT NULL,
max_branches INTEGER NOT NULL,
max_trainers INTEGER NOT NULL,
max_members INTEGER NOT NULL,
price NUMERIC(10,2) NOT NULL,
billing_cycle VARCHAR(20) NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- GYMS
-- =====================================================

CREATE TABLE gyms (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(255) NOT NULL,
owner_name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
phone VARCHAR(20) NOT NULL,
subscription_plan_id UUID NOT NULL,
status user_status_enum DEFAULT 'active',
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (subscription_plan_id)
REFERENCES subscription_plans(id)
);

-- =====================================================
-- BRANCHES
-- =====================================================

CREATE TABLE branches (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID NOT NULL,
name VARCHAR(255) NOT NULL,
address TEXT NOT NULL,
city VARCHAR(100) NOT NULL,
state VARCHAR(100),
country VARCHAR(100),
phone VARCHAR(20),
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (gym_id)
REFERENCES gyms(id)
ON DELETE CASCADE
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID,
branch_id UUID,
email VARCHAR(255) UNIQUE NOT NULL,
phone VARCHAR(20),
password_hash TEXT NOT NULL,
role user_role_enum NOT NULL,
status user_status_enum DEFAULT 'active',
email_verified BOOLEAN DEFAULT FALSE,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ,

FOREIGN KEY (gym_id)
REFERENCES gyms(id)
ON DELETE CASCADE,

FOREIGN KEY (branch_id)
REFERENCES branches(id)
ON DELETE SET NULL
);

-- =====================================================
-- USER PROFILES
-- =====================================================

CREATE TABLE user_profiles (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID UNIQUE NOT NULL,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100),
gender VARCHAR(20),
date_of_birth DATE,
profile_image TEXT,
emergency_contact VARCHAR(20),

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
);

-- =====================================================
-- TRAINERS
-- =====================================================

CREATE TABLE trainers (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID UNIQUE NOT NULL,
specialization VARCHAR(255),
experience_years INTEGER,
certification TEXT,

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
);

-- =====================================================
-- MEMBERS
-- =====================================================

CREATE TABLE members (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID UNIQUE NOT NULL,
join_date TIMESTAMPTZ DEFAULT now(),
medical_notes TEXT,

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
);

-- =====================================================
-- MEMBERSHIP PLANS
-- =====================================================

CREATE TABLE membership_plans (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID NOT NULL,
name VARCHAR(100) NOT NULL,
duration_days INTEGER NOT NULL,
price NUMERIC(10,2) NOT NULL,
description TEXT,
status user_status_enum DEFAULT 'active',

FOREIGN KEY (gym_id)
REFERENCES gyms(id)
ON DELETE CASCADE
);

-- =====================================================
-- MEMBER MEMBERSHIPS
-- =====================================================

CREATE TABLE member_memberships (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL,
membership_plan_id UUID NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
status membership_status_enum DEFAULT 'active',

FOREIGN KEY (member_id)
REFERENCES members(id)
ON DELETE CASCADE,

FOREIGN KEY (membership_plan_id)
REFERENCES membership_plans(id)
);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL,
membership_id UUID NOT NULL,
amount NUMERIC(10,2) NOT NULL,
payment_method payment_method_enum NOT NULL,
transaction_id VARCHAR(255),
payment_status payment_status_enum DEFAULT 'pending',
paid_at TIMESTAMPTZ,

FOREIGN KEY (member_id)
REFERENCES members(id)
ON DELETE CASCADE,

FOREIGN KEY (membership_id)
REFERENCES member_memberships(id)
ON DELETE CASCADE
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE TABLE attendance (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL,
branch_id UUID NOT NULL,
check_in TIMESTAMPTZ NOT NULL,
check_out TIMESTAMPTZ,

FOREIGN KEY (member_id)
REFERENCES members(id)
ON DELETE CASCADE,

FOREIGN KEY (branch_id)
REFERENCES branches(id)
ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL,
title VARCHAR(255) NOT NULL,
message TEXT NOT NULL,
notification_type notification_type_enum,
is_read BOOLEAN DEFAULT FALSE,
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
);

-- =====================================================
-- DEVICE TOKENS
-- =====================================================

CREATE TABLE device_tokens (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL,
device_type device_type_enum NOT NULL,
token TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID,
action VARCHAR(255),
entity VARCHAR(255),
entity_id UUID,
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (user_id)
REFERENCES users(id)
);

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE feature_flags (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID NOT NULL,
feature_name VARCHAR(255) NOT NULL,
enabled BOOLEAN DEFAULT FALSE,

FOREIGN KEY (gym_id)
REFERENCES gyms(id)
ON DELETE CASCADE
);

-- =====================================================
-- CLASSES
-- =====================================================

CREATE TABLE classes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID NOT NULL,
branch_id UUID,
trainer_id UUID,
name VARCHAR(255) NOT NULL,
start_time VARCHAR(50) NOT NULL,
end_time VARCHAR(50) NOT NULL,
current_capacity INTEGER DEFAULT 0,
max_capacity INTEGER NOT NULL,
level class_level_enum DEFAULT 'beginner',
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- =====================================================
-- EQUIPMENT
-- =====================================================

CREATE TABLE equipment (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gym_id UUID NOT NULL,
branch_id UUID,
name VARCHAR(255) NOT NULL,
category VARCHAR(100) NOT NULL,
quantity INTEGER NOT NULL DEFAULT 1,
status equipment_status_enum DEFAULT 'active',
created_at TIMESTAMPTZ DEFAULT now(),

FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_gym ON users(gym_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_classes_gym ON classes(gym_id);
CREATE INDEX idx_equipment_gym ON equipment(gym_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();