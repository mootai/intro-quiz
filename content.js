let firstPressKey = null; // 最初にカウントダウンを開始したキー（'q'または'p'）を格納する変数
let pressQueue = []; // カウントダウン中に押されたキーを保持するキュー。複数のプレイヤーが早押しした場合に備える。
let currentQueueIndex = 0; // 現在参照中のキューインデックス

// 動画の状態を定義する列挙型。現在の動画の状態を明確にするために使用。
const VideoState = {
    PLAYING: 'playing',   // 動画が再生中の状態
    PAUSED: 'paused',     // 動画が一時停止中の状態
    COUNTDOWN: 'countdown' // カウントダウンがアクティブな状態（早押し判定中）
};
let currentVideoState = VideoState.PLAYING; // 現在の動画の状態を追跡する変数。初期値は再生中と設定。

let countdownInterval = null; // カウントダウンタイマーのIDを保持する変数。これにより、必要に応じてタイマーをクリアできる。

// 早押し対象キーを拡張
const FAST_KEYS = ['q', 'p', 'a', 'z'];

// --- 新しいUI要素の作成とCSSの適用 ---

// 新しいCSSスタイルを定義。この文字列がHTMLの<style>タグとして挿入され、UI要素の見た目を定義します。
const newCss = `
:root {
    --radius: 200px; /* デフォルトの半径を定義。CSS変数として、円のサイズなどを動的に変更できるようにする */
}
body {
    display: grid;
    place-items: center; /* グリッドアイテムを中央に配置 */
    height: calc(100vh - 16px); /* ビューポートの高さからマージンを引いた高さ */
    width: calc(100vw - 16px);  /* ビューポートの幅からマージンを引いた幅 */
    grid-template-columns: repeat(5, 1fr); /* 5つの等幅カラム */
    grid-template-rows: repeat(5, 1fr);    /* 5つの等高行 */
}
#selects {
    height: 100%;
    width: 100%;
    grid-column: 1/6; /* 1列目から6列目（全体）を使用 */
    grid-row: 1/2;     /* 1行目を使用 */
    display: grid;
    align-items: center;
    justify-content: center;
    padding: 20px;
    /* このUIは開発・テスト用であり、通常は非表示 */
}
.circle {
    width: 175px; /* 内側の円の幅 */
    height: 175px; /* 内側の円の高さ */
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-column: 2/5; /* グリッドの2列目から5列目を使用 */
    grid-row: 2/5;     /* グリッドの2行目から5行目を使用 */
    background-color: black; /* 円の背景色 */
    border-radius: 50%; /* 円形にする */
    position: relative;
    z-index: 0; /* circle2の下に配置され、背景として機能 */
    /* カウントダウンタイマーの背景として機能します */
}
.circle2 {
    width: var(--radius);  /* CSS変数--radiusの値を使用 */
    height: var(--radius); /* CSS変数--radiusの値を使用 */
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-column: 2/5; /* グリッドの2列目から5列目を使用 */
    grid-row: 2/5;     /* グリッドの2行目から5行目を使用 */
    background-color: #a8e6cf; /* 円の背景色（初期のプログレスバーの色） */
    border-radius: 50%; /* 円形にする */
    position: relative;
    overflow: hidden; /* 子要素の三角がはみ出さないように隠す */
    z-index: 1; /* circleより前面に配置。これが回転するプログレスバーの本体 */
}
.triangle1, .triangle2, .triangle3, .triangle4, .triangle5, .triangle6 {
    height: auto;
    width: auto;
    display: grid;
    grid-column: 1/2; /* 親要素のグリッドセルいっぱいに広がる */
    grid-row: 1/2;
}

/* 各三角要素の::before疑似要素を使って、プログレスバーのセグメントを形成します。
   これらはtransformとborderプロパティを組み合わせて三角形を作り、
   --angle変数によって回転・拡大縮小され、プログレスバーのアニメーションを実現します。 */
.triangle1::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    /* 三角形の中心を基準に移動・回転させる */
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))));
    transform-origin: left bottom; /* 回転の中心を左下（三角形の頂点）に設定 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent; /* 右側の透明な境界 */
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61; /* 上側の色の付いた境界（三角形の色） */
}
.triangle2::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    transform-origin: left bottom;
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg)))) rotate(60deg); /* 60度回転 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent;
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61;
}
.triangle3::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    transform-origin: left bottom;
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg)))) rotate(120deg); /* 120度回転 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent;
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61;
}
.triangle4::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    transform-origin: left bottom;
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg)))) rotate(180deg); /* 180度回転 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent;
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61;
}
.triangle5::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    transform-origin: left bottom;
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg)))) rotate(240deg); /* 240度回転 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent;
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61;
}
.triangle6::before {
    content: "";
    width: 0;
    height: 0;
    grid-column: 1/2;
    grid-row: 1/2;
    transform-origin: left bottom;
    transform: translate(calc(var(--radius) / 2), calc(var(--radius) / 2 - var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg)))) rotate(300deg); /* 300度回転 */
    border-right: calc(var(--radius) * 1.25 * sin(calc(var(--angle) * 1deg))) solid transparent;
    border-top: calc(var(--radius) * 1.25 * cos(calc(var(--angle) * 1deg))) solid #ff6f61;
}
.currentSeconds{
    grid-column: 1/2;
    grid-row: 1/2;
}
#count_box{
    display: grid;
    place-items: center; /* 数字を中央に配置 */
    height: var(--radius); /* 円と同じ高さ */
    width: var(--radius);  /* 円と同じ幅 */
    grid-column: 2/5; /* circle2と同じグリッド位置 */
    grid-row: 2/5;
    font-size: calc(var(--radius) / 2); /* 半径に応じてフォントサイズを調整 */
    font-weight: bold;
    z-index: 2; /* 最前面に配置され、プログレスバーの上に数字が表示される */
    pointer-events: none; /* この要素上のクリックイベントを透過させることで、下の要素のイベントが発火できるようにする */
}
p{
    color: white; /* 数字の色 */
    margin: 0;    /* 余白をなくす */
}
#quiz-hasher-result {
    position: fixed;
    top: 8%;
    left: 50%;
    transform: translate(-50%, 0);
    background: #ff6f61;
    color: white;
    font-size: 2.5rem;
    font-family: 'Yu Gothic', 'Meiryo', 'Noto Sans JP', 'Segoe UI', 'Arial', sans-serif;
    font-weight: 700;
    padding: 24px 48px;
    border-radius: 10px;
    z-index: 99999;
    text-align: center;
    display: none;
    letter-spacing: 0.04em;
    border: 2px solid #ff8b94;
    transition: box-shadow 0.2s, transform 0.2s;
    white-space: nowrap; /* 1行で折り返さない */
    min-width: 280px;    /* 最小幅を確保 */
    width: fit-content;  /* 内容に合わせて幅を調整 */
    max-width: 90vw;     /* 画面幅を超えない */
    box-sizing: border-box;
}

#quiz-hasher-result.show {
    animation: popIn 0.4s cubic-bezier(.68,-0.55,.27,1.55);
}
@keyframes popIn {
    0% { transform: translate(-50%, -30%) scale(0.8); opacity: 0; }
    80% { transform: translate(-50%, 5%) scale(1.05); opacity: 1; }
    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
}
`;

