import telebot
from yandex_music import Client
import requests
from bs4 import BeautifulSoup
import os
import time
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC
from telebot.types import InputFile, InlineKeyboardMarkup, InlineKeyboardButton, InlineQueryResultAudio

# === Конфигурация ===
TOKEN = '6564898561:AAG2JnKRig25TcXqMBUz02gqfb4jdnRSBmg'
YANDEX_TOKEN = 'y0__xC-sJzQBhje-AYgm6Gt3xJd1Jx02MpKJGOx2jgqjkQWxNjebQ'
VK_ACCESS_TOKEN = 'vk1.a.6N_2sON3JZvGmIBJkwJJIgu_QpOrFOsrxtnsI7DBIhW9iR2__NeQikUVvgOCrfh2TZZ4rbkzZ5VaOJ0nThDUD1RedH3mn81KVANSAiHhJTJGWYAiwupuQeQjhXN1mLqwxT6zDdma1jBiOwcVP5DspC5uWsWE7T75BDIi2-mKdlOHp0N-H5xXV_cYrzdZgbiUk-KdFOdSLMfx5VvGKmBwQQ'
RAPIDAPI_KEY = 'b7b2b1d99emsh97b71534fab38d6p159d61jsna966cc8c7175'

bot = telebot.TeleBot(TOKEN)
client = Client(YANDEX_TOKEN).init()

# === Вспомогательные функции ===

def get_vk_track_info(vk_url):
    try:
        audio_id = vk_url.split('audio')[1].split('?')[0].strip('/')
        api_url = f"https://api.vk.com/method/audio.getById?audios={audio_id}&access_token={VK_ACCESS_TOKEN}&v=5.131"
        response = requests.get(api_url).json()
        if "response" in response:
            track_info = response['response'][0]
            return f"{track_info['artist']} - {track_info['title']}"
    except Exception as e:
        print(f"Ошибка VK: {e}")
    return None

def extract_youtube_id(url):
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0]
    elif 'youtube.com/watch?v=' in url:
        return url.split('v=')[1].split('&')[0]
    return None

def download_track_by_id(track_id, chat_id):
    try:
        track = client.tracks(track_id)[0]
        title = f"{track.title} - {', '.join(track.artists_name())}"
        download_url = track.get_download_info()[0].get_direct_link()
        filename = f"{title}.mp3"

        r = requests.get(download_url)
        with open(filename, 'wb') as f:
            f.write(r.content)

        cover_path = None
        if track.cover_uri:
            cover_url = f"https://{track.cover_uri.replace('%%', '300x300')}"
            cover_path = f"{title}_cover.jpg"
            r = requests.get(cover_url)
            with open(cover_path, 'wb') as f:
                f.write(r.content)

            audio = MP3(filename, ID3=ID3)
            if audio.tags is None:
                audio.add_tags()
            with open(cover_path, 'rb') as img:
                audio.tags.add(APIC(encoding=3, mime='image/jpeg', type=3, desc='Cover', data=img.read()))
            audio.save()

        with open(filename, 'rb') as audio:
            if cover_path:
                with open(cover_path, 'rb') as thumb:
                    bot.send_audio(chat_id, audio, title=title, thumb=InputFile(thumb))
                os.remove(cover_path)
            else:
                bot.send_audio(chat_id, audio, title=title)
        os.remove(filename)

    except Exception as e:
        bot.send_message(chat_id, f"❌ Ошибка при скачивании: {str(e)}")

def search_and_download(text, chat_id):
    try:
        result = client.search(text, type_='track')
        if not result.tracks or not result.tracks.results:
            bot.send_message(chat_id, "❗ Не найдено в Яндекс.Музыке")
            return
        track = result.tracks.results[0]
        download_track_by_id(track.id, chat_id)
    except Exception as e:
        bot.send_message(chat_id, f"Ошибка при поиске: {str(e)}")

# === Обработчики сообщений ===

@bot.message_handler(commands=['start'])
def start(message):
    bot.reply_to(message, "Привет! Отправь ссылку на трек Яндекс.Музыки, Spotify, ВКонтакте или YouTube. Я скачаю его 🎶")

@bot.message_handler(func=lambda msg: 'music.yandex' in msg.text and '/track/' in msg.text)
def handle_yandex(msg):
    chat_id = msg.chat.id
    bot.send_message(chat_id, "🔄 Обрабатываю ссылку Яндекс.Музыки...")
    try:
        track_id = msg.text.split('/track/')[1].split('/')[0].split('?')[0]
        download_track_by_id(track_id, chat_id)
    except:
        bot.send_message(chat_id, "❌ Не удалось распознать ID трека")

