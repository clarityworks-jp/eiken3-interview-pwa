(function () {
  "use strict";

  const STORAGE_KEY = "eiken3ImportedQuestionSets";
  const TYPE_LABELS = {
    passage: "本文",
    picture: "イラスト",
    personal: "自分のこと",
    opinion: "意見"
  };
  const IMPORTED_SCENE_RENDERERS = {
    set101: createGenericSceneSvg,
    set102: createGenericSceneSvg,
    set103: createNewBikeSvg,
    set104: createGenericSceneSvg,
    set105: createGenericSceneSvg,
    set106: createGenericSceneSvg,
    set107: createGenericSceneSvg,
    set108: createGenericSceneSvg,
    set109: createGenericSceneSvg,
    set110: createGenericSceneSvg
  };

  const state = {
    initialSets: Array.isArray(window.INITIAL_QUESTION_SETS) ? window.INITIAL_QUESTION_SETS : [],
    importedSets: [],
    allSets: [],
    currentSetIndex: 0,
    currentQuestionIndex: 0
  };

  const elements = {
    setSelect: document.getElementById("setSelect"),
    setTitle: document.getElementById("setTitle"),
    sourceBadge: document.getElementById("sourceBadge"),
    illustration: document.getElementById("illustration"),
    picturePoints: document.getElementById("picturePoints"),
    togglePicturePointsButton: document.getElementById("togglePicturePointsButton"),
    picturePointsPanel: document.getElementById("picturePointsPanel"),
    picturePointsList: document.getElementById("picturePointsList"),
    passageList: document.getElementById("passageList"),
    questionCounter: document.getElementById("questionCounter"),
    questionType: document.getElementById("questionType"),
    questionTextPanel: document.getElementById("questionTextPanel"),
    questionText: document.getElementById("questionText"),
    hintPanel: document.getElementById("hintPanel"),
    hintText: document.getElementById("hintText"),
    answerPanel: document.getElementById("answerPanel"),
    sampleAnswer: document.getElementById("sampleAnswer"),
    levelCheckList: document.getElementById("levelCheckList"),
    statusMessage: document.getElementById("statusMessage"),
    speakPassageButton: document.getElementById("speakPassageButton"),
    speakQuestionButton: document.getElementById("speakQuestionButton"),
    speakAnswerButton: document.getElementById("speakAnswerButton"),
    stopSpeechButton: document.getElementById("stopSpeechButton"),
    toggleQuestionButton: document.getElementById("toggleQuestionButton"),
    toggleHintButton: document.getElementById("toggleHintButton"),
    toggleAnswerButton: document.getElementById("toggleAnswerButton"),
    prevQuestionButton: document.getElementById("prevQuestionButton"),
    nextQuestionButton: document.getElementById("nextQuestionButton"),
    jsonFileInput: document.getElementById("jsonFileInput"),
    clearImportedButton: document.getElementById("clearImportedButton")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    state.importedSets = readImportedSets();
    refreshSets();
    bindEvents();
    render();
    registerServiceWorker();
  }

  function bindEvents() {
    elements.setSelect.addEventListener("change", function () {
      state.currentSetIndex = Number(elements.setSelect.value);
      state.currentQuestionIndex = 0;
      cancelSpeech();
      render();
    });

    elements.speakPassageButton.addEventListener("click", function () {
      const set = getCurrentSet();
      speak(set.passage.join(" "), "en-US", getSpeechRate());
    });

    elements.speakQuestionButton.addEventListener("click", function () {
      const question = getCurrentQuestion();
      speak(question.question, "en-US", getSpeechRate());
    });

    elements.speakAnswerButton.addEventListener("click", function () {
      const question = getCurrentQuestion();
      showAnswer();
      speak(question.sampleAnswer, "en-US", getSpeechRate());
    });

    elements.stopSpeechButton.addEventListener("click", cancelSpeech);

    elements.togglePicturePointsButton.addEventListener("click", function () {
      const isHidden = elements.picturePointsPanel.hidden;
      elements.picturePointsPanel.hidden = !isHidden;
      elements.togglePicturePointsButton.setAttribute("aria-expanded", String(isHidden));
      elements.togglePicturePointsButton.textContent = isHidden ? "イラストのポイントを隠す" : "イラストのポイントを表示";
    });

    elements.toggleQuestionButton.addEventListener("click", function () {
      const isHidden = elements.questionTextPanel.hidden;
      elements.questionTextPanel.hidden = !isHidden;
      elements.questionTextPanel.setAttribute("aria-hidden", String(!isHidden));
      elements.toggleQuestionButton.setAttribute("aria-expanded", String(isHidden));
      elements.toggleQuestionButton.textContent = isHidden ? "質問文を隠す" : "質問文を表示";
    });

    elements.toggleHintButton.addEventListener("click", function () {
      const isHidden = elements.hintPanel.hidden;
      elements.hintPanel.hidden = !isHidden;
      elements.hintPanel.setAttribute("aria-hidden", String(!isHidden));
      elements.toggleHintButton.setAttribute("aria-expanded", String(isHidden));
      elements.toggleHintButton.textContent = isHidden ? "日本語ヒントを隠す" : "日本語ヒントを表示";
    });

    elements.toggleAnswerButton.addEventListener("click", function () {
      if (elements.answerPanel.hidden) {
        showAnswer();
      } else {
        hideAnswer();
      }
    });

    elements.prevQuestionButton.addEventListener("click", function () {
      state.currentQuestionIndex = Math.max(0, state.currentQuestionIndex - 1);
      cancelSpeech();
      renderQuestion();
    });

    elements.nextQuestionButton.addEventListener("click", function () {
      const lastIndex = getCurrentSet().questions.length - 1;
      state.currentQuestionIndex = Math.min(lastIndex, state.currentQuestionIndex + 1);
      cancelSpeech();
      renderQuestion();
    });

    elements.jsonFileInput.addEventListener("change", handleJsonFile);

    elements.clearImportedButton.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_KEY);
      state.importedSets = [];
      state.currentSetIndex = 0;
      state.currentQuestionIndex = 0;
      refreshSets();
      render();
      setStatus("読み込んだ問題を削除しました。", false);
    });
  }

  function refreshSets() {
    state.allSets = state.initialSets
      .map(function (set) {
        return Object.assign({ source: "initial" }, set);
      })
      .concat(
        state.importedSets.map(function (set) {
          return Object.assign({ source: "imported" }, set);
        })
      );
  }

  function render() {
    renderSetOptions();
    renderCurrentSet();
    renderQuestion();
  }

  function renderSetOptions() {
    elements.setSelect.innerHTML = "";
    state.allSets.forEach(function (set, index) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = set.source === "imported" ? set.title + "（読み込み）" : set.title;
      elements.setSelect.append(option);
    });
    elements.setSelect.value = String(state.currentSetIndex);
  }

  function renderCurrentSet() {
    const set = getCurrentSet();
    if (!set) {
      elements.setTitle.textContent = "問題がありません";
      return;
    }

    elements.setTitle.textContent = set.title;
    elements.sourceBadge.textContent = set.source === "imported" ? "読み込み問題" : "初期問題";
    elements.sourceBadge.classList.toggle("imported", set.source === "imported");

    elements.passageList.innerHTML = "";
    set.passage.forEach(function (sentence) {
      const li = document.createElement("li");
      li.textContent = sentence;
      elements.passageList.append(li);
    });

    renderIllustration(set);
    renderLevelCheck(set.levelCheck);
    elements.clearImportedButton.disabled = state.importedSets.length === 0;
  }

  function renderIllustration(set) {
    elements.illustration.innerHTML = "";
    renderPicturePoints(set.pictureItems);

    if (set.illustration && set.illustration.type === "svg" && typeof set.illustration.svg === "string") {
      elements.illustration.append(sanitizeSvg(set.illustration.svg));
      return;
    }

    elements.illustration.append(createIllustrationSvg(set));
  }

  function renderPicturePoints(pictureItems) {
    const hasItems = Array.isArray(pictureItems) && pictureItems.length > 0;
    elements.picturePoints.hidden = !hasItems;
    elements.picturePointsPanel.hidden = true;
    elements.togglePicturePointsButton.setAttribute("aria-expanded", "false");
    elements.togglePicturePointsButton.textContent = "イラストのポイントを表示";
    elements.picturePointsList.innerHTML = "";

    if (!hasItems) {
      return;
    }

    pictureItems.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      elements.picturePointsList.append(li);
    });
  }

  function createIllustrationSvg(set) {
    const setId = getBaseSetId(set.id);
    const renderer = IMPORTED_SCENE_RENDERERS[setId] || createGenericSceneSvg;
    return sanitizeSvg(renderer(set));
  }

  function getBaseSetId(id) {
    return String(id || "").split("*imported*")[0].replace(/_imported_.+$/, "");
  }

  function createGenericSceneSvg(set) {
    const text = getSceneText(set);
    if (includesAny(text, ["bike", "bicycle", "自転車"])) {
      return createBikeSceneSvg(set);
    }
    if (includesAny(text, ["library", "book", "books", "図書館", "本"])) {
      return createLibrarySceneSvg(set);
    }
    if (includesAny(text, ["park", "tree", "bird", "bench", "公園", "木", "鳥"])) {
      return createParkSceneSvg(set);
    }
    if (includesAny(text, ["soccer", "baseball", "sport", "ball", "サッカー", "野球", "スポーツ", "ボール"])) {
      return createSportsSceneSvg(set);
    }
    if (includesAny(text, ["shop", "store", "shopping", "買い物", "店"])) {
      return createShopSceneSvg(set);
    }
    if (includesAny(text, ["lunch", "food", "plate", "eat", "昼食", "食べ", "皿"])) {
      return createLunchSceneSvg(set);
    }
    return createSimpleSceneSvg(set);
  }

  function createNewBikeSvg(set) {
    return sceneSvg(set, `
      <rect x="44" y="58" width="712" height="318" rx="10" fill="#fff7e9" stroke="#7ba8c0" stroke-width="5"/>
      <rect x="478" y="122" width="134" height="210" fill="#e8d7ba" stroke="#9b8052" stroke-width="5"/>
      <line x1="478" y1="176" x2="612" y2="176" stroke="#9b8052" stroke-width="4"/>
      <line x1="478" y1="230" x2="612" y2="230" stroke="#9b8052" stroke-width="4"/>
      <rect x="645" y="116" width="74" height="110" rx="6" fill="#eaf6ff" stroke="#3e789a" stroke-width="5"/>
      <rect x="654" y="128" width="56" height="30" fill="#ffffff" stroke="#3e789a" stroke-width="3"/>
      <text x="682" y="150" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="#2f6381">BUS</text>
      ${personSvg(654, 246, "#ef8aa5", "girl")}
      ${bikeSvg(150, 285, "#2478a6", true)}
      ${personSvg(212, 215, "#74bf8b", "boy")}
      ${bikeSvg(485, 324, "#d56b62", false)}
      ${bikeSvg(592, 324, "#6b9fd5", false)}
      <rect x="252" y="276" width="58" height="38" rx="7" fill="#d9a14f" stroke="#7d5a27" stroke-width="4"/>
      <path d="M265 276 q16 -26 32 0" fill="none" stroke="#7d5a27" stroke-width="4"/>
      <rect x="268" y="290" width="26" height="14" rx="3" fill="#4c7eb5"/>
      <text x="400" y="446" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#315f7b">A New Bike</text>
    `);
  }

  function createBikeSceneSvg(set) {
    return sceneSvg(set, `
      <rect x="55" y="75" width="690" height="300" rx="10" fill="#fff8e9" stroke="#7ba8c0" stroke-width="5"/>
      <rect x="560" y="135" width="80" height="116" rx="6" fill="#eaf6ff" stroke="#3e789a" stroke-width="5"/>
      <text x="600" y="170" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#2f6381">BUS</text>
      ${bikeSvg(160, 296, "#2478a6", true)}
      ${personSvg(220, 226, "#74bf8b", "boy")}
      ${bikeSvg(450, 324, "#d56b62", false)}
      ${bikeSvg(552, 324, "#6b9fd5", false)}
      <rect x="280" y="286" width="56" height="36" rx="7" fill="#d9a14f" stroke="#7d5a27" stroke-width="4"/>
      ${personSvg(595, 250, "#ef8aa5", "girl")}
      ${sceneCaption(set)}
    `);
  }

  function createLibrarySceneSvg(set) {
    const bookCount = Math.max(2, Math.min(5, getSceneCount(set, 3)));
    return sceneSvg(set, `
      <rect x="60" y="70" width="680" height="305" rx="10" fill="#fff7e8" stroke="#7ba8c0" stroke-width="5"/>
      <rect x="90" y="102" width="170" height="155" rx="4" fill="#d5edf8" stroke="#6f9fba" stroke-width="4"/>
      <line x1="90" y1="153" x2="260" y2="153" stroke="#6f9fba" stroke-width="4"/>
      <line x1="90" y1="205" x2="260" y2="205" stroke="#6f9fba" stroke-width="4"/>
      ${booksOnShelfSvg(112, 116)}
      ${tableSvg(305, 302)}
      ${repeatSvg(bookCount, 0, function (index) {
        return bookSvg(326 + index * 44, 273, ["#f06f6f", "#70b479", "#f3bd54", "#6b9fd5", "#a891d3"][index % 5]);
      })}
      ${personSvg(190, 300, "#ef8aa5", "girl")}
      ${personSvg(375, 190, "#83b96f", "boy")}
      ${personSvg(585, 172, "#6aa7d8", "teacher")}
      <rect x="505" y="224" width="168" height="46" rx="6" fill="#d9b782" stroke="#896b42" stroke-width="4"/>
      ${sceneCaption(set)}
    `);
  }

  function createParkSceneSvg(set) {
    const itemCount = Math.max(2, Math.min(5, getSceneCount(set, 3)));
    return sceneSvg(set, `
      <rect x="48" y="70" width="704" height="305" rx="10" fill="#eef9ed" stroke="#7ba8c0" stroke-width="5"/>
      ${treeSvg(105, 245)}
      ${treeSvg(625, 255)}
      <rect x="300" y="285" width="160" height="28" rx="8" fill="#b98758" stroke="#79543a" stroke-width="4"/>
      <rect x="318" y="313" width="16" height="54" fill="#79543a"/>
      <rect x="426" y="313" width="16" height="54" fill="#79543a"/>
      ${personSvg(230, 286, "#ef8aa5", "girl")}
      ${personSvg(505, 286, "#74bf8b", "boy")}
      ${repeatSvg(itemCount, 0, function (index) {
        return birdSvg(345 + index * 42, 145 + (index % 2) * 18);
      })}
      ${sceneCaption(set)}
    `);
  }

  function createSportsSceneSvg(set) {
    const ballCount = Math.max(1, Math.min(5, getSceneCount(set, 2)));
    return sceneSvg(set, `
      <rect x="50" y="70" width="700" height="305" rx="10" fill="#eaf8ea" stroke="#7ba8c0" stroke-width="5"/>
      <line x1="80" y1="330" x2="720" y2="330" stroke="#8fc28a" stroke-width="6"/>
      <rect x="600" y="185" width="95" height="110" fill="none" stroke="#679bce" stroke-width="6"/>
      ${personSvg(210, 270, "#74bf8b", "boy")}
      ${personSvg(410, 270, "#ef8aa5", "girl")}
      ${repeatSvg(ballCount, 0, function (index) {
        return ballSvg(285 + index * 60, 326, index % 2 === 0 ? "#f4f4f4" : "#f5b84b");
      })}
      ${sceneCaption(set)}
    `);
  }

  function createShopSceneSvg(set) {
    const itemCount = Math.max(2, Math.min(5, getSceneCount(set, 3)));
    return sceneSvg(set, `
      <rect x="55" y="70" width="690" height="305" rx="10" fill="#fff7ed" stroke="#7ba8c0" stroke-width="5"/>
      <rect x="120" y="125" width="210" height="205" rx="8" fill="#f5d28c" stroke="#9a7332" stroke-width="5"/>
      <rect x="155" y="155" width="140" height="64" fill="#eaf6ff" stroke="#3e789a" stroke-width="4"/>
      <rect x="465" y="238" width="150" height="72" rx="8" fill="#d9b782" stroke="#896b42" stroke-width="4"/>
      ${personSvg(380, 278, "#ef8aa5", "girl")}
      ${personSvg(660, 278, "#74bf8b", "boy")}
      ${repeatSvg(itemCount, 0, function (index) {
        return bagSvg(480 + index * 34, 206, ["#d56b62", "#6b9fd5", "#70b479", "#f3bd54", "#a891d3"][index % 5]);
      })}
      ${sceneCaption(set)}
    `);
  }

  function createLunchSceneSvg(set) {
    const plateCount = Math.max(2, Math.min(5, getSceneCount(set, 3)));
    return sceneSvg(set, `
      <rect x="60" y="70" width="680" height="305" rx="10" fill="#fff8e9" stroke="#7ba8c0" stroke-width="5"/>
      ${tableSvg(270, 303)}
      ${repeatSvg(plateCount, 0, function (index) {
        return plateSvg(315 + index * 56, 282);
      })}
      ${personSvg(220, 280, "#ef8aa5", "girl")}
      ${personSvg(570, 280, "#74bf8b", "boy")}
      ${sceneCaption(set)}
    `);
  }

  function createSimpleSceneSvg(set) {
    const itemCount = Math.max(2, Math.min(5, getSceneCount(set, 3)));
    return sceneSvg(set, `
      <rect x="60" y="70" width="680" height="305" rx="10" fill="#f8fcff" stroke="#7ba8c0" stroke-width="5"/>
      ${personSvg(170, 280, "#74bf8b", "boy")}
      ${personSvg(315, 280, "#ef8aa5", "girl")}
      ${tableSvg(440, 305)}
      ${repeatSvg(itemCount, 0, function (index) {
        return bookSvg(468 + index * 38, 276, ["#f06f6f", "#70b479", "#f3bd54", "#6b9fd5", "#a891d3"][index % 5]);
      })}
      ${sceneCaption(set)}
    `);
  }

  function sceneSvg(set, body) {
    const title = escapeSvgText(set.title || "Illustration");
    const desc = escapeSvgText([set.title].concat(set.pictureItems || []).filter(Boolean).join(" / "));
    return `<svg viewBox="0 0 800 500" role="img" aria-labelledby="sceneTitle sceneDesc" xmlns="http://www.w3.org/2000/svg">
      <title id="sceneTitle">${title}</title>
      <desc id="sceneDesc">${desc}</desc>
      <rect width="800" height="500" fill="#f8fcff"/>
      ${body}
    </svg>`;
  }

  function sceneCaption(set) {
    return `<text x="400" y="446" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#315f7b">${escapeSvgText(set.title || "Illustration")}</text>`;
  }

  function getSceneText(set) {
    return [
      set.id,
      set.title,
      set.illustration && set.illustration.description,
      Array.isArray(set.pictureItems) ? set.pictureItems.join(" ") : ""
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function includesAny(text, terms) {
    return terms.some(function (term) {
      return text.indexOf(term.toLowerCase()) !== -1;
    });
  }

  function getSceneCount(set, fallback) {
    const text = getSceneText(set);
    const digitMatch = text.match(/[0-9１２３４５６７８９]/);
    if (digitMatch) {
      return Number(digitMatch[0].replace(/[１２３４５６７８９]/g, function (digit) {
        return String("１２３４５６７８９".indexOf(digit) + 1);
      }));
    }
    const numberWords = [
      ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5],
      ["1つ", 1], ["2つ", 2], ["3つ", 3], ["4つ", 4], ["5つ", 5],
      ["1個", 1], ["2個", 2], ["3個", 3], ["4個", 4], ["5個", 5],
      ["1冊", 1], ["2冊", 2], ["3冊", 3], ["4冊", 4], ["5冊", 5],
      ["一", 1], ["二", 2], ["三", 3], ["四", 4], ["五", 5]
    ];
    const found = numberWords.find(function (entry) {
      return text.indexOf(entry[0]) !== -1;
    });
    return found ? found[1] : fallback;
  }

  function repeatSvg(count, start, renderer) {
    const parts = [];
    for (let i = start; i < count; i += 1) {
      parts.push(renderer(i));
    }
    return parts.join("");
  }

  function personSvg(x, y, color, kind) {
    const hair = kind === "girl" ? `<path d="M${x - 18} ${y - 78} q18 -30 38 0 v18 q-19 -14 -38 0z" fill="#4d382d"/>` : `<path d="M${x - 17} ${y - 79} q17 -24 36 -4 q-6 -18 -24 -17 q-16 1 -12 21z" fill="#3f3128"/>`;
    return `
      <circle cx="${x}" cy="${y - 58}" r="21" fill="#f1c49c" stroke="#775138" stroke-width="3"/>
      ${hair}
      <path d="M${x - 34} ${y + 1} q32 -55 68 0 v58 h-68z" fill="${color}" stroke="#4f6f87" stroke-width="4"/>
      <line x1="${x - 18}" y1="${y + 54}" x2="${x - 28}" y2="${y + 88}" stroke="#4f6f87" stroke-width="6" stroke-linecap="round"/>
      <line x1="${x + 18}" y1="${y + 54}" x2="${x + 28}" y2="${y + 88}" stroke="#4f6f87" stroke-width="6" stroke-linecap="round"/>
    `;
  }

  function bikeSvg(x, y, color, hasRider) {
    const riderLine = hasRider ? `<line x1="${x + 68}" y1="${y - 58}" x2="${x + 98}" y2="${y - 16}" stroke="#4f6f87" stroke-width="6" stroke-linecap="round"/>` : "";
    return `
      <circle cx="${x}" cy="${y}" r="32" fill="none" stroke="#34495e" stroke-width="7"/>
      <circle cx="${x + 112}" cy="${y}" r="32" fill="none" stroke="#34495e" stroke-width="7"/>
      <path d="M${x} ${y} L${x + 48} ${y - 54} L${x + 112} ${y} L${x + 42} ${y} Z" fill="none" stroke="${color}" stroke-width="7" stroke-linejoin="round"/>
      <line x1="${x + 48}" y1="${y - 54}" x2="${x + 76}" y2="${y - 80}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
      <line x1="${x + 38}" y1="${y - 56}" x2="${x + 18}" y2="${y - 72}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
      ${riderLine}
    `;
  }

  function tableSvg(x, y) {
    return `
      <rect x="${x}" y="${y}" width="210" height="32" rx="8" fill="#9bc2d8" stroke="#5d879e" stroke-width="4"/>
      <rect x="${x + 24}" y="${y + 30}" width="18" height="62" fill="#5d879e"/>
      <rect x="${x + 168}" y="${y + 30}" width="18" height="62" fill="#5d879e"/>
    `;
  }

  function bookSvg(x, y, color) {
    return `<rect x="${x}" y="${y}" width="42" height="24" rx="3" fill="${color}" stroke="#486d8a" stroke-width="3"/>`;
  }

  function booksOnShelfSvg(x, y) {
    return `
      <rect x="${x}" y="${y}" width="24" height="34" fill="#f06f6f"/>
      <rect x="${x + 34}" y="${y - 6}" width="24" height="40" fill="#68a7d9"/>
      <rect x="${x + 68}" y="${y + 5}" width="24" height="29" fill="#74bf8b"/>
      <rect x="${x + 102}" y="${y - 3}" width="24" height="37" fill="#f5bc4e"/>
      <rect x="${x + 8}" y="${y + 58}" width="24" height="39" fill="#7fb3d5"/>
      <rect x="${x + 42}" y="${y + 66}" width="24" height="31" fill="#f48f64"/>
      <rect x="${x + 76}" y="${y + 52}" width="24" height="45" fill="#98c879"/>
    `;
  }

  function treeSvg(x, y) {
    return `
      <rect x="${x - 12}" y="${y - 20}" width="24" height="100" fill="#8a633f"/>
      <circle cx="${x}" cy="${y - 62}" r="48" fill="#78bd77" stroke="#4e8f4d" stroke-width="4"/>
      <circle cx="${x - 30}" cy="${y - 32}" r="35" fill="#8dcc85" stroke="#4e8f4d" stroke-width="4"/>
      <circle cx="${x + 34}" cy="${y - 34}" r="36" fill="#8dcc85" stroke="#4e8f4d" stroke-width="4"/>
    `;
  }

  function birdSvg(x, y) {
    return `<path d="M${x - 18} ${y} q18 -18 36 0 q18 -18 36 0" fill="none" stroke="#405f78" stroke-width="5" stroke-linecap="round"/>`;
  }

  function ballSvg(x, y, color) {
    return `<circle cx="${x}" cy="${y}" r="21" fill="${color}" stroke="#34495e" stroke-width="4"/><path d="M${x - 12} ${y} h24 M${x} ${y - 12} v24" stroke="#34495e" stroke-width="3"/>`;
  }

  function bagSvg(x, y, color) {
    return `<rect x="${x}" y="${y}" width="36" height="34" rx="6" fill="${color}" stroke="#6b4f31" stroke-width="3"/><path d="M${x + 8} ${y} q10 -18 20 0" fill="none" stroke="#6b4f31" stroke-width="3"/>`;
  }

  function plateSvg(x, y) {
    return `<ellipse cx="${x}" cy="${y}" rx="25" ry="13" fill="#ffffff" stroke="#6f9fba" stroke-width="4"/><circle cx="${x}" cy="${y - 2}" r="8" fill="#f5b84b"/>`;
  }

  function escapeSvgText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderQuestion() {
    const set = getCurrentSet();
    const question = getCurrentQuestion();
    if (!set || !question) {
      return;
    }

    elements.questionCounter.textContent = "Question " + question.no + " / " + set.questions.length;
    elements.questionType.textContent = TYPE_LABELS[question.type] || question.type;
    elements.questionText.textContent = question.question;
    elements.hintText.textContent = question.hintJa;
    elements.sampleAnswer.textContent = question.sampleAnswer;
    resetQuestionRevealState();
    elements.prevQuestionButton.disabled = state.currentQuestionIndex === 0;
    elements.nextQuestionButton.disabled = state.currentQuestionIndex >= set.questions.length - 1;
  }

  function resetQuestionRevealState() {
    elements.questionTextPanel.hidden = true;
    elements.questionTextPanel.setAttribute("aria-hidden", "true");
    elements.toggleQuestionButton.setAttribute("aria-expanded", "false");
    elements.toggleQuestionButton.textContent = "質問文を表示";

    elements.hintPanel.hidden = true;
    elements.hintPanel.setAttribute("aria-hidden", "true");
    elements.toggleHintButton.setAttribute("aria-expanded", "false");
    elements.toggleHintButton.textContent = "日本語ヒントを表示";

    hideAnswer();
  }

  function showAnswer() {
    elements.answerPanel.hidden = false;
    elements.answerPanel.setAttribute("aria-hidden", "false");
    elements.toggleAnswerButton.setAttribute("aria-expanded", "true");
    elements.toggleAnswerButton.textContent = "模範解答を隠す";
  }

  function hideAnswer() {
    elements.answerPanel.hidden = true;
    elements.answerPanel.setAttribute("aria-hidden", "true");
    elements.toggleAnswerButton.setAttribute("aria-expanded", "false");
    elements.toggleAnswerButton.textContent = "模範解答を表示";
  }

  function renderLevelCheck(levelCheck) {
    elements.levelCheckList.innerHTML = "";
    if (!levelCheck || typeof levelCheck !== "object") {
      appendDefinition("情報", "なし");
      return;
    }

    appendDefinition("級", valueToText(levelCheck.grade));
    appendDefinition("トピック", valueToText(levelCheck.topic));
    appendDefinition("本文の文数", valueToText(levelCheck.passageSentences));
    appendDefinition("文法", valueToText(levelCheck.grammar));
    appendDefinition("難しい語", valueToText(levelCheck.difficultWords));
  }

  function appendDefinition(term, description) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description || "なし";
    elements.levelCheckList.append(dt, dd);
  }

  function valueToText(value) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join("、") : "なし";
    }
    if (value === undefined || value === null || value === "") {
      return "なし";
    }
    return String(value);
  }

  function sanitizeSvg(svgText) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(svgText, "image/svg+xml");
    const svg = parsed.documentElement;

    if (!svg || svg.nodeName.toLowerCase() !== "svg" || parsed.querySelector("parsererror")) {
      return createIllustrationError();
    }

    svg.querySelectorAll("script, foreignObject").forEach(function (node) {
      node.remove();
    });

    svg.querySelectorAll("*").forEach(function (node) {
      Array.from(node.attributes).forEach(function (attribute) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith("on") || value.startsWith("javascript:")) {
          node.removeAttribute(attribute.name);
        }
      });
    });

    return document.importNode(svg, true);
  }

  function createIllustrationError() {
    const message = document.createElement("div");
    message.className = "illustration-fallback";
    message.textContent = "SVGイラストを表示できません。";
    return message;
  }

  function getCurrentSet() {
    return state.allSets[state.currentSetIndex] || state.allSets[0];
  }

  function getCurrentQuestion() {
    const set = getCurrentSet();
    return set ? set.questions[state.currentQuestionIndex] : null;
  }

  function getSpeechRate() {
    const selected = document.querySelector("input[name='speechRate']:checked");
    return selected ? Number(selected.value) : 0.75;
  }

  function speak(text, lang, rate) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setStatus("このブラウザでは音声読み上げを使えません。", true);
      return;
    }

    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || "en-US";
    utterance.rate = rate || 1;
    utterance.pitch = 1;
    utterance.onend = function () {
      setStatus("", false);
    };
    utterance.onerror = function () {
      setStatus("読み上げでエラーが起きました。", true);
    };
    window.speechSynthesis.speak(utterance);
    setStatus("読み上げ中です。", false);
  }

  function cancelSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("", false);
  }

  function handleJsonFile(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validSets = validateImportPayload(parsed);
        if (validSets.length === 0) {
          throw new Error("No valid sets");
        }

        const existingIds = new Set(state.allSets.map(function (set) {
          return set.id;
        }));
        const timestamp = Date.now();
        const normalizedSets = validSets.map(function (set, index) {
          const copy = normalizeImportedSet(set);
          if (existingIds.has(copy.id)) {
            copy.id = createImportedId(copy.id, timestamp, index, existingIds);
          }
          existingIds.add(copy.id);
          return copy;
        });

        state.importedSets = state.importedSets.concat(normalizedSets);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.importedSets));
        refreshSets();
        state.currentSetIndex = state.allSets.length - normalizedSets.length;
        state.currentQuestionIndex = 0;
        render();
        setStatus(normalizedSets.length + "件の問題セットを読み込みました。", false);
      } catch (error) {
        setStatus("問題ファイルの形式が正しくありません。", true);
      } finally {
        elements.jsonFileInput.value = "";
      }
    };
    reader.onerror = function () {
      setStatus("問題ファイルの形式が正しくありません。", true);
      elements.jsonFileInput.value = "";
    };
    reader.readAsText(file);
  }

  function validateImportPayload(payload) {
    if (!payload || !Array.isArray(payload.sets)) {
      throw new Error("sets must be an array");
    }

    return payload.sets.filter(function (set) {
      if (!set || typeof set !== "object") {
        return false;
      }
      if (!hasString(set.id) || !hasString(set.title)) {
        return false;
      }
      if (!Array.isArray(set.passage) || set.passage.length === 0) {
        return false;
      }
      if (!set.passage.every(function (sentence) { return typeof sentence === "string"; })) {
        return false;
      }
      if (!Array.isArray(set.questions) || set.questions.length === 0) {
        return false;
      }
      return set.questions.every(function (question) {
        return question
          && Object.prototype.hasOwnProperty.call(question, "no")
          && hasString(question.type)
          && hasString(question.question)
          && hasString(question.hintJa)
          && hasString(question.sampleAnswer);
      });
    });
  }

  function normalizeImportedSet(set) {
    return {
      id: set.id,
      title: set.title,
      passage: set.passage.slice(),
      illustration: set.illustration || null,
      pictureItems: Array.isArray(set.pictureItems) ? set.pictureItems.slice() : [],
      questions: set.questions.map(function (question) {
        return {
          no: question.no,
          type: question.type,
          question: question.question,
          hintJa: question.hintJa,
          sampleAnswer: question.sampleAnswer
        };
      }),
      levelCheck: set.levelCheck || null
    };
  }

  function createImportedId(baseId, timestamp, index, existingIds) {
    const suffix = "*imported*" + timestamp;
    let candidate = baseId + suffix;
    let retry = index;
    while (existingIds.has(candidate)) {
      retry += 1;
      candidate = baseId + suffix + "-" + retry;
    }
    return candidate;
  }

  function hasString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function readImportedSets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? validateStoredSets(parsed) : [];
    } catch (error) {
      return [];
    }
  }

  function validateStoredSets(sets) {
    return sets.filter(function (set) {
      return set
        && hasString(set.id)
        && hasString(set.title)
        && Array.isArray(set.passage)
        && Array.isArray(set.questions)
        && set.questions.length > 0;
    });
  }

  function setStatus(message, isError) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.toggle("is-error", Boolean(isError));
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js").catch(function () {
          setStatus("オフライン用の準備に失敗しました。", true);
        });
      });
    }
  }
})();
