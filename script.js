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

  // Сбрасываем позицию прокрутки текстового блока
  const textContainer = document.getElementById("text-container");
  textContainer.scrollTop = 0;

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

  // Добавляем обертку для текста
  const textWrapper = document.createElement("div");
  textWrapper.classList.add("text-wrapper");

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
    textWrapper.appendChild(wordSpan);
    if (index < words.length - 1) {
      const spaceDiv = document.createElement("span");
      spaceDiv.classList.add("letter");
      spaceDiv.textContent = " ";
      spaceDiv.setAttribute("data-letter", " ");
      textWrapper.appendChild(spaceDiv);
    }
  });

  textContainer.appendChild(textWrapper);
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

  // Показываем блок статистики
  const stats = document.getElementById("stats");
  stats.style.display = "block";
  stats.classList.add("stats-active");

  // Генерируем новый текст
  if (!isCustomText) {
    currentText = getRandomSentences(currentTopic, 1);
  }
  displayText(currentText);

  document.getElementById("progress-bar-container").style.display = "none";
  document.getElementById("timer").style.display = "none";

  // Не устанавливаем startTime здесь
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
      startTime = Date.now(); // Устанавливаем startTime при первом нажатии
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

      // Добавляем автоматическую прокрутку
      autoScroll();
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

  // Показываем блок статистики
  const stats = document.getElementById("stats");
  stats.style.display = "block";
  stats.classList.add("stats-active");

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

  // Добавляем класс timer-mode сразу при запуске режима
  document.querySelector(".text-container").classList.add("timer-mode");

  // Не устанавливаем startTime здесь
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
      startTime = Date.now(); // Устанавливаем startTime при первом нажатии
      startTimer(seconds); // Запускаем таймер при первом нажатии
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

      // Добавляем автоматическую прокрутку
      autoScroll();
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

  // Скрываем блок статистики
  document.getElementById("stats").style.display = "none";

  // Удаляем класс режима таймера
  document.querySelector(".text-container").classList.remove("timer-mode");

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

// Функция для автоматической прокрутки
function autoScroll() {
  const textContainer = document.getElementById("text-container");
  const currentLetter = letters[currentIndex];

  if (currentLetter) {
    const containerRect = textContainer.getBoundingClientRect();
    const letterRect = currentLetter.getBoundingClientRect();

    // Проверяем, находится ли текущая буква ниже видимой области
    if (letterRect.bottom > containerRect.bottom) {
      // Вычисляем, насколько нужно прокрутить
      const scrollAmount = letterRect.bottom - containerRect.bottom + 50;
      textContainer.scrollTop += scrollAmount;
    }
  }
}

// Обработчик для отключения прокрутки пробелом
document.addEventListener("DOMContentLoaded", function () {
  const textContainer = document.getElementById("text-container");

  textContainer.addEventListener("keydown", function (e) {
    if (e.key === " ") {
      e.preventDefault();
    }
  });
});

// Функционал для виртуальной клавиатуры
document.addEventListener("DOMContentLoaded", function () {
  const virtualKeyboardContainer = document.getElementById(
    "virtual-keyboard-container"
  );
  const keyboardToggle = document.getElementById("keyboard-toggle");
  const settingsButton = document.getElementById("settings-button");
  const virtualKeys = document.querySelectorAll(".virtual-key");

  // Проверяем сохраненное состояние клавиатуры
  const keyboardVisible = localStorage.getItem("keyboardVisible") !== "false";
  virtualKeyboardContainer.style.display = keyboardVisible ? "block" : "none";

  // Обработчик для кнопки переключения в левом углу (скрыта)
  if (keyboardToggle) {
    keyboardToggle.style.display = "none"; // Скрываем кнопку
  }

  // Обработчик для кнопки переключения в правом углу (бывшая кнопка настроек)
  settingsButton.addEventListener("click", function () {
    const isVisible = virtualKeyboardContainer.style.display !== "none";
    virtualKeyboardContainer.style.display = isVisible ? "none" : "block";
    localStorage.setItem("keyboardVisible", !isVisible);
  });

  // Карта соответствия английских клавиш русским
  const engToRusMap = {
    q: "й",
    w: "ц",
    e: "у",
    r: "к",
    t: "е",
    y: "н",
    u: "г",
    i: "ш",
    o: "щ",
    p: "з",
    "[": "х",
    "]": "ъ",
    a: "ф",
    s: "ы",
    d: "в",
    f: "а",
    g: "п",
    h: "р",
    j: "о",
    k: "л",
    l: "д",
    ";": "ж",
    "'": "э",
    z: "я",
    x: "ч",
    c: "с",
    v: "м",
    b: "и",
    n: "т",
    m: "ь",
    ",": "б",
    ".": "ю",
    "/": ".",
  };

  // Обработчик нажатия клавиш
  document.addEventListener("keydown", function (event) {
    const key = event.key.toLowerCase();

    // Проверяем, есть ли соответствие в карте или используем ключ как есть
    const mappedKey = engToRusMap[key] || key;

    // Находим соответствующую клавишу на виртуальной клавиатуре
    virtualKeys.forEach((virtualKey) => {
      const keyValue = virtualKey.getAttribute("data-key").toLowerCase();
      if (keyValue === mappedKey || keyValue === key) {
        virtualKey.classList.add("active");
      }
    });

    // Обработка специальных клавиш
    if (key === " ") {
      const spaceKey = document.querySelector('.virtual-key[data-key=" "]');
      if (spaceKey) spaceKey.classList.add("active");
    }

    // Обработка модификаторов
    if (event.ctrlKey) {
      document
        .querySelectorAll('.virtual-key[data-key="Control"]')
        .forEach((key) => {
          key.classList.add("active");
        });
    }
    if (event.altKey) {
      document
        .querySelectorAll('.virtual-key[data-key="Alt"]')
        .forEach((key) => {
          key.classList.add("active");
        });
    }
  });

  // Обработчик отпускания клавиш
  document.addEventListener("keyup", function (event) {
    const key = event.key.toLowerCase();

    // Проверяем, есть ли соответствие в карте или используем ключ как есть
    const mappedKey = engToRusMap[key] || key;

    // Находим соответствующую клавишу на виртуальной клавиатуре
    virtualKeys.forEach((virtualKey) => {
      const keyValue = virtualKey.getAttribute("data-key").toLowerCase();
      if (keyValue === mappedKey || keyValue === key) {
        virtualKey.classList.remove("active");
      }
    });

    // Обработка специальных клавиш
    if (key === " ") {
      const spaceKey = document.querySelector('.virtual-key[data-key=" "]');
      if (spaceKey) spaceKey.classList.remove("active");
    }

    // Обработка модификаторов
    if (!event.ctrlKey) {
      document
        .querySelectorAll('.virtual-key[data-key="Control"]')
        .forEach((key) => {
          key.classList.remove("active");
        });
    }
    if (!event.altKey) {
      document
        .querySelectorAll('.virtual-key[data-key="Alt"]')
        .forEach((key) => {
          key.classList.remove("active");
        });
    }
  });
});

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

// Логика для логотипов при инициализации
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
