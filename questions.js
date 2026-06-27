window.INITIAL_QUESTION_SETS = [
  {
    id: "set001",
    title: "A School Library",
    passage: [
      "Many students use the school library.",
      "Some students read books there after school.",
      "The library has many English books.",
      "Students can learn new words, so they like the library."
    ],
    illustration: {
      type: "svg",
      description: "A school library. A girl is reading a book. A boy is borrowing a book. There are three books on the table. A teacher is at the counter.",
      svg: `<svg viewBox="0 0 800 500" role="img" aria-labelledby="libraryTitle libraryDesc" xmlns="http://www.w3.org/2000/svg">
  <title id="libraryTitle">A School Library</title>
  <desc id="libraryDesc">A girl is reading a book. A boy is borrowing a book. There are three books on the table. A teacher is at the counter.</desc>
  <rect width="800" height="500" fill="#f8fcff"/>
  <rect x="60" y="65" width="680" height="340" rx="10" fill="#fff7e8" stroke="#6f9fba" stroke-width="5"/>
  <rect x="95" y="92" width="180" height="175" rx="4" fill="#cde7f5" stroke="#6f9fba" stroke-width="4"/>
  <line x1="95" y1="150" x2="275" y2="150" stroke="#6f9fba" stroke-width="4"/>
  <line x1="95" y1="210" x2="275" y2="210" stroke="#6f9fba" stroke-width="4"/>
  <g>
    <rect x="112" y="111" width="24" height="34" fill="#f06f6f"/>
    <rect x="145" y="105" width="24" height="40" fill="#68a7d9"/>
    <rect x="178" y="116" width="24" height="29" fill="#74bf8b"/>
    <rect x="211" y="108" width="24" height="37" fill="#f5bc4e"/>
    <rect x="120" y="166" width="24" height="39" fill="#7fb3d5"/>
    <rect x="153" y="174" width="24" height="31" fill="#f48f64"/>
    <rect x="186" y="160" width="24" height="45" fill="#98c879"/>
    <rect x="219" y="170" width="24" height="35" fill="#a891d3"/>
  </g>
  <rect x="500" y="165" width="170" height="95" rx="6" fill="#d9b782" stroke="#896b42" stroke-width="4"/>
  <text x="585" y="220" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="#513b24">COUNTER</text>
  <circle cx="590" cy="115" r="25" fill="#f1c49c" stroke="#775138" stroke-width="3"/>
  <path d="M555 165 q35 -45 70 0 v55 h-70z" fill="#6aa7d8" stroke="#326d95" stroke-width="4"/>
  <path d="M565 95 q25 -28 52 0 q-8 -24 -28 -24 q-19 0 -24 24z" fill="#4d382d"/>
  <rect x="255" y="306" width="240" height="34" rx="8" fill="#9bc2d8" stroke="#5d879e" stroke-width="4"/>
  <rect x="280" y="340" width="18" height="72" fill="#5d879e"/>
  <rect x="450" y="340" width="18" height="72" fill="#5d879e"/>
  <rect x="310" y="278" width="48" height="24" rx="3" fill="#f06f6f" stroke="#9d4848" stroke-width="3"/>
  <rect x="365" y="276" width="48" height="26" rx="3" fill="#70b479" stroke="#47764f" stroke-width="3"/>
  <rect x="420" y="280" width="48" height="22" rx="3" fill="#f3bd54" stroke="#96712a" stroke-width="3"/>
  <circle cx="205" cy="300" r="24" fill="#f1c49c" stroke="#775138" stroke-width="3"/>
  <path d="M177 286 q28 -42 57 0 v18 q-29 -23 -57 0z" fill="#53352b"/>
  <path d="M172 352 q34 -48 70 0 v68 h-70z" fill="#ef8aa5" stroke="#a84e67" stroke-width="4"/>
  <rect x="184" y="318" width="72" height="42" rx="4" fill="#ffffff" stroke="#486d8a" stroke-width="4"/>
  <line x1="220" y1="320" x2="220" y2="358" stroke="#486d8a" stroke-width="3"/>
  <circle cx="350" cy="168" r="23" fill="#f1c49c" stroke="#775138" stroke-width="3"/>
  <path d="M323 238 q27 -54 64 0 v82 h-64z" fill="#83b96f" stroke="#4f7d42" stroke-width="4"/>
  <rect x="388" y="178" width="58" height="46" rx="4" fill="#f7fbff" stroke="#486d8a" stroke-width="4"/>
  <line x1="417" y1="180" x2="417" y2="222" stroke="#486d8a" stroke-width="3"/>
  <path d="M330 146 q18 -26 42 -6 q-8 -24 -31 -18 q-17 5 -11 24z" fill="#3f3128"/>
  <text x="400" y="455" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#315f7b">School Library</text>
</svg>`
    },
    pictureItems: [
      "女の子が本を読んでいる",
      "男の子が本を借りている",
      "テーブルの上に本が3冊ある",
      "先生がカウンターにいる"
    ],
    questions: [
      {
        no: 1,
        type: "passage",
        question: "What do some students do after school?",
        hintJa: "放課後、生徒たちは何をしていますか？",
        sampleAnswer: "They read books."
      },
      {
        no: 2,
        type: "passage",
        question: "Why do students like the library?",
        hintJa: "なぜ生徒たちは図書館が好きなのですか？",
        sampleAnswer: "Because they can learn new words."
      },
      {
        no: 3,
        type: "picture",
        question: "What is the girl doing?",
        hintJa: "女の子は何をしていますか？",
        sampleAnswer: "She is reading a book."
      },
      {
        no: 4,
        type: "picture",
        question: "How many books are on the table?",
        hintJa: "テーブルの上に本は何冊ありますか？",
        sampleAnswer: "There are three books."
      },
      {
        no: 5,
        type: "personal",
        question: "Do you often read books?",
        hintJa: "あなたはよく本を読みますか？",
        sampleAnswer: "Yes, I do. I like stories."
      },
      {
        no: 6,
        type: "opinion",
        question: "Which do you like better, books or movies?",
        hintJa: "本と映画ではどちらが好きですか？",
        sampleAnswer: "I like movies better. Because they are fun."
      }
    ],
    levelCheck: {
      grade: "英検3級",
      topic: "school library",
      passageSentences: 4,
      grammar: ["現在形", "現在進行形", "because", "so"],
      difficultWords: []
    }
  }
];