// スタイルタグを作成し、DOMの<head>要素に追加します。
// これにより、定義されたCSSルールが現在のページに適用されます。
const styleElement = document.createElement('style');
styleElement.textContent = newCss;
document.head.appendChild(styleElement);

// 新しいHTML要素を動的に作成する関数。
// この関数は、早押し拡張機能のUIをYouTubeページ上にオーバーレイとして構築します。
function createNewUI() {
    // #selects div: 主に開発・デバッグ用のコントロールが含まれます。半径や時間を調整するための入力と、アニメーションの開始/リセットボタン。
    let selectsDiv = document.createElement('div');
    selectsDiv.id = 'selects';
    selectsDiv.style.display = 'none'; // 初期状態は非表示。早押し機能では自動的に表示/非表示が切り替わるため、通常はユーザー操作で表示しない。
    selectsDiv.innerHTML = `
        <div>
            <label for="radius">半径：</label>
            <input type="range" id="radius" name="radius" min="50" max="500" value="200" oninput="changeRadius(this.value);">
        </div>
        <div>
            <button id="startAnimationBtn">Start Animation</button>
            <button id="resetAnimationBtn">Reset Animation</button>
        </div>
        <div>
            <label for="time">時間：</label>
            <input type="number" id="time" name="time" min="1" max="99" value="5" oninput="changeTimes(this.value);">
        </div>
    `;
    document.body.appendChild(selectsDiv); // body要素の最後にUI要素を追加。

    // .circle2 div: プログレスバーのアニメーションを行う外側の円。
    let circle2Div = document.createElement('div');
    circle2Div.className = 'circle2';
    circle2Div.style.display = 'none'; // 初期状態は非表示。カウントダウン中にのみ表示される。
    circle2Div.innerHTML = `
        <div class="triangle1" id="triangle1"></div>
        <div class="triangle2" id="triangle2"></div>
        <div class="triangle3" id="triangle3"></div>
        <div class="triangle4" id="triangle4"></div>
        <div class="triangle5" id="triangle5"></div>
        <div class="triangle6" id="triangle6"></div>
    `;
    document.body.appendChild(circle2Div);

    // .circle div: プログレスバーの背景となる内側の黒い円。
    let circleDiv = document.createElement('div');
    circleDiv.className = 'circle';
    circleDiv.style.display = 'none'; // 初期状態は非表示。カウントダウン中にのみ表示される。
    document.body.appendChild(circleDiv);

    // #count_box div: カウントダウンの数字を表示するコンテナ。
    let countBoxDiv = document.createElement('div');
    countBoxDiv.id = 'count_box';
    countBoxDiv.style.display = 'none'; // 初期状態は非表示。カウントダウン中にのみ表示される。
    countBoxDiv.innerHTML = `
        <p id="currentSeconds">0</p>
    `;
    document.body.appendChild(countBoxDiv);

    // #quiz-hasher-result div: 「回答権 プレイヤー「[キー]」!」というメッセージを表示する要素。
    let resultDiv = document.createElement('div');
    resultDiv.id = 'quiz-hasher-result';
    document.body.appendChild(resultDiv);

    // イベントリスナーをボタンにアタッチ。これらは主にUIのテストや開発のためのもので、実際の早押し機能ではキー入力によってカウントダウンが開始されます。
    document.getElementById('startAnimationBtn').addEventListener('click', () => startAnimation());
    document.getElementById('resetAnimationBtn').addEventListener('click', () => all_reset());

    // 作成したUI要素への参照をオブジェクトとして返す。これにより、後続の関数からこれらの要素にアクセスしやすくなる。
    return {
        selectsDiv,
        circle2Div,
        circleDiv,
        countBoxDiv,
        resultDiv,
        currentSecondsDisplay: document.getElementById('currentSeconds'), // カウントダウン数字の<p>要素
        triangle1: document.getElementById('triangle1'),
        triangle2: document.getElementById('triangle2'),
        triangle3: document.getElementById('triangle3'),
        triangle4: document.getElementById('triangle4'),
        triangle5: document.getElementById('triangle5'),
        triangle6: document.getElementById('triangle6'),
        radiusInput: document.getElementById('radius'), // 半径入力の<input>要素
        timeInput: document.getElementById('time')     // 時間入力の<input>要素
    };
}