@bot.message_handler(func=lambda msg: 'open.spotify.com/track/' in msg.text)
def handle_spotify(msg):
    chat_id = msg.chat.id
    try:
        track_id = msg.text.split("/track/")[1].split("?")[0]
        api_url = f"https://open.spotify.com/oembed?url=https://open.spotify.com/track/{track_id}"
        data = requests.get(api_url).json()
        full_title = data['title']
        bot.send_message(chat_id, f"🔍 Spotify: {full_title}\nИщу в Яндекс.Музыке...")

        result = client.search(full_title, type_='track')
        if not result.tracks or not result.tracks.results:
            bot.send_message(chat_id, "❗ Трек не найден")
            return

        tracks = result.tracks.results[:5]
        markup = InlineKeyboardMarkup()
        for track in tracks:
            artist = ', '.join(track.artists_name())
            text = f"{track.title} — {artist}"
            markup.add(InlineKeyboardButton(text=text, callback_data=f"spotify_select:{track.id}"))

        bot.send_message(chat_id, "🔽 Выбери подходящий трек:", reply_markup=markup)

    except Exception as e:
        bot.send_message(chat_id, f"❌ Ошибка: {str(e)}")

@bot.callback_query_handler(func=lambda call: call.data.startswith("spotify_select:"))
def handle_spotify_selection(call):
    chat_id = call.message.chat.id
    track_id = call.data.split("spotify_select:")[1]
    bot.answer_callback_query(call.id)
    bot.edit_message_text("🎧 Скачиваю выбранный трек...", chat_id, call.message.message_id)
    download_track_by_id(track_id, chat_id)

@bot.message_handler(func=lambda msg: 'vk.com/audio' in msg.text)
def handle_vk(msg):
    chat_id = msg.chat.id
    track_info = get_vk_track_info(msg.text.strip())
    if track_info:
        bot.send_message(chat_id, f"🔎 Найдено: {track_info}\nИщу в Яндекс.Музыке...")
        search_and_download(track_info, chat_id)
    else:
        bot.send_message(chat_id, "⚠️ Не удалось получить данные с ВКонтакте.")

@bot.message_handler(func=lambda msg: 'youtube.com/watch' in msg.text or 'youtu.be/' in msg.text)
def handle_youtube(msg):
    chat_id = msg.chat.id
    url = msg.text.strip()
    bot.send_message(chat_id, "🔄 Обрабатываю ссылку YouTube...")

    try:
        headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com"
        }

        video_id = extract_youtube_id(url)
        api_url = f"https://youtube-mp36.p.rapidapi.com/dl?id={video_id}"
        status_message = bot.send_message(chat_id, "⏳ Ожидаем готовности файла...")

        for i in range(10):
            response = requests.get(api_url, headers=headers)
            data = response.json()
            if data.get("status") == "ok":
                bot.edit_message_text("✅ Готово! Отправляю файл 🎧", chat_id, status_message.message_id)
                break
            elif data.get("status") == "in process":
                bot.edit_message_text(f"⏳ Попытка {i+1}/10...", chat_id, status_message.message_id)
                time.sleep(2)
            else:
                bot.edit_message_text("❌ Не удалось получить mp3.", chat_id, status_message.message_id)
                return
        else:
            bot.edit_message_text("❌ Файл не подготовлен за 20 секунд.", chat_id, status_message.message_id)
            return

        title = data["title"]
        download_url = data["link"]
        filename = f"{title}.mp3"

        r = requests.get(download_url)
        with open(filename, 'wb') as f:
            f.write(r.content)

        cover_path = None
        try:
            cover_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            r = requests.get(cover_url)
            if r.status_code != 200:
                cover_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                r = requests.get(cover_url)
            if r.status_code == 200:
                cover_path = f"{title}_cover.jpg"
                with open(cover_path, 'wb') as f:
                    f.write(r.content)

                audio = MP3(filename, ID3=ID3)
                if audio.tags is None:
                    audio.add_tags()
                with open(cover_path, 'rb') as img:
                    audio.tags.add(APIC(encoding=3, mime='image/jpeg', type=3, desc='Cover', data=img.read()))
                audio.save()
        except:
            pass

        with open(filename, 'rb') as audio_file:
            if cover_path:
                with open(cover_path, 'rb') as thumb:
                    bot.send_audio(chat_id, audio_file, title=title, thumb=InputFile(thumb))
                os.remove(cover_path)
            else:
                bot.send_audio(chat_id, audio_file, title=title)
        os.remove(filename)

    except Exception as e:
        bot.send_message(chat_id, f"⚠️ Ошибка: {str(e)}")

# === Inline режим — один, рабочий ===

@bot.inline_handler(func=lambda query: True)
def inline_query_handler(inline_query):
    query_text = inline_query.query.strip()
    if not query_text:
        return

    try:
        result = client.search(query_text, type_='track')
        if not result.tracks or not result.tracks.results:
            return

        results = []
        for track in result.tracks.results[:5]:
            title = f"{track.title} - {', '.join(track.artists_name())}"
            download_url = track.get_download_info()[0].get_direct_link()

            results.append(InlineQueryResultAudio(
                id=str(track.id),
                audio_url=download_url,
                title=track.title,
                performer=', '.join(track.artists_name())
            ))

        bot.answer_inline_query(inline_query.id, results, cache_time=1)

    except Exception as e:
        print(f"Ошибка inline-запроса: {e}")

# === Запуск ===

if __name__ == "__main__":
    bot.polling(none_stop=True)
