# שימוש בתמונת Python רשמית
FROM python:3.11-slim

# הגדרת תיקיית עבודה
WORKDIR /app

# העתקת קובץ requirements
COPY requirements.txt .

# התקנת תלויות
RUN pip install --no-cache-dir -r requirements.txt

# העתקת כל הקבצים לקונטיינר
COPY . .

# חשיפת פורט 5000
EXPOSE 5000

# הרצת האפליקציה
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]