const uiElements = createNewUI(); // UI要素を生成し、その参照をuiElements定数に格納。
const resultDisplay = uiElements.resultDiv; // プレイヤー名表示要素へのショートカット。

// --- index.js から統合したロジック ---
var times = 5; // カウントダウンのデフォルト秒数を5秒に設定。
uiElements.timeInput.value = times; // UIの時間入力フィールドの初期値を設定。

var reset_times_animation = false; // アニメーションをリセットするかどうかを制御するフラグ。

// 半径を変更する関数。UIのレンジスライダーの入力に応じて、円のサイズと数字のフォントサイズを動的に変更。
function changeRadius(value) {
    document.documentElement.style.setProperty('--radius', `${value}px`); // CSS変数を更新
    // UI要素の幅と高さを更新。これにより、円と数字の表示サイズが変更される。
    uiElements.circle2Div.style.width = `${value}px`;
    uiElements.circle2Div.style.height = `${value}px`;
    uiElements.countBoxDiv.style.width = `${value}px`;
    uiElements.countBoxDiv.style.height = `${value}px`;
    uiElements.countBoxDiv.style.fontSize = `${value / 2}px`; // 半径の半分をフォントサイズに。
}

// 時間を変更する関数。UIの数値入力フィールドの入力に応じて、カウントダウンの秒数を更新。
function changeTimes(time) {
    times = parseInt(time); // 入力値を整数に変換し、グローバル変数timesを更新。
    if (isNaN(times) || times < 1) { // 無効な値（数値でない、1未満）の場合は
        times = 1; // デフォルト値にリセット。
    }
    uiElements.timeInput.value = times; // inputのvalueも更新し、表示を同期。
    updateCurrentSeconds(times); // 秒数表示を初期値に更新。
}

