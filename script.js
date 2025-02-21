let currentTopic = "science";
let timerInterval;
let startTime;
let totalCorrect = 0;
let totalTyped = 0;
const missedKeys = new Set();
let isFirstKeyPressed = false;
let currentIndex = 0;
let letters = [];
let keydownHandler;
let isGameActive = false;
let currentText = "";
let currentMode = "normal"; // "normal" или "timed"
let currentTimerDuration = 0;
let customText = "";
let isCustomText = false;

// Настройки по умолчанию
let settings = {
  fontSize: 24,
  fontFamily: "Montserrat",
  underline: "none",
};

function repeatGame() {
  const resultOverlay = document.getElementById("result-overlay");
  resultOverlay.style.display = "none";

  const keys = document.querySelectorAll(".key");
  keys.forEach((key) => key.classList.remove("missed"));

  if (isCustomText) {
    startGameWithText(customText);
  } else if (currentMode === "normal") {
    startNormalMode();
  } else if (currentMode === "timed") {
    startTimedMode(currentTimerDuration);
  }
}

// Функция для сброса всех значений
function resetAllValues() {
  clearInterval(timerInterval);
  document.getElementById("progress-bar-container").style.display = "none";
  document.getElementById("timer").style.display = "none";
  document.getElementById("text-container").innerHTML = "";
  document.getElementById("wpm").textContent = 0;
  document.getElementById("cpm").textContent = 0;
  document.getElementById("accuracy").textContent = "100%";
  totalCorrect = 0;
  totalTyped = 0;
  missedKeys.clear();
  isFirstKeyPressed = false;
  currentIndex = 0;
  letters = [];
  isGameActive = false;
  resetWelcomeMessage();

  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }
}

// Функция для сброса приветственного сообщения
function resetWelcomeMessage() {
  const initialText =
    "Добро пожаловать на сайт теста скорости печати! Здесь вы можете улучшить свои навыки печати. Начните с выбора режима ниже.";
  const readyText = "Приготовьтесь! Поехали!";
  const textContainer = document.getElementById("text-container");
  textContainer.innerHTML = `
${initialText}
<div class="ready-text">${readyText}</div>
`;
  applySettings();
}
// Функция для скрытия кнопок выбора режима
function hideButtons() {
  const buttons = document.getElementById("buttons");
  buttons.style.display = "none";
}

// Функция для показа кнопок выбора режима
function showButtons() {
  const buttons = document.getElementById("buttons");
  buttons.style.display = "flex";
}

// Функция для выбора случайных предложений
function getRandomSentences(topic, count) {
  const sentences = topics[topic] || topics.science;
  const shuffled = sentences.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join(" ");
}

// Функция для отображения текста на странице
function displayText(text) {
  const textContainer = document.getElementById("text-container");
  textContainer.innerHTML = "";
  const words = text.split(" ");
  words.forEach((word, index) => {
    const wordSpan = document.createElement("span");
    wordSpan.classList.add("word");
    word.split("").forEach((char) => {
      const letterDiv = document.createElement("span");
      letterDiv.classList.add("letter");
      letterDiv.textContent = char === " " ? " " : char;
      letterDiv.setAttribute("data-letter", char.toLowerCase());
      wordSpan.appendChild(letterDiv);
    });
    textContainer.appendChild(wordSpan);
    if (index < words.length - 1) {
      const spaceDiv = document.createElement("span");
      spaceDiv.classList.add("letter");
      spaceDiv.textContent = " ";
      spaceDiv.setAttribute("data-letter", " ");
      textContainer.appendChild(spaceDiv);
    }
  });
  applySettings();
}

function selectTopic(topic) {
  if (isCustomText) return; // Не меняем тему, если используется пользовательский текст
  currentTopic = topic;
  if (isGameActive) {
    continueGame();
  }
}

