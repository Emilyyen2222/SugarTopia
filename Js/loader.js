window.onload = function() {
    const loader = document.getElementById('loader');

    // 等待動畫結束後顯示內容
    setTimeout(() => {
        if (loader) {
            loader.style.display = 'none';
        }
    }, 500); 
};