// アニメーション開始関数。早押し機能では`startCountdown`から自動的に呼び出されます。
function startAnimation() {
    if(!reset_times_animation){ // 既にアニメーションが実行中でない場合のみ開始
        reset_times_animation = true; // アニメーションが開始したことを示すフラグ
        smoothTransition(); // 360度までの滑らかな遷移（プログレスバーのアニメーション）を開始
    }
}

// 秒数を表示する関数。カウントダウンの現在の秒数をUIに表示。
function updateCurrentSeconds(seconds) {
    uiElements.currentSecondsDisplay.textContent = Math.ceil(seconds); // 小数点以下を切り上げて表示。
}

// 中心角を変更する関数。プログレスバーのアニメーションの核心部分。
// 引数で与えられた角度に基づいて、6つの三角形のいずれかのCSS変数--angleを更新します。
// これにより、各三角形が順番に表示され、円形のプログレスバーが時計回りに埋まっていくように見えます。
function changeAngle(angle, times_animat){
    // 各三角をリセット（重要：新しい角度を適用する前に、古い角度の影響を消す）
    // if (uiElements.triangle1) uiElements.triangle1.style.setProperty('--angle', 0);
    // if (uiElements.triangle2) uiElements.triangle2.style.setProperty('--angle', 0);
    // if (uiElements.triangle3) uiElements.triangle3.style.setProperty('--angle', 0);
    // if (uiElements.triangle4) uiElements.triangle4.style.setProperty('--angle', 0);
    // if (uiElements.triangle5) uiElements.triangle5.style.setProperty('--angle', 0);
    // if (uiElements.triangle6) uiElements.triangle6.style.setProperty('--angle', 0);

    // 角度に応じて、表示すべき三角形を決定し、その三角形の角度を設定します。
    // 各三角形は60度ずつ担当します（360度 / 6三角形 = 60度）。
    if(angle < 65){ // 最初の60度
        if (uiElements.triangle1) uiElements.triangle1.style.setProperty('--angle', angle);
    }else if(angle < 125){ // 次の60度 (60度からの相対角度)
        if (uiElements.triangle2) uiElements.triangle2.style.setProperty('--angle', angle - 60);
    }else if(angle < 185){ // 次の60度
        if (uiElements.triangle3) uiElements.triangle3.style.setProperty('--angle', angle - 120);
    }else if(angle < 245){ // 次の60度
        if (uiElements.triangle4) uiElements.triangle4.style.setProperty('--angle', angle - 180);
    }else if(angle < 305){ // 次の60度
        if (uiElements.triangle5) uiElements.triangle5.style.setProperty('--angle', angle - 240);
    }else if(angle < 360){ // 最後の60度
        if (uiElements.triangle6) uiElements.triangle6.style.setProperty('--angle', angle - 300);
    } else {
        reset_angle(); // 360度を超えたらすべての角度をリセットし、プログレスバーを初期状態に戻す。
    }
    // 現在の秒数を更新。アニメーションの進行度から残り時間を計算。
    if (times_animat - (angle / 360 * times_animat) > 0) {
        updateCurrentSeconds(times_animat - (angle / 360 * times_animat));
    } else {
        updateCurrentSeconds(0); // 0秒以下になったら0を表示。
    }
}

// 中心角のリセット関数。すべての三角形の角度を0に設定し、プログレスバーを空の状態に戻します。
function reset_angle(){
    if (uiElements.triangle1) uiElements.triangle1.style.setProperty('--angle', 0);
    if (uiElements.triangle2) uiElements.triangle2.style.setProperty('--angle', 0);
    if (uiElements.triangle3) uiElements.triangle3.style.setProperty('--angle', 0);
    if (uiElements.triangle4) uiElements.triangle4.style.setProperty('--angle', 0);
    if (uiElements.triangle5) uiElements.triangle5.style.setProperty('--angle', 0);
    if (uiElements.triangle6) uiElements.triangle6.style.setProperty('--angle', 0);
    return true;
}

// 初期化関数。主に開発・テスト用の「Reset Animation」ボタンで呼び出されます。
function all_reset(){
    reset_times_animation = false; // アニメーション停止フラグを設定。
    reset_angle(); // プログレスバーをリセット。
    updateCurrentSeconds(times); // 秒数表示を初期時間に戻す。
}