// Функция для отображения результатов
function showResults(wpm, cpm, accuracy) {
  const resultOverlay = document.getElementById("result-overlay");
  const resultWpm = document.getElementById("result-wpm");
  const resultCpm = document.getElementById("result-cpm");
  const resultAccuracy = document.getElementById("result-accuracy");
  const chartProgress = document.querySelector(".chart-progress");
  const chartText = document.querySelector(".chart-text");

  resultWpm.textContent = wpm;
  resultCpm.textContent = cpm;
  resultAccuracy.textContent = `${accuracy}%`;

  const offset = 283 - (accuracy / 100) * 283;
  chartProgress.style.strokeDashoffset = offset;
  chartText.textContent = `${accuracy}%`;

  const keys = document.querySelectorAll(".key");
  keys.forEach((key) => {
    if (missedKeys.has(key.getAttribute("data-key"))) {
      key.classList.add("missed");
    }
  });

  resultOverlay.style.display = "flex";
}

// Функция для завершения игры
function endGame() {
  const timeElapsed = (Date.now() - startTime) / 1000 / 60;
  const wpm = Math.round(totalCorrect / 5 / timeElapsed);
  const cpm = Math.round(totalCorrect / timeElapsed);
  const accuracy =
    totalTyped === 0 ? 100 : Math.round((totalCorrect / totalTyped) * 100);

  showResults(wpm, cpm, accuracy);
}

// Функция для обновления статистики
function updateStats() {
  const timeElapsed = (Date.now() - startTime) / 1000 / 60;
  const wpm = Math.round(totalCorrect / 5 / timeElapsed);
  const cpm = Math.round(totalCorrect / timeElapsed);
  const accuracy =
    totalTyped === 0 ? 100 : Math.round((totalCorrect / totalTyped) * 100);

  document.getElementById("wpm").textContent = wpm;
  document.getElementById("cpm").textContent = cpm;
  document.getElementById("accuracy").textContent = `${accuracy}%`;
}

// Функция для запуска обычного режима
function startNormalMode() {
  isGameActive = true;
  hideButtons();
  resetAllValues();

  // Генерируем новый текст
  if (!isCustomText) {
    currentText = getRandomSentences(currentTopic, 1);
  }
  displayText(currentText);

  document.getElementById("progress-bar-container").style.display = "none";
  document.getElementById("timer").style.display = "none";

  startTime = Date.now();
  totalCorrect = 0;
  totalTyped = 0;
  missedKeys.clear();
  isFirstKeyPressed = false;
  currentIndex = 0;
  letters = document.querySelectorAll(".letter");
  currentMode = "normal";
  currentTimerDuration = 0;

  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }

  keydownHandler = (event) => {
    if (currentIndex >= letters.length) return;
    if (event.key === "Shift") return;

    if (!isFirstKeyPressed) {
      isFirstKeyPressed = true;
      startTime = Date.now();
    }

    const currentLetter = letters[currentIndex];
    const expectedLetter = currentLetter
      .getAttribute("data-letter")
      .toLowerCase();
    const pressedLetter = event.key.toLowerCase();

    totalTyped++;

    if (pressedLetter === expectedLetter) {
      currentLetter.classList.remove("incorrect");
      currentLetter.classList.add("correct");
      currentIndex++;
      totalCorrect++;
    } else {
      currentLetter.classList.add("incorrect");
      missedKeys.add(expectedLetter);
    }

    updateStats();

    if (currentIndex >= letters.length) {
      endGame();
    }
  };

  document.addEventListener("keydown", keydownHandler);
}
// Функция для запуска режима на время
function startTimedMode(seconds) {
  isGameActive = true;
  hideButtons();
  resetAllValues();

  const timerButtons = document.getElementById("timer-buttons");
  timerButtons.style.display = "none";

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Генерируем новый текст
  if (!isCustomText) {
    currentText = getRandomSentences(currentTopic, 5);
  }
  displayText(currentText);

  document.getElementById("progress-bar-container").style.display = "block";
  document.getElementById("timer").style.display = "block";

  document.getElementById("timer").textContent = `${seconds}сек`;

  startTime = Date.now();
  totalCorrect = 0;
  totalTyped = 0;
  missedKeys.clear();
  isFirstKeyPressed = false;
  currentIndex = 0;
  letters = document.querySelectorAll(".letter");
  currentMode = "timed";
  currentTimerDuration = seconds;

  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }

  keydownHandler = (event) => {
    if (currentIndex >= letters.length) return;
    if (event.key === "Shift") return;

    if (!isFirstKeyPressed) {
      isFirstKeyPressed = true;
      startTimer(seconds);
    }

    const currentLetter = letters[currentIndex];
    const expectedLetter = currentLetter
      .getAttribute("data-letter")
      .toLowerCase();
    const pressedLetter = event.key.toLowerCase();

    totalTyped++;

    if (pressedLetter === expectedLetter) {
      currentLetter.classList.remove("incorrect");
      currentLetter.classList.add("correct");
      currentIndex++;
      totalCorrect++;
    } else {
      currentLetter.classList.add("incorrect");
      missedKeys.add(expectedLetter);
    }

    updateStats();
  };

  document.addEventListener("keydown", keydownHandler);
}

