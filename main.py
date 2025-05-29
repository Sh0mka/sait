from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List, Optional
import os
from datetime import datetime

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене замените на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class User(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    steps: int = 0
    stars: int = 0
    rank: int = 0
    referral_code: str

class StepsUpdate(BaseModel):
    steps: int

# Подключение к базе данных
def get_db():
    conn = sqlite3.connect('stepstar.db', check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()

# API endpoints
@app.get("/api/user/{user_id}")
async def get_user(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT user_id, username, first_name, last_name, steps_today as steps, 
               stars, referral_code
        FROM users 
        WHERE user_id = ?
    """, (user_id,))
    user_data = cursor.fetchone()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Получаем ранг пользователя
    cursor.execute("""
        SELECT COUNT(*) + 1 
        FROM users 
        WHERE stars > (SELECT stars FROM users WHERE user_id = ?)
    """, (user_id,))
    rank = cursor.fetchone()[0]
    
    return {
        "id": user_data[0],
        "username": user_data[1],
        "first_name": user_data[2],
        "last_name": user_data[3],
        "steps": user_data[4],
        "stars": user_data[5],
        "rank": rank,
        "referral_code": user_data[6]
    }

@app.post("/api/user/{user_id}/steps")
async def update_steps(user_id: int, steps_update: StepsUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE users 
            SET steps_today = steps_today + ?,
                steps_total = steps_total + ?,
                last_active = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (steps_update.steps, steps_update.steps, user_id))
        
        cursor.execute("SELECT steps_today FROM users WHERE user_id = ?", (user_id,))
        new_steps = cursor.fetchone()[0]
        
        db.commit()
        return {"steps": new_steps}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user/{user_id}/convert")
async def convert_steps(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    try:
        # Получаем текущие данные пользователя
        cursor.execute("""
            SELECT steps_today, stars 
            FROM users 
            WHERE user_id = ?
        """, (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        steps_today, current_stars = user_data
        stars_to_add = steps_today // 1000  # 1000 шагов = 1 звезда
        
        if stars_to_add > 0:
            # Обновляем данные
            remaining_steps = steps_today % 1000
            new_stars = current_stars + stars_to_add
            
            cursor.execute("""
                UPDATE users 
                SET stars = ?, 
                    steps_today = ?,
                    last_active = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (new_stars, remaining_steps, user_id))
            
            # Проверяем реферальную программу
            cursor.execute("""
                SELECT r.referrer_id, r.bonus_awarded
                FROM referrals r
                WHERE r.referred_id = ? AND r.bonus_awarded = 0
            """, (user_id,))
            referral_data = cursor.fetchone()
            
            if referral_data:
                referrer_id = referral_data[0]
                # Начисляем бонус рефереру
                cursor.execute("""
                    UPDATE users 
                    SET stars = stars + 50 
                    WHERE user_id = ?
                """, (referrer_id,))
                
                # Помечаем бонус как выданный
                cursor.execute("""
                    UPDATE referrals 
                    SET bonus_awarded = 1 
                    WHERE referrer_id = ? AND referred_id = ?
                """, (referrer_id, user_id))
            
            db.commit()
            return {
                "stars": new_stars,
                "steps": remaining_steps,
                "starsAdded": stars_to_add
            }
        else:
            raise HTTPException(status_code=400, detail="Недостаточно шагов для конвертации")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
async def get_leaderboard(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT user_id, username, first_name, stars 
        FROM users 
        ORDER BY stars DESC 
        LIMIT 10
    """)
    leaderboard = cursor.fetchall()
    
    return [
        {
            "id": user[0],
            "username": user[1],
            "first_name": user[2],
            "stars": user[3]
        }
        for user in leaderboard
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 