// 滑らかなアニメーションを実現する関数。
// `setInterval`を使用して一定間隔で`changeAngle`を呼び出し、プログレスバーを滑らかに更新します。
function smoothTransition() {
    var currentAngle = 0;
    var times_animat = times;
    var duration = 1000 * times_animat;
    var startTime = performance.now();
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownInterval = setInterval(function() {
        var elapsed = performance.now() - startTime;
        currentAngle = (360) * (elapsed / duration);
        changeAngle(currentAngle, times_animat);
        if (elapsed >= duration || !reset_times_animation) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            updateCurrentSeconds(0);
            reset_angle();
            reset_times_animation = false;
            setTimeout(function() {
                // --- ここからキュー参照ロジック ---
                currentQueueIndex++;
                if (currentQueueIndex <= pressQueue.length) {
                    // まだ次のプレイヤーがいる場合
                    if (currentQueueIndex === 1 && pressQueue.length === 0) {
                        // 1人だけの場合
                        hideUI();
                        toggleYouTubePlayback();
                        currentVideoState = VideoState.PLAYING;
                        resetQuiz();
                    } else if (currentQueueIndex <= pressQueue.length) {
                        // 次のプレイヤーのカウントダウン
                        startCountdown(times);
                    }
                } else {
                    // 全員分終わったらリセット
                    hideUI();
                    toggleYouTubePlayback();
                    currentVideoState = VideoState.PLAYING;
                    resetQuiz();
                }
            }, 100);
        }
    }, 1000 / 60);
}

// --- 既存の早押し機能ロジック ---

/**
 * YouTubeの動画プレイヤー要素を取得する関数。
 * @returns {HTMLElement|null} YouTubeプレイヤー要素、または見つからない場合はnull。
 */
function getYouTubePlayer() {
    return document.getElementById('movie_player'); // YouTubeの動画プレイヤーは通常'movie_player'というIDを持つ。
}

/**
 * キーボードイベントをシミュレートし、YouTubeプレイヤーにディスパッチする関数。
 * プログラム的にキー入力を発生させ、YouTubeの組み込みショートカット（例: 'k'キーでの再生/一時停止）をトリガーします。
 * @param {string} key - シミュレートするキー（例: 'k', ' '）。
 */
function simulateKeyEvent(key) {
    const player = getYouTubePlayer();
    if (!player) {
        return; // プレイヤーが見つからない場合は処理を中断。
    }

    // キーコードを決定 (スペースキーは32、それ以外は文字コード)。
    const keyCode = key === ' ' ? 32 : (key.toUpperCase().charCodeAt(0));

    // keydownイベントを生成し、プレイヤーにディスパッチ。
    // `bubbles: true`はイベントがDOMツリーをバブリングすること、
    // `cancelable: true`はイベントがキャンセル可能であることを、
    // `composed: true`はシャドウDOM境界を越えて伝播することを許可します。
    const downEvent = new KeyboardEvent('keydown', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: keyCode,
        bubbles: true,
        cancelable: true,
        composed: true
    });
    player.dispatchEvent(downEvent);

    // keyupイベントも同様に生成し、ディスパッチ。
    // 多くのアプリケーションでは、keydownとkeyupのペアでキー入力が認識されます。
    const upEvent = new KeyboardEvent('keyup', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: keyCode,
        bubbles: true,
        cancelable: true,
        composed: true
    });
    player.dispatchEvent(upEvent);
}

/**
 * YouTubeの再生/一時停止を切り替える関数（'k'キーをシミュレート）。
 * YouTubeのデフォルトのショートカットキーを利用して動画を制御します。
 */
function toggleYouTubePlayback() {
    simulateKeyEvent('k'); // 'k'キーをシミュレートして再生/一時停止を切り替え。
}

/**
 * UI要素を表示する関数。カウントダウンが開始されるときに呼び出され、関連するすべてのUI要素を表示します。
 */
function showUI() {
    uiElements.selectsDiv.style.display = 'grid'; // selectコントロールはデバッグ用ですが、この関数で表示されます
    uiElements.circle2Div.style.display = 'grid'; // プログレスバーの円
    uiElements.circleDiv.style.display = 'grid';   // プログレスバーの背景円
    uiElements.countBoxDiv.style.display = 'grid'; // カウントダウン数字のコンテナ
}