// Функция для запуска таймера
function startTimer(seconds) {
  let timeLeft = seconds;
  const progressBarFill = document.getElementById("progress-bar-fill");
  progressBarFill.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `${timeLeft}сек`;
    progressBarFill.style.width = `${(timeLeft / seconds) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Функция для продолжения игры
function continueGame() {
  const resultOverlay = document.getElementById("result-overlay");
  resultOverlay.style.display = "none";

  const keys = document.querySelectorAll(".key");
  keys.forEach((key) => key.classList.remove("missed"));

  isGameActive = false;
  resetAllValues();

  // Сбрасываем текст и показываем приветственное окно
  currentText = "";
  resetWelcomeMessage();
  showButtons();

  // Восстанавливаем выбранный предмет
  const savedSubject = localStorage.getItem("selectedSubject") || "math";
  document.querySelectorAll(".subject-item").forEach((i) => {
    i.classList.remove("active-subject");
  });
  document
    .querySelector(`[data-subject="${savedSubject}"]`)
    .classList.add("active-subject");

  // Если был режим "Свой текст", сбрасываем его
  if (isCustomText) {
    isCustomText = false;
    customText = "";
  }
}

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
  // Добавляем обработчики для предметов
  document.querySelectorAll(".subject-item").forEach((item) => {
    item.addEventListener("click", function () {
      // Удаляем класс у всех предметов
      document.querySelectorAll(".subject-item").forEach((i) => {
        i.classList.remove("active-subject");
      });

      // Добавляем класс выбранному
      this.classList.add("active-subject");

      // Логика выбора темы
      const subject = this.dataset.subject;
      currentTopic = subject;
      localStorage.setItem("selectedSubject", subject);

      if (isGameActive) {
        continueGame();
      }
    });
  });

  // Инициализация при загрузке
  const savedSubject = localStorage.getItem("selectedSubject") || "math";
  document
    .querySelector(`[data-subject="${savedSubject}"]`)
    .classList.add("active-subject");
  currentTopic = savedSubject;
});

// Функция для переключения отображения кнопок таймера
function toggleTimerButtons() {
  const timerButtons = document.getElementById("timer-buttons");
  timerButtons.style.display =
    timerButtons.style.display === "flex" ? "none" : "flex";
}

// Отключаем активацию кнопок пробелом
document.addEventListener("keydown", (event) => {
  if (event.key === " " && event.target.tagName === "BUTTON") {
    event.preventDefault();
  }
});

// Функция для открытия настроек
function openSettings() {
  const settingsOverlay = document.getElementById("settings-overlay");
  settingsOverlay.style.display = "flex";

  document.getElementById("font-size").value = settings.fontSize;
  document.getElementById("font-color").value = settings.fontColor;
  document.getElementById("font-family").value = settings.fontFamily;
  document.getElementById("underline").value = settings.underline;
}

// Функция для закрытия настроек
function closeSettings() {
  const settingsOverlay = document.getElementById("settings-overlay");
  settingsOverlay.style.display = "none";
}

// Функция для сохранения настроек
function saveSettings() {
  settings.fontSize = document.getElementById("font-size").value;
  settings.fontColor = document.getElementById("font-color").value;
  settings.fontFamily = document.getElementById("font-family").value;
  settings.underline = document.getElementById("underline").value;

  applySettings();
  closeSettings();
}

// Функция для применения настроек
function applySettings() {
  const textContainer = document.getElementById("text-container");
  textContainer.style.fontSize = `${settings.fontSize}px`;
  textContainer.style.color = settings.fontColor;
  textContainer.style.fontFamily = settings.fontFamily;

  const letters = document.querySelectorAll(".letter");
  letters.forEach((letter) => {
    letter.style.borderBottom =
      settings.underline === "underline" ? "2px solid #ffffff" : "none";
  });
}

function openCustomTextModal() {
  document.getElementById("custom-text-overlay").style.display = "flex";
  document.getElementById("custom-text-input").value = "";
}

function closeCustomTextModal() {
  document.getElementById("custom-text-overlay").style.display = "none";
}

function startWithCustomText() {
  customText = document.getElementById("custom-text-input").value.trim();
  if (!customText) return;

  isCustomText = true;
  closeCustomTextModal();
  startGameWithText(customText);
}

// Обновленная функция для запуска игры с текстом
function startGameWithText(text) {
  isGameActive = true;
  hideButtons();
  resetAllValues();

  currentText = text;
  displayText(text);
  document.getElementById("progress-bar-container").style.display = "none";
  document.getElementById("timer").style.display = "none";

  totalCorrect = 0;
  totalTyped = 0;
  missedKeys.clear();
  isFirstKeyPressed = false;
  currentIndex = 0;
  letters = document.querySelectorAll(".letter");

  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }

  keydownHandler = (event) => {
    if (currentIndex >= letters.length) return;
    if (event.key === "Shift") return;

    if (!isFirstKeyPressed) {
      isFirstKeyPressed = true;
      startTime = Date.now();
    }

    const currentLetter = letters[currentIndex];
    const expectedLetter = currentLetter
      .getAttribute("data-letter")
      .toLowerCase();
    const pressedLetter = event.key.toLowerCase();

    totalTyped++;

    if (pressedLetter === expectedLetter) {
      currentLetter.classList.remove("incorrect");
      currentLetter.classList.add("correct");
      currentIndex++;
      totalCorrect++;
    } else {
      currentLetter.classList.add("incorrect");
      missedKeys.add(expectedLetter);
    }

    updateStats();

    if (currentIndex >= letters.length) {
      endGame();
    }
  };

  document.addEventListener("keydown", keydownHandler);
}

// Инициализация начального текста
resetWelcomeMessage();

// Функции для работы с темами
function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  const allMenus = document.querySelectorAll(".dropdown-menu");

  // Закрываем все другие меню
  allMenus.forEach((m) => {
    if (m.id !== menuId) {
      m.classList.remove("active");
    }
  });

  // Переключаем текущее меню
  menu.classList.toggle("active");
}

function selectDesignTheme(theme) {
  document.body.className = "";
  document.body.classList.add(`theme-${theme}`);
  localStorage.setItem("designTheme", theme);
  // Удаляем классы у всех тем
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.classList.remove("active-theme");
  });

  // Добавляем класс выбранной теме
  const activeThemeBtn = document.querySelector(
    `.theme-option[data-theme="${theme}"]`
  );
  if (activeThemeBtn) {
    activeThemeBtn.classList.add("active-theme");
  }

  // Применяем тему
  document.body.className = `theme-${theme}`;
  localStorage.setItem("designTheme", theme);

  // Логика для логотипов
  const defaultLogo = document.querySelector(".default-logo");
  const ussrLogo = document.querySelector(".ussr-logo");

  if (theme === "ussr") {
    defaultLogo.style.display = "none";
    ussrLogo.style.display = "block";
  } else {
    defaultLogo.style.display = "block";
    ussrLogo.style.display = "none";
  }
}
// Инициализация темы
const savedTheme = localStorage.getItem("designTheme") || "dark";
document
  .querySelector(`.theme-option[data-theme="${savedTheme}"]`)
  ?.classList.add("active-theme");
selectDesignTheme(savedTheme);

// Инициализация предмета
const savedSubject = localStorage.getItem("selectedSubject") || "math";
document
  .querySelector(`[data-subject="${savedSubject}"]`)
  ?.classList.add("active-subject");
currentTopic = savedSubject;
let currentDesignTheme = localStorage.getItem("designTheme") || "dark";
document.body.classList.add(`theme-${currentDesignTheme}`);
// После let currentDesignTheme = ... добавьте:
const defaultLogo = document.querySelector(".default-logo");
const ussrLogo = document.querySelector(".ussr-logo");

if (currentDesignTheme === "ussr") {
  defaultLogo.style.display = "none";
  ussrLogo.style.display = "block";
} else {
  defaultLogo.style.display = "block";
  ussrLogo.style.display = "none";
}
// Добавляем общую функцию закрытия
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu.active").forEach((menu) => {
    menu.classList.remove("active");
  });
}

// Получаем элементы
const sidebar = document.getElementById("sidebar"); // предполагаем что есть id="sidebar"

// Обработчик для сайдбара
sidebar.addEventListener("mouseleave", (e) => {
  // Проверяем что курсор не перешёл в меню
  if (!e.relatedTarget || !sidebar.contains(e.relatedTarget)) {
    closeAllDropdowns();
  }
});

// Обработчик для самих меню
document.querySelectorAll(".dropdown-menu").forEach((menu) => {
  menu.addEventListener("mouseleave", (e) => {
    // Проверяем что курсор не вернулся в сайдбар
    if (!e.relatedTarget || !sidebar.contains(e.relatedTarget)) {
      closeAllDropdowns();
    }
  });
});

// Оставляем обработчик кликов для других случаев
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-button") && !e.target.closest(".dropdown-menu")) {
    closeAllDropdowns();
  }
});

// Обновленный обработчик для сайдбара
sidebar.addEventListener("mouseleave", (e) => {
  // Закрываем все выпадающие меню
  closeAllDropdowns();
  // Сбрасываем состояние уроков
  document.getElementById("lessons-toggle").checked = false;
  // Скрываем стрелки
  document.querySelectorAll(".dropdown-arrow").forEach((arrow) => {
    arrow.style.transform = "rotate(0deg)";
  });
  // Скрываем панель предметов
  document.querySelectorAll(".subjects-panel").forEach((panel) => {
    panel.style.maxHeight = "0";
  });
});

// Функция для открытия модального окна с информацией
function openInfoModal() {
  const infoOverlay = document.createElement("div");
  infoOverlay.classList.add("info-overlay");
  infoOverlay.innerHTML = `
    <div class="info-content">
      <h2>Информация</h2>
      <p>Участник конкурса "КРИТ-2025" Нуртдинов Шамиль приветствует жюри конкурса!</p>
      <button onclick="closeInfoModal()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(infoOverlay);
}

// Функция для закрытия модального окна с информацией
function closeInfoModal() {
  const infoOverlay = document.querySelector(".info-overlay");
  if (infoOverlay) {
    document.body.removeChild(infoOverlay);
  }
}
