let isEarlyPressActive = true; 

chrome.commands.onCommand.addListener(function(command) {
    if (command === "_toggle_early_press") {
        isEarlyPressActive = !isEarlyPressActive;
        console.log("早押し機能の状態を切り替え:", isEarlyPressActive ? "有効" : "無効");

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleEarlyPress",
                    isActive: isEarlyPressActive
                });
            }
        });
    }
});