/**
 * UI要素を非表示にする関数。カウントダウンが終了したり、クイズがリセットされたりするときに呼び出されます。
 */
function hideUI() {
    uiElements.selectsDiv.style.display = 'none';
    uiElements.circle2Div.style.display = 'none';
    uiElements.circleDiv.style.display = 'none';
    uiElements.countBoxDiv.style.display = 'none';
    resultDisplay.style.display = 'none'; // プレイヤー名表示も非表示にする。
    let queueBoard = document.getElementById('quiz-queue-board');
    if (queueBoard) queueBoard.style.display = 'none';
}


/**
 * カウントダウンを開始する関数。
 * @param {number} durationSeconds - カウントダウンの秒数。この秒数でアニメーションが進行します。
 */
function startCountdown(durationSeconds) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    reset_angle();
    changeTimes(durationSeconds);
    currentVideoState = VideoState.COUNTDOWN;
    showUI();
    reset_times_animation = true;
    smoothTransition();

    // 早押しメッセージ（プレイヤー名）を表示。
    let currentKey = (currentQueueIndex === 0) ? firstPressKey : pressQueue[currentQueueIndex - 1];
    if (resultDisplay && resultDisplay instanceof HTMLElement) {
        resultDisplay.textContent = `回答権 プレイヤー「${currentKey ? currentKey.toUpperCase() : ''}」!`;
        resultDisplay.style.display = 'block';
    }
}


/**
 * クイズの状態をリセットする関数。
 * カウントダウンが完全に終了し、次のクイズに移る準備ができたときに呼び出されます。
 */
function resetQuiz() {
    firstPressKey = null;
    pressQueue = [];
    currentQueueIndex = 0;
    hideUI();
}

// --- 得点管理機能の追加 ---
let scores = { p: 0, q: 0, a: 0, z: 0 };

// 得点表示用UIを作成
function createScoreBoard() {
    let scoreBoard = document.createElement('div');
    scoreBoard.id = 'quiz-score-board';
    scoreBoard.style.position = 'fixed';
    scoreBoard.style.top = '24px';
    scoreBoard.style.right = '32px';
    scoreBoard.style.background = 'rgba(220,237,193,0.95)';
    scoreBoard.style.color = '#222';
    scoreBoard.style.fontSize = '1.5rem';
    scoreBoard.style.fontFamily = "'Segoe UI', 'Arial', sans-serif";
    scoreBoard.style.fontWeight = 'bold';
    scoreBoard.style.padding = '12px 28px';
    scoreBoard.style.borderRadius = '16px';
    scoreBoard.style.boxShadow = '0 2px 12px rgba(44,62,80,0.10)';
    scoreBoard.style.zIndex = '100000';
    scoreBoard.style.letterSpacing = '0.04em';
    scoreBoard.style.userSelect = 'none';
    scoreBoard.style.display = 'flex';
    scoreBoard.style.gap = '32px';
    scoreBoard.innerHTML = `<span id="score-q">Q: 0</span><span id="score-p">P: 0</span><span id="score-a">A: 0</span><span id="score-z">Z: 0</span>`;
    document.body.appendChild(scoreBoard);
}

function updateScoreBoard() {
    const q = document.getElementById('score-q');
    const p = document.getElementById('score-p');
    const a = document.getElementById('score-a');
    const z = document.getElementById('score-z');
    if (q) q.textContent = `Q: ${scores.q}`;
    if (p) p.textContent = `P: ${scores.p}`;
    if (a) a.textContent = `A: ${scores.a}`;
    if (z) z.textContent = `Z: ${scores.z}`;
}

// 初期化
if (!document.getElementById('quiz-score-board')) {
    createScoreBoard();
}
updateScoreBoard();

// --- キュー表示機能の追加 ---
let firstPressTime = null;
let pressTimes = {}; // {q: 秒, p: 秒}

