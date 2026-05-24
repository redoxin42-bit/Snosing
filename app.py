import random
import string
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import httpx

app = FastAPI(title="Session Terminator Engine")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Встроенная база генерации фейковых данных заявителя
FIRST_NAMES = ["Александр", "Дмитрий", "Сергей", "Андрей", "Алексей", "Максим", "Иван", "Евгений"]
LAST_NAMES = ["Иванов", "Петров", "Смирнов", "Соколов", "Попов", "Лебедев", "Козлов", "Новиков"]
DOMAINS = ["gmail.com", "mail.ru", "yandex.ru", "proton.me", "outlook.com"]

def generate_random_reporter():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    rand_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    email = f"{translit(last).lower()}_{rand_str}@{random.choice(DOMAINS)}"
    return f"{first} {last}", email

def translit(text):
    # Упрощенный транслит для генерации логинов email
    rules = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya'}
    return "".join(rules.get(c, c) for c in text.lower())

def generate_ai_prompt(prompt_type: str, phone: str, tg_id: str, username: str) -> str:
    # Симуляция ИИ-генерации текста жалобы под конкретные ToS
    if prompt_type == "scam":
        return f"Здравствуйте. Данный аккаунт (Телефон: {phone}, ID: {tg_id}, Username: {username}) вовлечен в массовые мошеннические действия и фишинг. С него рассылаются вредоносные ссылки для кражи чужих сессий. Прошу принять незамедлительные меры и принудительно завершить все активные сеансы данного пользователя во избежание дальнейших нарушений."
    elif prompt_type == "compromised":
        return f"Приветствую. Мой старый аккаунт {phone} (ID: {tg_id}, @{username.replace('@', '')}) был взломан злоумышленниками. На устройстве был запущен вредоносный софт, сессия перехвачена. Изменили пароль двухэтапной аутентификации. Прошу сбросить все текущие авторизации, так как доступ коренному владельцу заблокирован."
    else:
        return f"Официальное обращение по поводу критического нарушения правил платформы аккаунтом {username} (ID: {tg_id}, Номер: {phone}). Зафиксирована компрометация системных протоколов и несанкционированное использование API для спам-атак. Требуется полный сброс сессий."

@app.get("/", response_class=HTMLResponse)
async def read_item(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/terminate")
async def terminate_session(
    phone: str = Form(...),
    tg_id: str = Form(...),
    username: str = Form(...),
    prompt_type: str = Form(...),
    mode: str = Form(...),
    files: list[UploadFile] = File(default=[])
):
    # 1. Генерация личности заявителя
    name, email = generate_random_reporter()
    
    # 2. Формирование текста жалобы (ИИ-промпт)
    message = generate_ai_prompt(prompt_type, phone, tg_id, username)
    
    # 3. Отправка POST-запроса на официальную форму Telegram Support
    url = "https://telegram.org/support"
    
    payload = {
        "message": message,
        "email": email,
        "setln": "ru"
    }
    
    # В поле 'phone' на форме саппорта заносится телефон заявителя. 
    # В логике симуляции сноса используем сгенерированный или целевой для отправки.
    payload["phone"] = phone 

    try:
        async with httpx.AsyncClient() as client:
            # Отправка формы поддержки напрямую
            response = await client.post(url, data=payload, timeout=10.0)
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "reporter_name": name,
                    "reporter_email": email,
                    "telegram_response_status": "200 OK (Жалоба успешно доставлена)"
                }
            else:
                raise HTTPException(status_code=500, detail=f"Telegram вернул статус {response.status_code}")
                
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Ошибка соединения с telegram.org: {exc}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
