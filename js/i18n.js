// =============================================
//  ことば（日本語・English・繁體中文・한국어）
//  ===========================================

(function () {
  var LANGS = ['ja', 'en', 'zh', 'ko'];
  var KEY = 'shiincrad-lang';
  var D = {
 "lang_label": [
  "ことば",
  "Language",
  "語言",
  "언어"
 ],
 "home": [
  "なすびのお庭へ",
  "Nasubi's Garden (more games)",
  "前往茄子的庭院",
  "가지의 정원으로"
 ],
 "howto": [
  "あそびかた",
  "How to play",
  "玩法",
  "플레이 방법"
 ],
 "close": [
  "とじる",
  "Close",
  "關閉",
  "닫기"
 ],
 "back": [
  "もどる",
  "Back",
  "返回",
  "돌아가기"
 ],
 "to_title": [
  "タイトルへ",
  "Back to title",
  "回到標題",
  "타이틀로"
 ],
 "again": [
  "もう一回",
  "Play again",
  "再來一局",
  "한 판 더"
 ],
 "easy": [
  "よわい",
  "Easy",
  "簡單",
  "약함"
 ],
 "normal": [
  "ふつう",
  "Normal",
  "普通",
  "보통"
 ],
 "hard": [
  "つよい",
  "Hard",
  "困難",
  "강함"
 ],
 "vs_cpu": [
  "CPUとたいせん",
  "VS CPU",
  "對戰CPU",
  "CPU와 대전"
 ],
 "online": [
  "あいことばで対戦",
  "Play with a passcode",
  "用暗號對戰",
  "암호로 대전"
 ],
 "passcode": [
  "あいことば",
  "Passcode",
  "暗號",
  "암호"
 ],
 "name": [
  "なまえ",
  "Name",
  "名字",
  "이름"
 ],
 "noname": [
  "ななし",
  "Anonymous",
  "無名氏",
  "익명"
 ],
 "online_hint": [
  "同じあいことばを入れた人と対戦。3人目からは観戦になります。",
  "Play against whoever enters the same passcode. From the 3rd person on, you watch.",
  "和輸入相同暗號的人對戰。第3個人開始為觀戰。",
  "같은 암호를 입력한 사람과 대전. 3번째 사람부터는 관전이 됩니다."
 ],
 "join": [
  "はいる",
  "Join",
  "進入",
  "입장"
 ],
 "wait_pre": [
  "あいことば「",
  "Passcode: ",
  "暗號「",
  "암호 「"
 ],
 "wait_post": [
  "」",
  "",
  "」",
  "」"
 ],
 "waiting": [
  "あいてを待っています…",
  "Waiting for an opponent…",
  "等待對手中…",
  "상대를 기다리는 중…"
 ],
 "copy_link": [
  "さそうリンクをコピー",
  "Copy invite link",
  "複製邀請連結",
  "초대 링크 복사"
 ],
 "copied": [
  "コピーしました！",
  "Copied!",
  "已複製！",
  "복사했어요!"
 ],
 "send_link": [
  "このリンクを送ってください",
  "Send this link",
  "請傳送這個連結",
  "이 링크를 보내 주세요"
 ],
 "err_code": [
  "あいことばを入れてください（. # $ / [ ] は使えません）",
  "Enter a passcode (. # $ / [ ] are not allowed)",
  "請輸入暗號（不能使用 . # $ / [ ]）",
  "암호를 입력해 주세요 (. # $ / [ ] 는 사용할 수 없어요)"
 ],
 "err_code_short": [
  "あいことばを入れてください",
  "Enter a passcode",
  "請輸入暗號",
  "암호를 입력해 주세요"
 ],
 "connecting": [
  "つないでいます…",
  "Connecting…",
  "連線中…",
  "연결 중…"
 ],
 "err_net": [
  "通信できませんでした。電波のよいところでもう一度ためしてください",
  "Couldn't connect. Please try again where the signal is better.",
  "無法連線。請在訊號好的地方再試一次。",
  "연결하지 못했어요. 신호가 좋은 곳에서 다시 시도해 주세요."
 ],
 "err_notready": [
  "オンライン対戦はまだ準備中です",
  "Online play isn't ready yet",
  "線上對戰還在準備中",
  "온라인 대전은 아직 준비 중이에요"
 ],
 "err_conn": [
  "つながりませんでした",
  "Couldn't connect",
  "無法連線",
  "연결되지 않았어요"
 ],
 "left_win": [
  "相手が抜けたので、あなたの勝ち！",
  "Your opponent left, so you win!",
  "對手離開了，你贏了！",
  "상대가 나가서 당신의 승리!"
 ],
 "left": [
  "あいてが退室しました",
  "Your opponent left",
  "對手已離開",
  "상대가 퇴장했어요"
 ],
 "watch_in": [
  "観戦で入りました。試合が始まるのを待っています…",
  "You joined as a spectator. Waiting for the game to start…",
  "已用觀戰身分進入。等待比賽開始…",
  "관전으로 입장했어요. 경기 시작을 기다리는 중…"
 ],
 "wait_next": [
  "次の試合が始まるのを待っています…",
  "Waiting for the next game…",
  "等待下一局開始…",
  "다음 경기를 기다리는 중…"
 ],
 "wait_rematch": [
  "あいての「もう一回」を待っています…",
  "Waiting for your opponent to choose \"Play again\"…",
  "等待對手按「再來一局」…",
  "상대의 '한 판 더'를 기다리는 중…"
 ],
 "you": [
  "あなた",
  "You",
  "你",
  "나"
 ],
 "cpu": [
  "CPU",
  "CPU",
  "CPU",
  "CPU"
 ],
 "your_turn": [
  "あなたの番",
  "Your turn",
  "輪到你",
  "내 차례"
 ],
 "cpu_wait_label": [
  "CPU（ふつう）と遊びながら待つ",
  "Play the CPU (Normal) while waiting",
  "一邊和CPU（普通）玩一邊等",
  "기다리는 동안 CPU(보통)와 플레이"
 ],
 "qm_btn": [
  "だれかと対戦",
  "Play someone online",
  "隨機對戰",
  "아무나와 대전"
 ],
 "qm_stat": [
  "対戦待ち <b>{w}</b>人・対戦中 <b>{p}</b>組",
  "<b>{w}</b> waiting · <b>{p}</b> playing",
  "等待中 <b>{w}</b>人・對戰中 <b>{p}</b>組",
  "대기 <b>{w}</b>명 · 대전 중 <b>{p}</b>쌍"
 ],
 "qm_prime_hot": [
  "🔥 いま対戦タイム！（22時まで）",
  "🔥 Battle time now! (until 22:00 JST)",
  "🔥 現在是對戰時間！（到日本時間22點）",
  "🔥 지금은 대전 타임! (일본 시간 22시까지)"
 ],
 "qm_prime": [
  "🌙 毎晩21時〜22時は対戦タイム",
  "🌙 Battle time every night 21:00–22:00 JST",
  "🌙 每晚日本時間21〜22點是對戰時間",
  "🌙 매일 밤 일본 시간 21~22시는 대전 타임"
 ],
 "qm_sub": [
  "いま待っている人と、自動でつながります。",
  "You'll be matched automatically with someone who's waiting.",
  "自動和正在等待的人配對。",
  "기다리고 있는 사람과 자동으로 연결돼요."
 ],
 "qm_go": [
  "さがす",
  "Find a match",
  "尋找",
  "찾기"
 ],
 "qm_badname": [
  "その名前は使えません。ほかの名前にしてね",
  "That name can't be used. Please choose another.",
  "這個名字不能使用，請換一個。",
  "그 이름은 사용할 수 없어요. 다른 이름으로 해 주세요."
 ],
 "qm_searching": [
  "相手をさがしています",
  "Looking for an opponent",
  "正在尋找對手",
  "상대를 찾는 중"
 ],
 "qm_wait_pre": [
  "いま対戦待ち ",
  "Waiting now: ",
  "目前等待中 ",
  "현재 대기 "
 ],
 "qm_wait_post": [
  "人",
  "",
  "人",
  "명"
 ],
 "qm_cpu": [
  "CPUと遊びながら待つ",
  "Play the CPU while waiting",
  "一邊和CPU玩一邊等",
  "기다리는 동안 CPU와 플레이"
 ],
 "qm_cancel": [
  "やめる",
  "Cancel",
  "取消",
  "그만두기"
 ],
 "qm_retry": [
  "もう一度さがす",
  "Search again",
  "再找一次",
  "다시 찾기"
 ],
 "qm_searching_t": [
  "相手をさがしています… {t}",
  "Looking for an opponent… {t}",
  "正在尋找對手… {t}",
  "상대를 찾는 중… {t}"
 ],
 "qm_calling": [
  "CPUと遊んでいる人に声をかけています…",
  "Inviting someone who is playing the CPU…",
  "正在邀請正在和CPU玩的人…",
  "CPU와 플레이 중인 사람에게 신청하는 중…"
 ],
 "qm_declined": [
  "相手が見送りました。ほかの人をさがします",
  "They passed. Looking for someone else.",
  "對方跳過了，改找其他人。",
  "상대가 넘겼어요. 다른 사람을 찾을게요."
 ],
 "qm_found": [
  "相手が見つかりました！",
  "Opponent found!",
  "找到對手了！",
  "상대를 찾았어요!"
 ],
 "qm_avail": [
  "対戦できる相手がいます！",
  "Someone is ready to play!",
  "有可以對戰的對手！",
  "대전할 수 있는 상대가 있어요!"
 ],
 "qm_play": [
  "対戦する",
  "Play",
  "對戰",
  "대전하기"
 ],
 "qm_pass": [
  "見送る",
  "Pass",
  "跳過",
  "넘기기"
 ],
 "qm_taken": [
  "さっきの相手は、ほかの人と対戦を始めました。もう少し待ってね",
  "That player started a match with someone else. Please wait a little longer.",
  "剛才的對手已經和別人開始對戰了。請再等一下。",
  "방금 상대는 다른 사람과 대전을 시작했어요. 조금만 더 기다려 주세요."
 ],
 "qm_fail": [
  "相手とつながりませんでした（{c}）",
  "Couldn't connect to your opponent ({c})",
  "無法和對手連線（{c}）",
  "상대와 연결되지 않았어요 ({c})"
 ],
 "qm_nojoin": [
  "入れませんでした",
  "Couldn't join",
  "無法進入",
  "들어가지 못했어요"
 ],
 "qm_next": [
  "次の相手をさがす",
  "Find next opponent",
  "尋找下一位對手",
  "다음 상대 찾기"
 ],
 "doc_title": [
  "シインクラッド",
  "SHIINCRAD",
  "SHIINCRAD",
  "SHIINCRAD"
 ],
 "doc_desc": [
  "死は、だれかの足場になる。みんなの屍を越えて、全100層の頂をめざす横スクロール。",
  "Your death becomes someone's foothold. A side-scroller where you climb over everyone's corpses to the top of 100 floors.",
  "死亡，會成為某人的立足點。越過大家的屍體，挑戰全100層頂峰的橫向捲軸遊戲。",
  "죽음은 누군가의 발판이 된다. 모두의 시체를 넘어 전 100층의 정상을 노리는 횡스크롤 게임."
 ],
 "logo": [
  "シインクラッド",
  "SHIINCRAD",
  "SHIINCRAD",
  "SHIINCRAD"
 ],
 "catch": [
  "死ぬと、そこが足場になる。",
  "Where you die, a foothold remains.",
  "死在哪裡，哪裡就成為立足點。",
  "죽은 자리가 발판이 된다."
 ],
 "loading": [
  "読みこみ中…",
  "Loading…",
  "讀取中…",
  "불러오는 중…"
 ],
 "loading2": [
  "読みこんでいます…",
  "Loading…",
  "讀取中…",
  "불러오는 중…"
 ],
 "now_lab": [
  "いま、みんなで挑んでいる層",
  "The floor everyone is climbing now",
  "大家現在正在挑戰的層",
  "지금 모두가 도전 중인 층"
 ],
 "t_ldead": [
  "この層の屍",
  "Corpses here",
  "本層屍體",
  "이 층의 시체"
 ],
 "road": [
  "道ができた",
  "Path built",
  "道路完成",
  "길 완성"
 ],
 "live_link": [
  "🔴 配信先リンク",
  "🔴 Live streams",
  "🔴 直播連結",
  "🔴 방송 링크"
 ],
 "live_aria": [
  "配信先リンク",
  "Live streams",
  "直播連結",
  "방송 링크"
 ],
 "challenge": [
  "第{n}層に挑む",
  "Challenge Floor {n}",
  "挑戰第{n}層",
  "{n}층에 도전"
 ],
 "view_summit": [
  "頂をながめる",
  "View the summit",
  "眺望頂峰",
  "정상 바라보기"
 ],
 "go_select": [
  "層をえらぶ",
  "Floors",
  "選擇樓層",
  "층 선택"
 ],
 "grave_btn": [
  "屍の碑",
  "The Fallen",
  "屍之碑",
  "시체의 비석"
 ],
 "hero_btn": [
  "到達者の碑",
  "Pioneers",
  "到達者之碑",
  "도달자의 비석"
 ],
 "credits": [
  "エンドロール",
  "Credits",
  "片尾名單",
  "엔딩 롤"
 ],
 "snd_on": [
  "♪ 音あり",
  "♪ Sound on",
  "♪ 有聲音",
  "♪ 소리 켬"
 ],
 "snd_off": [
  "♪ 音なし",
  "♪ Sound off",
  "♪ 靜音",
  "♪ 소리 끔"
 ],
 "share_btn": [
  "投稿する",
  "Share",
  "分享",
  "공유하기"
 ],
 "share_s": [
  "投稿",
  "Share",
  "分享",
  "공유"
 ],
 "total": [
  "これまでの屍",
  "Total corpses",
  "至今的屍體",
  "지금까지의 시체"
 ],
 "home2": [
  "なすびのお庭",
  "Nasubi's Garden (more games)",
  "茄子的庭院（更多遊戲）",
  "가지의 정원 (다른 게임)"
 ],
 "sel_back": [
  "◀ もどる",
  "◀ Back",
  "◀ 返回",
  "◀ 돌아가기"
 ],
 "sel_title": [
  "層をえらぶ",
  "Choose a floor",
  "選擇樓層",
  "층 선택"
 ],
 "sel_note": [
  "開いた層だけ入れます。前の層は「練習」、越えられた層は「見る」で道をながめられます。",
  "Only open floors can be entered. Earlier floors are for practice, and cleared floors can be viewed with “Watch”.",
  "只能進入已開放的層。之前的層可以「練習」，已被越過的層可以用「觀看」欣賞道路。",
  "열린 층만 들어갈 수 있어요. 이전 층은 '연습', 누군가 넘은 층은 '보기'로 길을 구경할 수 있어요."
 ],
 "h_fl_pre": [
  "第",
  "Floor ",
  "第",
  ""
 ],
 "h_fl_post": [
  "層",
  "",
  "層",
  "층"
 ],
 "h_dead": [
  "屍",
  "Dead",
  "屍",
  "시체"
 ],
 "sec": [
  "{s}秒",
  "{s}s",
  "{s}秒",
  "{s}초"
 ],
 "help_btn": [
  "？",
  "?",
  "？",
  "?"
 ],
 "stuck_btn": [
  "詰んだ？",
  "Stuck?",
  "卡關了？",
  "막혔어?"
 ],
 "w_replay": [
  "はじめて越えた人の走り",
  "First clear run",
  "首位越過者的跑法",
  "처음 넘은 사람의 달리기"
 ],
 "w_mine": [
  "自分の走り",
  "My run",
  "自己的跑法",
  "내 달리기"
 ],
 "w_free": [
  "自由に見る",
  "Free look",
  "自由觀看",
  "자유롭게 보기"
 ],
 "w_hint": [
  "← → か、ドラッグで動かせます",
  "← → or drag to move",
  "用 ← → 或拖曳移動",
  "← → 또는 드래그로 이동"
 ],
 "left_a": [
  "左へ",
  "Left",
  "向左",
  "왼쪽"
 ],
 "right_a": [
  "右へ",
  "Right",
  "向右",
  "오른쪽"
 ],
 "jump": [
  "ジャンプ",
  "JUMP",
  "跳躍",
  "점프"
 ],
 "counting": [
  "屍を数えています…",
  "Counting the dead…",
  "正在清點屍體…",
  "시체를 세는 중…"
 ],
 "fm_play0": [
  "挑む",
  "Challenge",
  "挑戰",
  "도전"
 ],
 "fm_watch": [
  "見る（スペクター）",
  "Watch (spectate)",
  "觀看（觀戰）",
  "보기 (관전)"
 ],
 "fm_mine": [
  "自分の最速の走りを見る",
  "Watch my fastest run",
  "觀看自己最快的跑法",
  "내 최고 기록 보기"
 ],
 "cl_mine": [
  "自分の走りを見なおす",
  "Rewatch my run",
  "重看自己的跑法",
  "내 달리기 다시 보기"
 ],
 "first_note": [
  "あなたが<b>はじめて越えた人</b>です。<br>到達者の碑に、XのIDを残しますか？（なくてもよい）",
  "You are the <b>first to clear</b> this floor.<br>Leave your X ID on the Pioneers stone? (optional)",
  "你是<b>第一個越過的人</b>。<br>要在到達者之碑留下X的ID嗎？（可不填）",
  "당신이 <b>처음 넘은 사람</b>입니다.<br>도달자의 비석에 X 아이디를 남길까요? (선택)"
 ],
 "id_ph": [
  "IDを入れる",
  "Enter ID",
  "輸入ID",
  "아이디 입력"
 ],
 "engrave": [
  "刻む",
  "Engrave",
  "刻上",
  "새기기"
 ],
 "skip_anon": [
  "残さない（無名）",
  "Skip (anonymous)",
  "不留（無名）",
  "남기지 않기 (무명)"
 ],
 "id_warn": [
  "※IDが本人のものかは確かめられません。",
  "* We can't verify that the ID is really yours.",
  "※無法確認ID是否為本人。",
  "※아이디가 본인 것인지는 확인할 수 없어요."
 ],
 "retry": [
  "もう一度",
  "Retry",
  "再一次",
  "한 번 더"
 ],
 "all_done_t": [
  "全100層 制覇",
  "All 100 Floors Cleared",
  "全100層 制霸",
  "전 100층 제패"
 ],
 "end_name": [
  "エンドロールに載せる名前<br><small>（あなたの画面にだけ出ます）</small>",
  "Your name for the credits<br><small>(shown only on your screen)</small>",
  "要放進片尾名單的名字<br><small>（只會顯示在你的畫面上）</small>",
  "엔딩 롤에 올릴 이름<br><small>(당신의 화면에만 나와요)</small>"
 ],
 "end_name_a": [
  "エンドロールに載せる名前",
  "Your name for the credits",
  "要放進片尾名單的名字",
  "엔딩 롤에 올릴 이름"
 ],
 "x_ph": [
  "XのID（なくてもよい）",
  "X ID (optional)",
  "X的ID（可不填）",
  "X 아이디 (선택)"
 ],
 "to_end": [
  "エンドロールへ",
  "To the credits",
  "前往片尾",
  "엔딩으로"
 ],
 "end_rp_a": [
  "最初に頂を越えた人の動き",
  "Run of the first to cross the summit",
  "最先越過頂峰之人的動作",
  "처음 정상을 넘은 사람의 움직임"
 ],
 "skip": [
  "とばす",
  "Skip",
  "跳過",
  "건너뛰기"
 ],
 "live_h": [
  "🔴 配信中",
  "🔴 Live now",
  "🔴 直播中",
  "🔴 방송 중"
 ],
 "live_tap": [
  "タップすると、配信のページが開きます。",
  "Tap to open the stream page.",
  "點擊即可開啟直播頁面。",
  "탭하면 방송 페이지가 열려요."
 ],
 "stuck_send": [
  "管理人に知らせる",
  "Tell the admin",
  "通知管理員",
  "관리자에게 알리기"
 ],
 "sh_tip": [
  "画像もつけたいときは、先に「画像を保存」を押してから「Xに投稿」を押し、投稿画面で保存した画像をつけてください。",
  "To add the image, first tap “Save image”, then “Post to X”, and attach the saved image on the post screen.",
  "想附上圖片時，請先按「儲存圖片」，再按「發佈到X」，然後在發文畫面附上儲存的圖片。",
  "이미지도 올리려면 먼저 '이미지 저장'을 누른 뒤 'X에 게시'를 누르고, 게시 화면에서 저장한 이미지를 첨부하세요."
 ],
 "sh_save": [
  "① 画像を保存",
  "① Save image",
  "① 儲存圖片",
  "① 이미지 저장"
 ],
 "sh_post": [
  "② Xに投稿",
  "② Post to X",
  "② 發佈到X",
  "② X에 게시"
 ],
 "got_it": [
  "わかった",
  "Got it",
  "知道了",
  "알겠어"
 ],
 "how1": [
  "あなたは名もなきキューブ。挑むたびに<b>ちがう名前</b>になる。チェックポイントはない。",
  "You are a nameless cube. Every try gives you a <b>different name</b>. There are no checkpoints.",
  "你是一個無名的方塊。每次挑戰都會得到<b>不同的名字</b>。沒有中途存檔點。",
  "당신은 이름 없는 큐브. 도전할 때마다 <b>다른 이름</b>이 된다. 체크포인트는 없다."
 ],
 "how2": [
  "死ぬと、その場所に<b>屍</b>が残って<b>足場</b>になる。穴に落ちれば底に積もり、トゲの上ならトゲをふさぐ。水には浮き、流砂には沈み、毒の花では溶ける。",
  "When you die, your <b>corpse</b> stays there and becomes a <b>foothold</b>. Fall into a pit and it piles at the bottom; die on spikes and it covers them. Corpses float on water, sink in quicksand, and melt on poison flowers.",
  "死掉後，那個位置會留下<b>屍體</b>，成為<b>立足點</b>。掉進洞裡就堆在洞底，死在尖刺上就能蓋住尖刺。屍體會浮在水上、沉入流沙、被毒花溶掉。",
  "죽으면 그 자리에 <b>시체</b>가 남아 <b>발판</b>이 된다. 구멍에 떨어지면 바닥에 쌓이고, 가시 위라면 가시를 막는다. 물에는 뜨고, 유사에는 가라앉고, 독꽃에는 녹는다."
 ],
 "how3": [
  "屍は<b>全員で共有</b>。あなたの屍はすぐに、ほかの人の屍は入りなおすと現れる。",
  "Corpses are <b>shared by everyone</b>. Yours appear right away; other players' appear when you re-enter.",
  "屍體由<b>所有人共享</b>。你的屍體會馬上出現，其他人的屍體在重新進入後出現。",
  "시체는 <b>모두가 공유</b>. 내 시체는 바로, 다른 사람의 시체는 다시 들어가면 나타난다."
 ],
 "how4": [
  "屍の列には<b>積める高さの上限</b>がある。こえた屍は消える（赤い印が上限のしるし）。",
  "Each column has a <b>height limit</b> for corpses. Extra corpses vanish (the red mark shows the limit).",
  "每一列屍體都有<b>可堆疊的高度上限</b>。超過的屍體會消失（紅色記號就是上限）。",
  "시체 줄에는 <b>쌓을 수 있는 높이 제한</b>이 있다. 넘는 시체는 사라진다 (빨간 표시가 한계)."
 ],
 "how5": [
  "<b>吊り天井</b>の下で死ぬと、屍がはさまる。下の列が屍で埋まると、天井は止まって動かなくなる（第21層から）。第25層からは、止まった天井に<b>はしご</b>がかかる（ジャンプを押し続けると登れる）。",
  "Die under a <b>crushing ceiling</b> and your corpse gets wedged. Once the row below fills with corpses, the ceiling stops for good (from Floor 21). From Floor 25, stopped ceilings get a <b>ladder</b> (hold jump to climb).",
  "死在<b>吊天花板</b>下，屍體會被夾住。下面那一排被屍體填滿後，天花板就會停住不動（第21層起）。第25層起，停住的天花板會掛上<b>梯子</b>（按住跳躍就能爬）。",
  "<b>내려오는 천장</b> 밑에서 죽으면 시체가 끼인다. 아래 줄이 시체로 채워지면 천장은 멈춰서 움직이지 않는다 (21층부터). 25층부터는 멈춘 천장에 <b>사다리</b>가 걸린다 (점프를 계속 누르면 올라간다)."
 ],
 "how6": [
  "攻撃はできない。<b>よけて進め</b>。魔物は低い屍なら越えてくるが、<b>高い屍の壁は越えられない</b>。",
  "You can't attack. <b>Dodge and push on</b>. Monsters climb over low corpses, but <b>can't cross a high wall of corpses</b>.",
  "無法攻擊。<b>閃避前進</b>。魔物能越過低的屍體，但<b>越不過高高的屍牆</b>。",
  "공격은 할 수 없다. <b>피해서 나아가라</b>. 마물은 낮은 시체는 넘어오지만 <b>높은 시체 벽은 넘지 못한다</b>."
 ],
 "how7": [
  "5層ごとに<b>番人</b>がいる。倒せない。赤く光った所に何かが来る。",
  "Every 5 floors there is a <b>Warden</b>. It can't be defeated. Something strikes where the red glow appears.",
  "每5層有一個<b>守門人</b>。無法打倒。發出紅光的地方會有東西襲來。",
  "5층마다 <b>파수꾼</b>이 있다. 쓰러뜨릴 수 없다. 빨갛게 빛난 곳에 무언가가 온다."
 ],
 "how8": [
  "だれかが越えると、すぐに<b>次の層が開く</b>。みんなで最新の層に挑もう。全100層。",
  "When anyone clears a floor, <b>the next floor opens</b> right away. Take on the newest floor together. 100 floors in all.",
  "只要有人越過，<b>下一層馬上開放</b>。大家一起挑戰最新的層吧。共100層。",
  "누군가 넘으면 바로 <b>다음 층이 열린다</b>. 모두 함께 최신 층에 도전하자. 전 100층."
 ],
 "how9": [
  "どうしても進めない（詰んだ）と思ったら<b>「詰んだ？」</b>ボタン。",
  "If you think there's truly no way forward, press the <b>“Stuck?”</b> button.",
  "如果覺得怎樣都過不去（卡關了），就按<b>「卡關了？」</b>按鈕。",
  "도저히 못 나아가겠다(막혔다) 싶으면 <b>\"막혔어?\"</b> 버튼."
 ],
 "how_k": [
  "操作：← → で移動、↑ / スペース でジャンプ（長く押すと高くとぶ）<br>スマホ：画面下のボタン　／　屍をタップすると名前",
  "Controls: ← → to move, ↑ / Space to jump (hold to jump higher)<br>Phone: buttons at the bottom / tap a corpse to see its name",
  "操作：← → 移動，↑ / 空白鍵 跳躍（長按跳更高）<br>手機：畫面下方的按鈕　／　點屍體可看名字",
  "조작: ← → 이동, ↑ / 스페이스 점프 (길게 누르면 높이 뜀)<br>스마트폰: 화면 아래 버튼 / 시체를 탭하면 이름"
 ],
 "fl": [
  "第{n}層",
  "Floor {n}",
  "第{n}層",
  "{n}층"
 ],
 "fl_b": [
  "第<b>{n}</b>層",
  "Floor <b>{n}</b>",
  "第<b>{n}</b>層",
  "<b>{n}</b>층"
 ],
 "sp": [
  "　",
  " · ",
  "　",
  " · "
 ],
 "dot": [
  "・",
  " · ",
  "・",
  " · "
 ],
 "all_done": [
  "全100層　制覇",
  "All 100 floors cleared",
  "全100層　制霸",
  "전 100층 제패"
 ],
 "summit": [
  "頂",
  "Summit",
  "頂峰",
  "정상"
 ],
 "anon": [
  "名無し",
  "Nameless",
  "無名氏",
  "이름 없음"
 ],
 "anonymous": [
  "無名",
  "Anonymous",
  "無名",
  "무명"
 ],
 "tk_live": [
  "🔴 {n}さんが配信中",
  "🔴 {n} is live",
  "🔴 {n} 正在直播",
  "🔴 {n} 님이 방송 중"
 ],
 "paren": [
  "（{m}）",
  " ({m})",
  "（{m}）",
  " ({m})"
 ],
 "tk_open": [
  "{a}　第{n}層が開いた ── 第{f}層を越えたのは「{w}」",
  "{a}  Floor {n} opened — Floor {f} was cleared by “{w}”",
  "{a}　第{n}層開放了 ── 越過第{f}層的是「{w}」",
  "{a}  {n}층이 열렸다 ── {f}층을 넘은 사람은 \"{w}\""
 ],
 "tk_none": [
  "まだだれも第1層を越えていない。最初の屍になれ。",
  "No one has cleared Floor 1 yet. Be the first corpse.",
  "還沒有人越過第1層。成為第一具屍體吧。",
  "아직 아무도 1층을 넘지 못했다. 첫 시체가 되어라."
 ],
 "just_now": [
  "たった今",
  "just now",
  "剛剛",
  "방금"
 ],
 "min_ago": [
  "{n}分前",
  "{n}m ago",
  "{n}分鐘前",
  "{n}분 전"
 ],
 "hr_ago": [
  "{n}時間前",
  "{n}h ago",
  "{n}小時前",
  "{n}시간 전"
 ],
 "day_ago": [
  "{n}日前",
  "{n}d ago",
  "{n}天前",
  "{n}일 전"
 ],
 "e_all": [
  "全100層",
  "All 100 floors",
  "全100層",
  "전 100층"
 ],
 "dh": [
  "{d}日{h}時間",
  "{d}d {h}h",
  "{d}天{h}小時",
  "{d}일 {h}시간"
 ],
 "e_dead": [
  "みんなの屍",
  "Everyone's corpses",
  "大家的屍體",
  "모두의 시체"
 ],
 "people": [
  "{n}人",
  "{n}",
  "{n}人",
  "{n}명"
 ],
 "e_hero": [
  "到達者",
  "Pioneers",
  "到達者",
  "도달자"
 ],
 "hardest": [
  "最難関",
  "Hardest",
  "最難關",
  "최난관"
 ],
 "sleep_here": [
  "{n}人が、ここで眠る",
  "{n} rest here",
  "{n}人長眠於此",
  "{n}명이 여기 잠들다"
 ],
 "first_top": [
  "最初に頂を越えた者",
  "First to cross the summit",
  "最先越過頂峰的人",
  "처음 정상을 넘은 자"
 ],
 "fast_top": [
  "最速で頂を越えた者",
  "Fastest to cross the summit",
  "最快越過頂峰的人",
  "가장 빨리 정상을 넘은 자"
 ],
 "corpses_then": [
  "そのときの屍 {n}個",
  "Corpses at the time: {n}",
  "當時的屍體 {n}個",
  "당시 시체 {n}개"
 ],
 "cleared_by": [
  "クリアした者",
  "Cleared by",
  "通關者",
  "클리어한 자"
 ],
 "fastest": [
  "最速",
  "Fastest",
  "最快",
  "최고 기록"
 ],
 "my_rec": [
  "あなたの記録",
  "Your record",
  "你的紀錄",
  "당신의 기록"
 ],
 "my_dead": [
  "あなたの屍",
  "Your corpses",
  "你的屍體",
  "당신의 시체"
 ],
 "unit_p": [
  "人",
  "",
  "人",
  "명"
 ],
 "my_clr": [
  "越えた層",
  "Floors cleared",
  "越過的層",
  "넘은 층"
 ],
 "unit_f": [
  "層",
  "",
  "層",
  "층"
 ],
 "highest": [
  "いちばん高く",
  "Highest",
  "最高到達",
  "최고 도달"
 ],
 "my_foot": [
  "あなたの屍も、だれかの足場になった",
  "Your corpses, too, became someone's foothold",
  "你的屍體，也成為了某人的立足點",
  "당신의 시체도 누군가의 발판이 되었다"
 ],
 "close2": [
  "とじる",
  "Close",
  "關閉",
  "닫기"
 ],
 "niconico": [
  "ニコニコ",
  "Niconico",
  "niconico",
  "니코니코"
 ],
 "twitcas": [
  "ツイキャス",
  "TwitCasting",
  "TwitCasting",
  "트위캐스"
 ],
 "live_who": [
  "<b>{n}</b> さん",
  "<b>{n}</b>",
  "<b>{n}</b>",
  "<b>{n}</b> 님"
 ],
 "no_live": [
  "いまは配信中の人はいません。",
  "No one is streaming right now.",
  "目前沒有人在直播。",
  "지금은 방송 중인 사람이 없어요."
 ],
 "live_start": [
  "🔴 {n}さんが配信を始めました",
  "🔴 {n} started streaming",
  "🔴 {n} 開始直播了",
  "🔴 {n} 님이 방송을 시작했어요"
 ],
 "live_sub": [
  "右上の🔴から見に行けます",
  "Watch via 🔴 at the top right",
  "可以從右上的🔴前往觀看",
  "오른쪽 위 🔴에서 볼 수 있어요"
 ],
 "clr_mark": [
  "越",
  "✓",
  "越",
  "✓"
 ],
 "fm_dead": [
  "死んだ数",
  "Deaths",
  "死亡數",
  "죽은 수"
 ],
 "fm_clr": [
  "越えた人",
  "Cleared",
  "越過人數",
  "넘은 사람"
 ],
 "warden_c": [
  "番人：",
  "Warden: ",
  "守門人：",
  "파수꾼: "
 ],
 "first_c": [
  "はじめて越えた人：",
  "First clear: ",
  "首位越過者：",
  "처음 넘은 사람: "
 ],
 "my_c": [
  "あなたの記録：",
  "Your record: ",
  "你的紀錄：",
  "내 기록: "
 ],
 "play_latest": [
  "挑む（最新の層）",
  "Challenge (latest)",
  "挑戰（最新的層）",
  "도전 (최신 층)"
 ],
 "practice_do": [
  "練習する",
  "Practice",
  "練習",
  "연습하기"
 ],
 "watch": [
  "見る",
  "Watch",
  "觀看",
  "보기"
 ],
 "practice": [
  "練習",
  "Practice",
  "練習",
  "연습"
 ],
 "load_fail": [
  "読みこめませんでした",
  "Couldn't load",
  "無法讀取",
  "불러오지 못했어요"
 ],
 "load_fail_sub": [
  "電波のよいところでもう一度",
  "Try again with a better signal",
  "請在訊號好的地方再試一次",
  "신호가 좋은 곳에서 다시 시도해 주세요"
 ],
 "cells_fail": [
  "みんなの屍を読みこめませんでした",
  "Couldn't load everyone's corpses",
  "無法讀取大家的屍體",
  "모두의 시체를 불러오지 못했어요"
 ],
 "cells_fail_sub": [
  "この端末の分だけで遊べます",
  "You can play with this device's corpses only",
  "只能用這台裝置的屍體遊玩",
  "이 기기의 시체만으로 플레이할 수 있어요"
 ],
 "my_run_t": [
  "あなた「{n}」の走り（{s}）",
  "Your run as “{n}” ({s})",
  "你「{n}」的跑法（{s}）",
  "나 \"{n}\"의 달리기 ({s})"
 ],
 "fastest_run": [
  "最速の走り",
  "Your fastest run",
  "最快的跑法",
  "최고 기록 달리기"
 ],
 "not_fast": [
  "最速ではないので、タイトルに戻ると消えます",
  "Not your fastest, so it disappears when you go back to the title",
  "不是最快的，回到標題後就會消失",
  "최고 기록이 아니라서 타이틀로 돌아가면 사라져요"
 ],
 "first_run_t": [
  "はじめて越えた「{n}」の走り",
  "First clear: “{n}”",
  "首位越過者「{n}」的跑法",
  "처음 넘은 \"{n}\"의 달리기"
 ],
 "first_run_sub": [
  "屍は「そのときの屍」です",
  "Corpses are shown as they were then",
  "屍體是「當時的屍體」",
  "시체는 \"당시의 시체\"예요"
 ],
 "goal_t": [
  "「{n}」 ゴール！",
  "“{n}” reached the goal!",
  "「{n}」 抵達終點！",
  "\"{n}\" 골인!"
 ],
 "rec_end": [
  "記録はここまで",
  "End of the record",
  "紀錄到此為止",
  "기록은 여기까지"
 ],
 "zap": [
  "電気の梯子",
  "Electric ladder",
  "帶電的梯子",
  "전기 사다리"
 ],
 "zap_tip2": [
  "電気の玉が下りてきて消えたら、すぐ昇れ",
  "When the electric orb comes down and fades, climb right away",
  "電球降下並消失後，立刻往上爬",
  "전기 구슬이 내려와 사라지면 바로 올라가라"
 ],
 "zap_tip1": [
  "黄色く光ったら、電気が流れる",
  "When it glows yellow, current flows",
  "發出黃光時，就會通電",
  "노랗게 빛나면 전기가 흐른다"
 ],
 "gate_w": [
  "関門の番人　",
  "Gate Warden: ",
  "關卡守門人　",
  "관문 파수꾼 "
 ],
 "warden_sp": [
  "番人　",
  "Warden: ",
  "守門人　",
  "파수꾼 "
 ],
 "cant_beat": [
  "倒せない。よけて、越えろ",
  "Unbeatable. Dodge it and get past",
  "無法打倒。閃開，越過去",
  "쓰러뜨릴 수 없다. 피해서 넘어라"
 ],
 "k_spike": [
  "トゲ",
  "spikes",
  "尖刺",
  "가시"
 ],
 "k_lava": [
  "溶岩",
  "lava",
  "熔岩",
  "용암"
 ],
 "k_poison": [
  "毒の花",
  "a poison flower",
  "毒花",
  "독꽃"
 ],
 "k_sand": [
  "流砂",
  "quicksand",
  "流沙",
  "유사"
 ],
 "k_pit": [
  "奈落",
  "the abyss",
  "深淵",
  "나락"
 ],
 "k_crush": [
  "落ちる天井",
  "a falling ceiling",
  "落下的天花板",
  "떨어지는 천장"
 ],
 "k_saw": [
  "回る刃",
  "a spinning blade",
  "旋轉刀刃",
  "회전 칼날"
 ],
 "k_fire": [
  "炎",
  "fire",
  "火焰",
  "불꽃"
 ],
 "k_bolt": [
  "雷",
  "lightning",
  "雷電",
  "번개"
 ],
 "k_zap": [
  "電気の梯子",
  "the electric ladder",
  "帶電的梯子",
  "전기 사다리"
 ],
 "k_water": [
  "水",
  "water",
  "水",
  "물"
 ],
 "k_enemy": [
  "魔物",
  "a monster",
  "魔物",
  "마물"
 ],
 "k_boss": [
  "番人",
  "the Warden",
  "守門人",
  "파수꾼"
 ],
 "by_kind": [
  "{k}で",
  "Killed by {k}",
  "死於{k}",
  "{k}에 당함"
 ],
 "v_cap": [
  "ここはもう屍が積めない。屍は消えた",
  "No room to pile corpses here. Your corpse vanished",
  "這裡已經堆不下屍體。屍體消失了",
  "여기는 더 이상 시체를 쌓을 수 없다. 시체는 사라졌다"
 ],
 "v_fall": [
  "奈落に落ちた。屍は残らない",
  "Fell into the abyss. No corpse remains",
  "掉進了深淵。不會留下屍體",
  "나락에 떨어졌다. 시체는 남지 않는다"
 ],
 "v_poison": [
  "毒の花で屍が溶けた",
  "A poison flower melted your corpse",
  "屍體被毒花溶掉了",
  "독꽃에 시체가 녹았다"
 ],
 "v_zap": [
  "電気の梯子でしびれた。屍は残らない",
  "Shocked on the electric ladder. No corpse remains",
  "在帶電的梯子上觸電了。不會留下屍體",
  "전기 사다리에 감전됐다. 시체는 남지 않는다"
 ],
 "near_sleep": [
  "となりには「{n}」が眠っている",
  "“{n}” rests next to you",
  "旁邊長眠著「{n}」",
  "옆에는 \"{n}\"이(가) 잠들어 있다"
 ],
 "foothold": [
  "ここが、あとから来る者の足場になる",
  "This spot becomes a foothold for those who follow",
  "這裡將成為後來者的立足點",
  "이곳이 뒤에 올 자의 발판이 된다"
 ],
 "died": [
  "{n}は死んだンゴ",
  "{n} died",
  "{n}死掉了",
  "{n} 사망"
 ],
 "kept_best": [
  "最速の走りとして、この端末に残ります",
  "Saved on this device as your fastest run",
  "作為最快的跑法保存在這台裝置",
  "최고 기록으로 이 기기에 남아요"
 ],
 "not_fast2": [
  "最速ではないので、この映像はタイトルに戻ると削除されます",
  "Not your fastest, so this replay is deleted when you go back to the title",
  "不是最快的，回到標題後這段影像會被刪除",
  "최고 기록이 아니라서 타이틀로 돌아가면 이 영상은 삭제돼요"
 ],
 "cl_big": [
  "<b>{n}</b>人の屍を超えて<br>第{f}層突破！",
  "Over <b>{n}</b> corpses,<br>Floor {f} cleared!",
  "越過<b>{n}</b>具屍體<br>突破第{f}層！",
  "<b>{n}</b>명의 시체를 넘어<br>{f}층 돌파!"
 ],
 "pb": [
  "（自己ベスト {s}）",
  " (best {s})",
  "（個人最佳 {s}）",
  " (최고 {s})"
 ],
 "to_next": [
  "第{n}層へ",
  "To Floor {n}",
  "前往第{n}層",
  "{n}층으로"
 ],
 "sending": [
  "記録を送っています…",
  "Sending your record…",
  "正在傳送紀錄…",
  "기록을 보내는 중…"
 ],
 "all_clear": [
  "シインクラッド、完全制覇。",
  "SHIINCRAD, fully conquered.",
  "SHIINCRAD，完全制霸。",
  "SHIINCRAD 완전 제패."
 ],
 "opened": [
  "第{n}層が、いま開いた。",
  "Floor {n} is now open.",
  "第{n}層，現在開放了。",
  "{n}층이 지금 열렸다."
 ],
 "beaten": [
  "ひと足先に越えた人がいました。あなたの記録も残りました",
  "Someone got there just before you. Your record was saved too",
  "有人比你早一步越過了。你的紀錄也保存了",
  "한발 먼저 넘은 사람이 있었어요. 당신의 기록도 남았어요"
 ],
 "send_fail": [
  "記録を送れませんでした（混みあっているか、電波が弱いです）。「刻む」を押すと、もう一度送ります",
  "Couldn't send your record (busy or weak signal). Press “Engrave” to send it again",
  "無法傳送紀錄（可能是人多擁擠或訊號弱）。按「刻上」會再傳送一次",
  "기록을 보내지 못했어요 (혼잡하거나 신호가 약해요). \"새기기\"를 누르면 다시 보내요"
 ],
 "nm_need": [
  "名前を入れてください",
  "Enter a name",
  "請輸入名字",
  "이름을 입력해 주세요"
 ],
 "nm_bad": [
  "その名前は使えません",
  "That name can't be used",
  "這個名字不能使用",
  "그 이름은 쓸 수 없어요"
 ],
 "x_bad": [
  "XのIDの形がちがいます（英数字と _ で15文字まで）",
  "Invalid X ID (up to 15 letters, numbers and _)",
  "X的ID格式不對（英數字和 _，最多15字）",
  "X 아이디 형식이 달라요 (영문·숫자와 _ 로 15자까지)"
 ],
 "id_bad": [
  "IDの形がちがいます",
  "Invalid ID",
  "ID格式不對",
  "아이디 형식이 달라요"
 ],
 "id_rule": [
  "英数字と _ で15文字まで",
  "Up to 15 letters, numbers and _",
  "英數字和 _，最多15字",
  "영문·숫자와 _ 로 15자까지"
 ],
 "resending": [
  "記録をもう一度送っています…",
  "Sending your record again…",
  "正在重新傳送紀錄…",
  "기록을 다시 보내는 중…"
 ],
 "send_ng": [
  "送れませんでした",
  "Couldn't send",
  "無法傳送",
  "보내지 못했어요"
 ],
 "busy_retry": [
  "混みあっています。少し待ってもう一度",
  "It's busy. Wait a bit and try again",
  "目前擁擠。請稍等再試一次",
  "혼잡해요. 잠시 후 다시 시도해 주세요"
 ],
 "still_sending": [
  "記録を送っている途中です",
  "Still sending your record",
  "紀錄還在傳送中",
  "기록을 보내는 중이에요"
 ],
 "wait_retry": [
  "少し待ってもう一度",
  "Wait a bit and try again",
  "請稍等再試一次",
  "잠시 후 다시 시도해 주세요"
 ],
 "engraved": [
  "碑に刻みました",
  "Engraved on the stone",
  "已刻上石碑",
  "비석에 새겼어요"
 ],
 "write_ng": [
  "書きこめませんでした",
  "Couldn't write it",
  "無法寫入",
  "기록하지 못했어요"
 ],
 "as_anon": [
  "「無名」として刻まれます",
  "You'll be engraved as “Anonymous”",
  "將以「無名」刻上",
  "\"무명\"으로 새겨져요"
 ],
 "checking": [
  "しらべています…",
  "Checking…",
  "檢查中…",
  "확인하는 중…"
 ],
 "ok_path": [
  "しらべたところ、<b>まだゴールまで行ける道</b>があります。<br>あきらめずに挑んでください。",
  "We checked: <b>there is still a path to the goal</b>.<br>Don't give up!",
  "檢查結果：<b>還有能到終點的路</b>。<br>請不要放棄，繼續挑戰。",
  "확인해 보니 <b>아직 골까지 갈 수 있는 길</b>이 있어요.<br>포기하지 말고 도전해 주세요."
 ],
 "is_stuck": [
  "しらべたところ、<b>詰んでいるかもしれません</b>（{p}%の所で止まる）。<br>管理人に知らせますか？確かめて、この層の屍を消すことがあります。",
  "We checked: <b>this floor may be stuck</b> (it stops at {p}%).<br>Tell the admin? After checking, they may clear this floor's corpses.",
  "檢查結果：<b>可能卡關了</b>（停在{p}%的地方）。<br>要通知管理員嗎？確認後可能會清除這一層的屍體。",
  "확인해 보니 <b>막혔을지도 몰라요</b> ({p}% 지점에서 멈춤).<br>관리자에게 알릴까요? 확인 후 이 층의 시체를 지울 수 있어요."
 ],
 "cand": [
  "まだ屍を積める場所が <b>{c}</b> か所あります（{p}%の所まで行けます）。<br>みんなで死ねば、道はできるかもしれません。<br>それでも詰んでいると思ったら、知らせてください。",
  "There are still <b>{c}</b> spots to pile corpses (you can reach {p}%).<br>If everyone dies there, a path may form.<br>If you still think it's stuck, let us know.",
  "還有 <b>{c}</b> 個可以堆屍體的地方（可以走到{p}%）。<br>大家一起死，也許就能開出路來。<br>如果還是覺得卡關了，請通知我們。",
  "아직 시체를 쌓을 수 있는 곳이 <b>{c}</b>곳 있어요 ({p}% 지점까지 갈 수 있어요).<br>모두 함께 죽으면 길이 생길지도 몰라요.<br>그래도 막혔다고 생각되면 알려 주세요."
 ],
 "reported": [
  "知らせました。ありがとうございます。",
  "Reported. Thank you!",
  "已通知。謝謝你。",
  "알렸어요. 고마워요."
 ],
 "send_ng2": [
  "送れませんでした。",
  "Couldn't send.",
  "無法傳送。",
  "보내지 못했어요."
 ],
 "pop_many": [
  "<b>{l}</b> ほか<br>ここで <b>{n}</b> 人が死んだ",
  "<b>{l}</b> and others<br><b>{n}</b> died here",
  "<b>{l}</b> 等人<br>有 <b>{n}</b> 人死在這裡",
  "<b>{l}</b> 외<br>여기서 <b>{n}</b>명이 죽었다"
 ],
 "pop_one": [
  "<b>{l}</b><br>ここで死んだ",
  "<b>{l}</b><br>died here",
  "<b>{l}</b><br>死在這裡",
  "<b>{l}</b><br>여기서 죽었다"
 ],
 "verifying": [
  "記録を確かめています",
  "Verifying the record",
  "正在確認紀錄",
  "기록을 확인하는 중"
 ],
 "auto_play": [
  "確かめ終わったら、自動で流れます",
  "It will play once verified",
  "確認完成後會自動播放",
  "확인이 끝나면 자동으로 재생돼요"
 ],
 "verify_ng": [
  "はじめて越えた記録を確かめられませんでした",
  "Couldn't verify the first-clear record",
  "無法確認首位越過的紀錄",
  "처음 넘은 기록을 확인하지 못했어요"
 ],
 "grave_note": [
  "ここに眠る {a} の屍のうち、新しい {b} 人。",
  "The newest {b} of the {a} corpses resting here.",
  "長眠於此的 {a} 具屍體中，最新的 {b} 人。",
  "여기 잠든 {a}구의 시체 중 최근 {b}명."
 ],
 "hero_note": [
  "各層をはじめて越えた者。XのIDは本人の申告で、本当にその人かは確かめていません。",
  "The first to clear each floor. X IDs are self-reported and not verified.",
  "最先越過各層的人。X的ID為本人自行填寫，並未確認是否真的是本人。",
  "각 층을 처음 넘은 자. X 아이디는 본인 신고이며, 정말 그 사람인지는 확인하지 않았어요."
 ],
 "nobody": [
  "まだだれもいない",
  "No one yet",
  "還沒有人",
  "아직 아무도 없다"
 ],
 "tags": [
  "#シインクラッド",
  "#SHIINCRAD #シインクラッド",
  "#SHIINCRAD #シインクラッド",
  "#SHIINCRAD #シインクラッド"
 ],
 "sh_clear": [
  "{d}人の屍を超えて、第{f}層突破！\n名前は「{n}」{s}\n誰か続いてくれ！",
  "Over {d} corpses, I cleared Floor {f}!\nMy name was “{n}” — {s}\nSomeone follow me!",
  "越過{d}具屍體，突破第{f}層！\n名字是「{n}」{s}\n誰來跟上吧！",
  "{d}명의 시체를 넘어 {f}층 돌파!\n이름은 \"{n}\" {s}\n누가 뒤따라 와 줘!"
 ],
 "sh_prog": [
  "シインクラッド第{f}層の{p}%地点に到達！\n{dd}誰か助けてくれ！",
  "Reached {p}% of Floor {f} in SHIINCRAD!\n{dd}Someone help me!",
  "在SHIINCRAD第{f}層到達了{p}%的地點！\n{dd}誰來幫幫我！",
  "SHIINCRAD {f}층의 {p}% 지점에 도달!\n{dd}누가 좀 도와줘!"
 ],
 "sh_died": [
  "{n}回死んだ。",
  "Died {n} times. ",
  "死了{n}次。",
  "{n}번 죽었다. "
 ],
 "sh_title": [
  "シインクラッド　いま第{f}層。みんなの屍は{d}人。\n誰か助けてくれ！",
  "SHIINCRAD: now on Floor {f}. {d} corpses so far.\nSomeone help!",
  "SHIINCRAD　目前第{f}層。大家的屍體有{d}具。\n誰來幫幫我！",
  "SHIINCRAD 지금 {f}층. 모두의 시체는 {d}구.\n누가 좀 도와줘!"
 ],
 "img_over": [
  "{d}人の屍を超えて",
  "Over {d} corpses",
  "越過{d}具屍體",
  "{d}명의 시체를 넘어"
 ],
 "img_clear": [
  "第{f}層突破！",
  "Floor {f} cleared!",
  "突破第{f}層！",
  "{f}층 돌파!"
 ],
 "img_reach": [
  "{p}%地点に到達！",
  "Reached {p}%!",
  "到達{p}%地點！",
  "{p}% 지점 도달!"
 ],
 "help": [
  "誰か助けてくれ！",
  "Someone help me!",
  "誰來幫幫我！",
  "누가 좀 도와줘!"
 ],
 "img_died": [
  "ここまでに{n}回死んだ",
  "Died {n} times so far",
  "到這裡死了{n}次",
  "여기까지 {n}번 죽었다"
 ],
 "img_now": [
  "いま第{f}層。みんなの屍は{d}人。",
  "Now on Floor {f}. {d} corpses so far.",
  "目前第{f}層。大家的屍體有{d}具。",
  "지금 {f}층. 모두의 시체는 {d}구."
 ],
 "img_foot": [
  "シインクラッド　#シインクラッド",
  "SHIINCRAD  #シインクラッド",
  "SHIINCRAD　#シインクラッド",
  "SHIINCRAD  #シインクラッド"
 ],
 "N_はじまりの草原": [
  "はじまりの草原",
  "Meadow of Beginnings",
  "起始草原",
  "시작의 초원"
 ],
 "N_ささやきの森": [
  "ささやきの森",
  "Whispering Woods",
  "低語之森",
  "속삭임의 숲"
 ],
 "N_しずくの洞窟": [
  "しずくの洞窟",
  "Dripping Cave",
  "水滴洞窟",
  "물방울 동굴"
 ],
 "N_さすらいの砂丘": [
  "さすらいの砂丘",
  "Wandering Dunes",
  "流浪沙丘",
  "방랑의 사구"
 ],
 "N_ねむれる遺跡": [
  "ねむれる遺跡",
  "Sleeping Ruins",
  "沉睡遺跡",
  "잠든 유적"
 ],
 "N_しずかな湖": [
  "しずかな湖",
  "Silent Lake",
  "寂靜之湖",
  "고요한 호수"
 ],
 "N_まよいの森": [
  "まよいの森",
  "Lost Forest",
  "迷途之森",
  "미혹의 숲"
 ],
 "N_くろがね牢獄": [
  "くろがね牢獄",
  "Iron Prison",
  "玄鐵牢獄",
  "강철 감옥"
 ],
 "N_雲の回廊": [
  "雲の回廊",
  "Cloud Corridor",
  "雲之迴廊",
  "구름 회랑"
 ],
 "N_毒花の庭": [
  "毒花の庭",
  "Poison Garden",
  "毒花庭園",
  "독꽃 정원"
 ],
 "N_氷の峰": [
  "氷の峰",
  "Ice Peak",
  "冰之峰",
  "얼음 봉우리"
 ],
 "N_炎の山": [
  "炎の山",
  "Fire Mountain",
  "火焰山",
  "불꽃 산"
 ],
 "N_沈む水路": [
  "沈む水路",
  "Sunken Canal",
  "沉沒水道",
  "가라앉는 수로"
 ],
 "N_からくり工房": [
  "からくり工房",
  "Clockwork Works",
  "機關工坊",
  "태엽 공방"
 ],
 "N_闇の底": [
  "闇の底",
  "Depths of Dark",
  "黑暗之底",
  "어둠의 밑바닥"
 ],
 "N_雷雲の道": [
  "雷雲の道",
  "Thunder Road",
  "雷雲之路",
  "뇌운의 길"
 ],
 "N_鏡の間": [
  "鏡の間",
  "Hall of Mirrors",
  "鏡之間",
  "거울의 방"
 ],
 "N_混沌の層": [
  "混沌の層",
  "Chaos Floor",
  "混沌之層",
  "혼돈의 층"
 ],
 "N_天空の橋": [
  "天空の橋",
  "Sky Bridge",
  "天空之橋",
  "천공의 다리"
 ],
 "N_頂の玉座": [
  "頂の玉座",
  "Summit Throne",
  "頂之王座",
  "정상의 옥좌"
 ],
 "N_苔の番犬": [
  "苔の番犬",
  "Moss Hound",
  "苔蘚看門犬",
  "이끼 파수견"
 ],
 "N_ささやく大蛇": [
  "ささやく大蛇",
  "Whispering Serpent",
  "低語大蛇",
  "속삭이는 큰뱀"
 ],
 "N_落石の巨人": [
  "落石の巨人",
  "Rockfall Giant",
  "落石巨人",
  "낙석 거인"
 ],
 "N_砂の大顎": [
  "砂の大顎",
  "Sand Maw",
  "沙之巨顎",
  "모래 큰턱"
 ],
 "N_双頭の石像": [
  "双頭の石像",
  "Twin-Headed Statue",
  "雙頭石像",
  "쌍두 석상"
 ],
 "N_湖の主": [
  "湖の主",
  "Lord of the Lake",
  "湖之主",
  "호수의 주인"
 ],
 "N_まよいの牡鹿": [
  "まよいの牡鹿",
  "Stray Stag",
  "迷途雄鹿",
  "미혹의 수사슴"
 ],
 "N_牢番の鉄球": [
  "牢番の鉄球",
  "Jailer's Iron Ball",
  "獄卒鐵球",
  "간수의 철구"
 ],
 "N_雲の大鷲": [
  "雲の大鷲",
  "Cloud Eagle",
  "雲之巨鷲",
  "구름 큰독수리"
 ],
 "N_千の腕の仏像": [
  "千の腕の仏像",
  "Thousand-Armed Buddha",
  "千手佛像",
  "천수 불상"
 ],
 "N_氷牙の狼": [
  "氷牙の狼",
  "Icefang Wolf",
  "冰牙狼",
  "얼음송곳니 늑대"
 ],
 "N_炎の大蛇": [
  "炎の大蛇",
  "Flame Serpent",
  "火焰大蛇",
  "불꽃 큰뱀"
 ],
 "N_水路の大口": [
  "水路の大口",
  "Canal Maw",
  "水道巨口",
  "수로의 큰입"
 ],
 "N_からくり大将": [
  "からくり大将",
  "Clockwork General",
  "機關大將",
  "태엽 대장"
 ],
 "N_骨の大鎌": [
  "骨の大鎌",
  "Bone Scythe",
  "骨之巨鐮",
  "뼈의 큰낫"
 ],
 "N_雷の獣": [
  "雷の獣",
  "Thunder Beast",
  "雷獸",
  "번개 짐승"
 ],
 "N_鏡の双子": [
  "鏡の双子",
  "Mirror Twins",
  "鏡之雙子",
  "거울 쌍둥이"
 ],
 "N_混沌の王": [
  "混沌の王",
  "King of Chaos",
  "混沌之王",
  "혼돈의 왕"
 ],
 "N_天空の竜": [
  "天空の竜",
  "Sky Dragon",
  "天空之龍",
  "천공의 용"
 ],
 "N_最後の番人": [
  "最後の番人",
  "The Last Warden",
  "最後的守門人",
  "마지막 파수꾼"
 ]
};
  function pick() {
    try { var q = new URLSearchParams(location.search).get('lang'); if (q && LANGS.indexOf(q) >= 0) { try { localStorage.setItem(KEY, q); } catch (e) {} return q; } } catch (e) {}
    try { var s = localStorage.getItem(KEY); if (s && LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    var n = (navigator.language || 'ja').toLowerCase();
    if (n.indexOf('ja') === 0) return 'ja'; if (n.indexOf('ko') === 0) return 'ko'; if (n.indexOf('zh') === 0) return 'zh'; return 'en';
  }
  var L = pick();
  function t(k, v) {
    var row = D[k]; var i = LANGS.indexOf(L);
    var s = row ? (row[i] != null ? row[i] : row[0]) : k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  function koFont() {
    if (L !== 'ko' || document.getElementById('ko-font')) return;
    var l = document.createElement('link'); l.id = 'ko-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap'; document.head.appendChild(l);
  }
  function apply() {
    koFont();
    var de = document.documentElement;
    de.lang = L === 'zh' ? 'zh-Hant' : L; de.setAttribute('data-lang', L);
    document.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = t(e.dataset.i); });
    document.querySelectorAll('[data-ih]').forEach(function (e) { e.innerHTML = t(e.dataset.ih); });
    document.querySelectorAll('[data-ip]').forEach(function (e) { e.placeholder = t(e.dataset.ip); });
    document.querySelectorAll('[data-ia]').forEach(function (e) { e.setAttribute('aria-label', t(e.dataset.ia)); });
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === L ? 'true' : 'false'); });
    document.title = t('doc_title');
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('doc_desc'));
    try { document.dispatchEvent(new CustomEvent('langchange', { detail: L })); } catch (e) {}
  }
  function set(l) { if (LANGS.indexOf(l) < 0) return; L = l; try { localStorage.setItem(KEY, l); } catch (e) {} apply(); }
  function bind() {
    document.querySelectorAll('.langs button').forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.lang); }); });
    apply();
  }
  window.I18N = { t: t, set: set, apply: apply, get lang() { return L; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