function createQueueBoard() {
    let queueBoard = document.createElement('div');
    queueBoard.id = 'quiz-queue-board';
    queueBoard.style.position = 'fixed';
    queueBoard.style.top = '8%'; // quiz-hasher-resultと同じ高さ
    queueBoard.style.left = '50%';
    queueBoard.style.transform = 'translate(-120%, 0)'; // 中央から左にずらす
    queueBoard.style.background = 'rgba(255,255,255,0.95)';
    queueBoard.style.color = '#222';
    queueBoard.style.fontSize = '1.2rem';
    queueBoard.style.fontFamily = "'Segoe UI', 'Arial', sans-serif";
    queueBoard.style.fontWeight = 'bold';
    queueBoard.style.padding = '8px 32px';
    queueBoard.style.borderRadius = '16px';
    queueBoard.style.boxShadow = '0 2px 12px rgba(44,62,80,0.10)';
    queueBoard.style.zIndex = '100001';
    queueBoard.style.letterSpacing = '0.04em';
    queueBoard.style.userSelect = 'none';
    queueBoard.style.display = 'none';
    queueBoard.style.minWidth = '120px';
    queueBoard.style.flexDirection = 'column';
    queueBoard.style.alignItems = 'flex-start';
    document.body.appendChild(queueBoard);
}

function updateQueueBoard() {
    let queueBoard = document.getElementById('quiz-queue-board');
    if (!queueBoard) return;
    if (pressQueue.length === 0) {
        queueBoard.style.display = 'none';
        return;
    }
    // 1人だけなら表示しない
    if (pressQueue.length === 1 && !firstPressKey) {
        queueBoard.style.display = 'none';
        return;
    }
    // 表示内容作成（縦並びリスト、各行はflexで左:名前 右:時間差）
    let arr = [firstPressKey, ...pressQueue];
    let html = arr.map((k, i) => {
        let t = pressTimes[k];
        let delta = (t - firstPressTime).toFixed(2);
        let label = k.toUpperCase();
        let timeStr = (i === 0) ? '+0.00s' : `+${delta}s`;
        return `<div style="display:flex;justify-content:flex-start;align-items:center;gap:12px;width:100%;"><span style="min-width:2em;text-align:left;">${label}</span><span style="margin-left:1em;">${timeStr}</span></div>`;
    }).join('');
    queueBoard.innerHTML = html;
    queueBoard.style.display = arr.length > 1 ? 'block' : 'none';
}

if (!document.getElementById('quiz-queue-board')) {
    createQueueBoard();
}

// ドキュメント全体でのキーボード押下イベントをリッスン。
// ユーザーのキー入力に応じて、早押し判定と動画制御を行います。
document.addEventListener('keydown', function(event) {
    // 得点加点・減点用のショートカット
    const key = event.key.toLowerCase();
    if ((event.ctrlKey && !event.shiftKey) && (key === 'p' || key === 'q')) {
        // Ctrl+P/Q で加点
        scores[key] += 1;
        updateScoreBoard();
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if ((event.ctrlKey && event.shiftKey) && (key === 'p' || key === 'q')) {
        // Ctrl+Shift+P/Q で減点
        scores[key] -= 1;
        updateScoreBoard();
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    const pressedKey = event.key.toLowerCase();
    const isFastKey = FAST_KEYS.includes(pressedKey); // 早押し対象キーか判定

    // カウントダウン中の処理。
    if (currentVideoState === VideoState.COUNTDOWN) {
        if (isFastKey) { // 早押し対象キーが押された場合
            // すでにキューにある場合は何もしない
            if (pressedKey !== firstPressKey && !pressQueue.includes(pressedKey)) {
                pressQueue.push(pressedKey); // キューにキーを追加。
                pressTimes[pressedKey] = performance.now() / 1000; // 秒単位で記録
                updateQueueBoard();
                console.log(`キー '${pressedKey}' をキューに追加しました。現在のキュー: [${pressQueue}]`);
            }
        }
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    // 早押しキーが押された場合の処理（カウントダウン中でない場合）。
    if (isFastKey) {
        event.preventDefault();
        event.stopPropagation();
        if (currentVideoState === VideoState.PLAYING || currentVideoState === VideoState.PAUSED) {
            if (currentVideoState === VideoState.PLAYING) {
                toggleYouTubePlayback();
            }
            currentVideoState = VideoState.PAUSED;
            firstPressKey = event.key;
            firstPressTime = performance.now() / 1000;
            pressTimes = {};
            pressTimes[firstPressKey] = firstPressTime;
            updateQueueBoard();
            currentQueueIndex = 0;
            startCountdown(times);
        }
        return;
    }
    // QおよびPキー以外のキーは、早押し機能の対象外であり、YouTubeのショートカットに影響しません。
    // これらのキーが押されても、イベントは通常通り処理され、YouTubeのショートカットなどが機能します。
});