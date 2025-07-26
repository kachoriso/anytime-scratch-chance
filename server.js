const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルの配信
app.use(express.static(path.join(__dirname)));

// すべてのリクエストをindex.htmlに転送（SPA対応）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`PayPayスクラッチチャンスアプリが http://localhost:${PORT} で起動しました`);
}); 