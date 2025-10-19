#!/bin/bash

# Seed data script - adds sample data for demo purposes
# Run with: ./seed-data.sh

API_URL="http://localhost:3001/api"

echo "🌱 Seeding Bandinator with sample data..."
echo ""

# Wait for backend to be ready
echo "Checking if backend is running..."
max_attempts=10
attempt=0
until curl -s "$API_URL/../health" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Backend is not running. Please start it with 'pnpm dev' first."
    exit 1
  fi
  echo "Waiting for backend... (attempt $attempt/$max_attempts)"
  sleep 2
done
echo "✅ Backend is ready"
echo ""

# Create sample rules
echo "Creating sample rules..."

curl -X POST "$API_URL/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Software Development Keywords",
    "description": "Checks for software development related keywords",
    "ruleType": "keyword",
    "condition": "software,development,programming,coding,agile,scrum",
    "weight": 2.0
  }' > /dev/null 2>&1

curl -X POST "$API_URL/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budget Range Check",
    "description": "Validates budget is within acceptable range",
    "ruleType": "budget",
    "condition": "10000-100000",
    "weight": 1.5
  }' > /dev/null 2>&1

curl -X POST "$API_URL/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cloud Technology",
    "description": "Checks for cloud technology keywords",
    "ruleType": "keyword",
    "condition": "cloud,aws,azure,gcp,kubernetes,docker",
    "weight": 1.8
  }' > /dev/null 2>&1

curl -X POST "$API_URL/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Requirements",
    "description": "Looks for security-related requirements",
    "ruleType": "keyword",
    "condition": "security,encryption,authentication,compliance,gdpr",
    "weight": 1.2
  }' > /dev/null 2>&1

curl -X POST "$API_URL/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Small Budget Projects",
    "description": "Small to medium budget range",
    "ruleType": "budget",
    "condition": "5000-50000",
    "weight": 1.0
  }' > /dev/null 2>&1

echo "✅ Created 5 sample rules"
echo ""

# Create sample tenders
echo "Creating sample tenders..."

curl -X POST "$API_URL/tenders" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform Development",
    "reference": "TENDER-2025-001",
    "deadline": "2025-12-31",
    "budget": 45000,
    "description": "Development of a modern e-commerce platform with cloud deployment. Must include secure payment processing, user authentication, and product management.",
    "requirements": "React frontend, Node.js backend, PostgreSQL database, AWS deployment, security compliance, agile development methodology"
  }' > /dev/null 2>&1

curl -X POST "$API_URL/tenders" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mobile App for Healthcare",
    "reference": "TENDER-2025-002",
    "deadline": "2025-11-30",
    "budget": 75000,
    "description": "Native mobile application for healthcare providers with patient management and telemedicine features.",
    "requirements": "iOS and Android support, HIPAA compliance, secure data storage, real-time video calls, offline mode"
  }' > /dev/null 2>&1

curl -X POST "$API_URL/tenders" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Analytics Dashboard",
    "reference": "TENDER-2025-003",
    "deadline": "2025-10-31",
    "budget": 25000,
    "description": "Interactive dashboard for business intelligence with data visualization and reporting capabilities.",
    "requirements": "Python backend, React frontend, PostgreSQL, Docker deployment, real-time data updates"
  }' > /dev/null 2>&1

curl -X POST "$API_URL/tenders" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Microservices Migration",
    "reference": "TENDER-2025-004",
    "deadline": "2026-03-31",
    "budget": 120000,
    "description": "Migration of monolithic application to microservices architecture using cloud-native technologies.",
    "requirements": "Kubernetes, Docker, AWS or Azure, CI/CD pipeline, monitoring and logging, zero-downtime deployment"
  }' > /dev/null 2>&1

curl -X POST "$API_URL/tenders" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CRM System Customization",
    "reference": "TENDER-2025-005",
    "deadline": "2025-09-30",
    "budget": 15000,
    "description": "Customization and integration of existing CRM system with third-party tools.",
    "requirements": "Salesforce or similar CRM, API integration, custom workflows, reporting, user training"
  }' > /dev/null 2>&1

echo "✅ Created 5 sample tenders"
echo ""

echo "🎉 Seeding complete!"
echo ""
echo "You can now:"
echo "1. Go to http://localhost:3000/tenders to view tenders"
echo "2. Go to http://localhost:3000/rules to view rules"
echo "3. Go to http://localhost:3000/analysis to run analysis"
echo ""
