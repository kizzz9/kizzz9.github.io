/*
 * 掲載するアプリとゲームの一覧。ここを書き換えるだけでページが変わる。
 *
 * 追加するとき:
 *   1. アイコン (正方形 512px くらい) を assets/icons/ に置く
 *   2. 下の APPS に 1 件足す。platform は SECTIONS の id のどれか
 *   3. 動画があれば assets/videos/ に置いて video に書く (mp4。YouTube などの URL でもよい)
 *      動画が無ければ画面写真を assets/posters/ に置いて poster に書く。
 *      mediaShape で縦長 "tall" (iPhone の画面) か横長 "wide" (Mac・ゲーム) を選ぶ。
 *      書かなければ、動画は縦長、画面写真は横長として扱う
 *   4. スクショは assets/shots/ に置いて shots に並べる (動画の下に横並びで出る。タップで拡大)
 *   5. サポートページがあれば support に URL を書く
 *   6. motif はトップ右に出る図形 (tree / moon / mountain / record / paw / egg / plane / note / circle)。
 *      新しい形は bg.js の MOTIFS に足す
 *
 * 新しいプラットフォーム (Windows、Steam など) を増やすときは SECTIONS に 1 行足す。
 * アプリが 0 件のプラットフォームはページに出ない。
 * 同じプラットフォームに複数あると、スクロールで入るたびに主役がランダムに入れ替わる (直前と同じものは出ない)。
 */

window.SECTIONS = [
  { id: "mac", label: "Mac", title: "Mac のアプリ" },
  { id: "ios", label: "iOS", title: "iPhone のアプリ" },
  { id: "roblox", label: "Roblox", title: "Roblox のゲーム" },
];

window.APPS = [
  {
    platform: "mac",
    name: "Canopy",
    sub: "SwiftUI の構造を診るツール",
    desc: "AI に書かせた SwiftUI、ビルドは通るけれど中身は大丈夫？ フォルダを開くだけで、すべての View の構造をツリーで見せる。ノードの数、ネストの深さ、@State の数から、先に直すべき View が分かる。コードには触らない読み取り専用なので、Xcode の横に開いておける。",
    url: "https://apps.apple.com/app/id6760962104",
    store: "Mac App Store",
    icon: "assets/icons/canopy.png",
    iconShape: "free", // 透過 PNG で形ができているもの。iOS の正方形アイコンは "ios"
    genre: "開発ツール",
    year: 2026,
    video: "assets/videos/canopy.mp4",
    poster: "assets/posters/canopy.jpg",
    mediaShape: "wide",
    shots: ["assets/shots/canopy-1.jpg", "assets/shots/canopy-2.jpg", "assets/shots/canopy-3.jpg", "assets/shots/canopy-4.jpg", "assets/shots/canopy-5.jpg", "assets/shots/canopy-6.jpg", "assets/shots/canopy-7.jpg"],
    support: "https://kizzz9.github.io/canopy-support/",
    motif: "tree",
    color: { bg: "#123d29", ink: "#e6f3ea", pop: "#7cc79c" },
  },
  {
    platform: "ios",
    name: "デバフタイマー",
    latin: "DebuffTimer",
    sub: "危機感型の睡眠アプリ",
    desc: "起きてからの時間を、脳の分身「ヨイ」の姿で見せる睡眠アプリ。起き続けるほどヨイは黄色く、赤くなり、最後はひび割れる。17 時間起きた脳の判断力は、ほろ酔いと同じくらいまで落ちる。その危うさを数字ではなく見た目で突きつけて、今夜早く寝る理由をつくる。",
    url: "https://apps.apple.com/app/id6791829009",
    store: "App Store",
    icon: "assets/icons/debufftimer.jpg",
    iconShape: "ios",
    genre: "ヘルスケア",
    year: 2026,
    video: "assets/videos/debufftimer.mp4",
    poster: "assets/posters/debufftimer.jpg",
    shots: ["assets/shots/debufftimer-1.jpg", "assets/shots/debufftimer-2.jpg", "assets/shots/debufftimer-3.jpg", "assets/shots/debufftimer-4.jpg", "assets/shots/debufftimer-5.jpg", "assets/shots/debufftimer-6.jpg", "assets/shots/debufftimer-7.jpg"],
    support: "https://kizzz9.github.io/debufftimer-support/",
    motif: "moon",
    color: { bg: "#e5322d", ink: "#140606", pop: "#140606" },
  },
  {
    platform: "ios",
    name: "Tabilm",
    sub: "旅のしおりと自動 Vlog",
    desc: "旅のしおりを作って、予定ごとに 2 秒ずつ撮るだけで、旅の Vlog ができあがる。撮った素材は「おまかせ」が BGM に合わせてつなぎ、縦型の動画に仕上げる。予定、地図、天気、持ち物リストもひとつのアプリにまとまる。",
    url: "https://apps.apple.com/app/id6777381732",
    store: "App Store",
    icon: "assets/icons/tabilm.jpg",
    iconShape: "ios",
    genre: "旅行",
    year: 2026,
    video: "assets/videos/tabilm.mp4",
    poster: "assets/posters/tabilm.jpg",
    shots: ["assets/shots/tabilm-1.jpg", "assets/shots/tabilm-2.jpg", "assets/shots/tabilm-3.jpg", "assets/shots/tabilm-4.jpg", "assets/shots/tabilm-5.jpg", "assets/shots/tabilm-6.jpg", "assets/shots/tabilm-7.jpg", "assets/shots/tabilm-8.jpg", "assets/shots/tabilm-9.jpg"],
    support: "https://kizzz9.github.io/tabilm-support/",
    motif: "mountain",
    color: { bg: "#f39a4a", ink: "#2a160a", pop: "#fff3df" },
  },
  {
    platform: "ios",
    name: "Runback",
    sub: "Apple Music の曲順をとっておく",
    desc: "Apple Music の横に置いておく、小さな相棒。自動再生でいい流れが続いたら、その 2〜10 曲を曲順ごと「セット」に残す。あとからタップひとつで、ミュージックが同じ順に流し直す。プレイリストを作るほどではない、あの夜の流れのために。",
    url: "https://apps.apple.com/app/id6832275879",
    store: "App Store",
    icon: "assets/icons/runback.jpg",
    iconShape: "ios",
    genre: "ミュージック",
    year: 2026,
    poster: "assets/posters/runback.jpg",
    mediaShape: "tall",
    shots: ["assets/shots/runback-1.jpg", "assets/shots/runback-2.jpg", "assets/shots/runback-3.jpg", "assets/shots/runback-4.jpg", "assets/shots/runback-5.jpg", "assets/shots/runback-6.jpg"],
    support: "https://kizzz9.github.io/runback-support/",
    motif: "record",
    color: { bg: "#14072b", ink: "#f4ecff", pop: "#ff3fae" },
  },
  {
    platform: "roblox",
    name: "Pet Heist Tycoon",
    sub: "ペット大泥棒",
    desc: "タマゴを孵してペットを集め、自分の区画を育てるタイクーン。育てるだけでは終わらない。ほかのプレイヤーの区画に忍び込んで、いちばん強いペットを盗み出せる。",
    url: "https://www.roblox.com/games/91644825581037",
    store: "Roblox",
    icon: "assets/icons/pet-heist.jpg",
    iconShape: "ios",
    genre: "タイクーン",
    year: 2026,
    poster: "assets/posters/pet-heist.jpg",
    shots: ["assets/shots/pet-heist-2.jpg", "assets/shots/pet-heist-3.jpg"],
    motif: "paw",
    color: { bg: "#ffd23f", ink: "#2b1a10", pop: "#2b1a10" },
  },
];
