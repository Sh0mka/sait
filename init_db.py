import sqlite3
import random
import string

def generate_referral_code(user_id: int, length=8):
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{user_id}_{random_part}"

# Подключение к базе данных
conn = sqlite3.connect('stepstar.db')
cursor = conn.cursor()

# Создание таблиц
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    steps_today INTEGER DEFAULT 0,
    steps_total INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referrer_id INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS referrals (
    referral_id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_id INTEGER,
    bonus_awarded BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(user_id),
    FOREIGN KEY (referred_id) REFERENCES users(user_id)
)
''')

# Создаем тестового пользователя
test_user = {
    'user_id': 1,
    'username': 'test_user',
    'first_name': 'Test',
    'last_name': 'User',
    'referral_code': generate_referral_code(1)
}

cursor.execute('''
INSERT OR IGNORE INTO users (user_id, username, first_name, last_name, referral_code)
VALUES (?, ?, ?, ?, ?)
''', (test_user['user_id'], test_user['username'], test_user['first_name'], 
      test_user['last_name'], test_user['referral_code']))

conn.commit()
conn.close()

print("База данных успешно инициализирована!") 