    <script>
      // Функционал для виртуальной клавиатуры
      document.addEventListener("DOMContentLoaded", function () {
        const virtualKeyboardContainer = document.getElementById(
          "virtual-keyboard-container"
        );
        const keyboardToggle = document.getElementById("keyboard-toggle");
        const settingsButton = document.getElementById("settings-button");
        const virtualKeys = document.querySelectorAll(".virtual-key");

        // Проверяем сохраненное состояние клавиатуры
        const keyboardVisible =
          localStorage.getItem("keyboardVisible") !== "false";
        virtualKeyboardContainer.style.display = keyboardVisible
          ? "block"
          : "none";

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
            const spaceKey = document.querySelector(
              '.virtual-key[data-key=" "]'
            );
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
            const spaceKey = document.querySelector(
              '.virtual-key[data-key=" "]'
            );
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
    </script>

    <!-- Добавляем обработчик для отключения прокрутки пробелом -->
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        const textContainer = document.getElementById("text-container");

        textContainer.addEventListener("keydown", function (e) {
          if (e.key === " ") {
            e.preventDefault();
          }
        });
      });
    </script>
