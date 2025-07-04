function toggleYouTubePlayPause() {
    const video = document.querySelector('video'); 
    if (video) {
        if (video.paused) {
            video.play();
            console.log('YouTube動画を再生しました');
        } else {
            video.pause();
            console.log('YouTube動画を一時停止しました');
        }
    } else {
        console.log('YouTube動画プレイヤーが見つかりませんでした');
    }
}

document.addEventListener('keydown', function(event) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
        return; 
    }

    if (event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        event.stopPropagation();
        toggleYouTubePlayPause();
    }
});

console.log('youtube_controls.js が読み込まれました。AキーでYouTube動画を操作できます。');