class ScratchGame {
    constructor() {
        // 基本確率設定
        const baseProbabilities = {
            first: 0.0001,   // 1/10000
            second: 0.001,   // 1/1000  
            third: 0.01      // 1/100
        };
        
        // ボーナス確率計算
        const isSpecialDay = this.isSpecialDay();
        
        let firstProb, secondProb, thirdProb;
        
        if (isSpecialDay) {
            // 7月30日は特別確率
            const specialProbs = this.getSpecialDayProbabilities();
            firstProb = specialProbs.first;
            secondProb = specialProbs.second;
            thirdProb = specialProbs.third;
        } else {
            // 通常日または偶数日
            const multiplier = this.getBonusMultiplier();
            firstProb = baseProbabilities.first * multiplier;
            secondProb = baseProbabilities.second * multiplier;
            thirdProb = baseProbabilities.third * multiplier;
        }
        
        const loseProb = 1 - (firstProb + secondProb + thirdProb);
        
        // ボーナスメッセージを決定
        let bonusPrefix = "";
        if (isSpecialDay) {
            bonusPrefix = "🎆 7/30超特別日！激アツ確率！\n";
        } else {
            const multiplier = this.getBonusMultiplier();
            if (multiplier === 2) {
                bonusPrefix = "✨ 偶数日ボーナス(2倍)！\n";
            }
        }
        
        this.prizes = [
            { name: "1等", icon: "🎉", message: bonusPrefix + "おめでとうございます！\n1等当選です！", probability: firstProb, class: "prize-1st" },
            { name: "2等", icon: "🎊", message: bonusPrefix + "素晴らしい！\n2等当選です！", probability: secondProb, class: "prize-2nd" },
            { name: "3等", icon: "🎁", message: bonusPrefix + "やったね！\n3等当選です！", probability: thirdProb, class: "prize-3rd" },
            { name: "ハズレ", icon: "😅", message: "残念...\nまた挑戦してね！", probability: loseProb, class: "prize-lose" }
        ];
        
        this.cards = [];
        this.scratchedCount = 0;
        this.gameEnded = false;
        this.tapCount = 0;
        this.isProcessing = false; // ポップアップ表示中のフラグ
        
        // ローカルストレージキー
        this.STORAGE_KEY = 'scratch-game-data';
        
        this.init();
    }
    
    isSpecialDay() {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate();
        return month === 7 && day === 30;
    }
    
    getSpecialDayProbabilities() {
        // 7月30日の超特別確率（2倍に）
        return {
            first: 0.02,    // 1/50 (2%)
            second: 0.04,   // 1/25 (4%)
            third: 0.2      // 1/5 (20%)
        };
    }
    
    isEvenDay() {
        const today = new Date();
        const day = today.getDate();
        return day % 2 === 0;
    }
    
    getBonusMultiplier() {
        if (this.isSpecialDay()) return 1; // 7/30は独自確率（multiplier使用しない）
        if (this.isEvenDay()) return 2;    // 偶数日は2倍
        return 1; // 通常
    }
    
    init() {
        this.loadTapCount(); // ローカルストレージからタップ回数を読み込み
        this.setupCards();
        this.setupEventListeners();
        this.generatePrizes();
        this.updateSpecialDayDisplay();
        this.updateTapCounter(); // 初期表示を更新
        this.startDateChecker(); // 日付変更チェックを開始
    }
    
    updateSpecialDayDisplay() {
        const multiplier = this.getBonusMultiplier();
        const subtitle = document.querySelector('.subtitle');
        const bonusIndicator = document.getElementById('bonusIndicator');
        const body = document.body;
        
        // ボーナス表示をリセット
        body.classList.remove('bonus-2x', 'bonus-3x');
        bonusIndicator.classList.remove('bonus-2x', 'bonus-3x');
        bonusIndicator.style.display = 'none';
        
        if (this.isSpecialDay()) {
            subtitle.innerHTML = '🎆 7/30超特別日！激アツ確率開催中！🎆<br>カードを選んでスクラッチしよう！';
            subtitle.style.animation = 'goldShimmer 2s infinite';
            bonusIndicator.textContent = '🎆 7/30超特別日 激アツ確率！ 🎆';
            bonusIndicator.classList.add('bonus-3x');
            body.classList.add('bonus-3x');
        } else if (multiplier === 2) {
            subtitle.innerHTML = '✨ 偶数日ボーナス！確率2倍！✨<br>カードを選んでスクラッチしよう！';
            subtitle.style.animation = 'silverShimmer 2s infinite';
            bonusIndicator.textContent = '✨ 偶数日ボーナス 確率2倍！ ✨';
            bonusIndicator.classList.add('bonus-2x');
            body.classList.add('bonus-2x');
        }
    }
    
    setupCards() {
        const scratchCards = document.querySelectorAll('.scratch-card');
        scratchCards.forEach((card, index) => {
            this.cards.push({
                element: card,
                index: index,
                isScratched: false,
                prize: null
            });
        });
    }
    
    setupEventListeners() {
        // スクラッチカードのクリックイベント
        this.cards.forEach(card => {
            card.element.addEventListener('click', () => {
                if (!card.isScratched && !this.gameEnded && !this.isProcessing) {
                    this.scratchCard(card);
                }
            });
        });
        
        // リセットボタン
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // モーダル閉じるボタン
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // モーダル背景クリックで閉じる
        document.getElementById('resultModal').addEventListener('click', (e) => {
            if (e.target.id === 'resultModal') {
                this.closeModal();
            }
        });
    }
    
    generatePrizes() {
        // 各カードに抽選結果を事前に生成
        this.cards.forEach(card => {
            card.prize = this.drawPrize();
        });
    }
    
    drawPrize() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const prize of this.prizes) {
            cumulative += prize.probability;
            if (random <= cumulative) {
                return prize;
            }
        }
        
        // フォールバック（通常は発生しない）
        return this.prizes[this.prizes.length - 1];
    }
    
    scratchCard(card) {
        if (card.isScratched || this.isProcessing) return;
        
        // 処理中フラグを設定
        this.isProcessing = true;
        
        // 他のカードを無効化（視覚的フィードバック）
        this.setCardsDisabled(true, card);
        
        card.isScratched = true;
        this.scratchedCount++;
        this.tapCount++;
        this.updateTapCounter();
        
        // スクラッチアニメーション開始
        card.element.classList.add('scratched');
        
        // 効果音のシミュレーション（視覚的フィードバック）
        this.addScratchEffect(card.element);
        
        // 遅延して結果を表示
        setTimeout(() => {
            this.revealPrize(card);
        }, 800);
    }
    
    addScratchEffect(cardElement) {
        // カードにシェイク効果を追加
        cardElement.style.animation = 'none';
        cardElement.offsetHeight; // リフロー強制
        cardElement.style.animation = 'scratchShake 0.5s ease-in-out';
        
        // パーティクル効果のシミュレーション
        this.createParticles(cardElement);
    }
    
    createParticles(cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'scratch-particle';
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                width: 6px;
                height: 6px;
                background: #e74c3c;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: particleFloat 1s ease-out forwards;
                --angle: ${(360 / particleCount) * i}deg;
            `;
            
            document.body.appendChild(particle);
            
            // パーティクルを自動削除
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    revealPrize(card) {
        const prizeText = card.element.querySelector('.prize-text');
        const scratchContent = card.element.querySelector('.scratch-content');
        
        // 賞品に応じたスタイルを適用
        scratchContent.className = `scratch-content ${card.prize.class}`;
        prizeText.textContent = card.prize.name;
        
        // 当選時の特別効果
        if (card.prize.name !== 'ハズレ') {
            this.addWinEffect(card.element);
            
            // 当選時のみモーダルを表示
            setTimeout(() => {
                this.showResultModal(card.prize);
            }, 500);
        } else {
            // ハズレの場合はモーダル表示せずに処理完了
            setTimeout(() => {
                this.isProcessing = false;
                this.setCardsDisabled(false);
            }, 800);
        }
    }
    
    addWinEffect(cardElement) {
        // 光る効果
        cardElement.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        
        // 勝利パーティクル
        const rect = cardElement.getBoundingClientRect();
        for (let i = 0; i < 12; i++) {
            const star = document.createElement('div');
            star.textContent = '⭐';
            star.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
                animation: starBurst 2s ease-out forwards;
                --delay: ${i * 0.1}s;
                --angle: ${(360 / 12) * i}deg;
            `;
            
            document.body.appendChild(star);
            
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 2000);
        }
    }
    
    showResultModal(prize) {
        const modal = document.getElementById('resultModal');
        const prizeIcon = modal.querySelector('.prize-icon');
        const prizeName = modal.querySelector('.prize-name');
        const prizeMessage = modal.querySelector('.prize-message');
        
        prizeIcon.textContent = prize.icon;
        prizeName.textContent = prize.name;
        prizeMessage.textContent = prize.message;
        
        // 賞品に応じた色を適用
        prizeName.className = `prize-name ${prize.class}`;
        
        modal.classList.add('show');
        
        // モーダル表示中は他の操作を無効化（既にisProcessingで制御済み）
    }
    
    closeModal() {
        const modal = document.getElementById('resultModal');
        modal.classList.remove('show');
        
        // モーダルが閉じられたら処理中フラグを解除
        this.isProcessing = false;
        
        // カードの無効化を解除
        this.setCardsDisabled(false);
    }
    
    updateTapCounter() {
        const tapCountElement = document.getElementById('tapCount');
        const dateDisplayElement = document.getElementById('dateDisplay');
        
        tapCountElement.textContent = this.tapCount;
        
        // 日付表示を更新
        if (dateDisplayElement) {
            const today = new Date();
            const dateStr = `(${today.getMonth() + 1}/${today.getDate()})`;
            dateDisplayElement.textContent = dateStr;
        }
        
        // タップ時のアニメーション
        tapCountElement.style.animation = 'none';
        tapCountElement.offsetHeight; // リフロー強制
        tapCountElement.style.animation = 'pulseGlow 0.5s ease';
        
        // ローカルストレージに保存
        this.saveTapCount();
    }
    
    loadTapCount() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                const today = this.getTodayString();
                
                // 日付が変わっていればリセット
                if (data.date === today) {
                    this.tapCount = data.tapCount || 0;
                } else {
                    // 新しい日になったらリセット
                    this.tapCount = 0;
                    this.saveTapCount(); // 新しい日付で保存
                }
            }
        } catch (error) {
            console.log('ローカルストレージの読み込みエラー:', error);
            this.tapCount = 0;
        }
    }
    
    saveTapCount() {
        try {
            const data = {
                tapCount: this.tapCount,
                date: this.getTodayString(),
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.log('ローカルストレージの保存エラー:', error);
        }
    }
    
    getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    startDateChecker() {
        // 1分ごとに日付変更をチェック
        this.dateCheckInterval = setInterval(() => {
            this.checkDateChange();
        }, 60000); // 60秒ごと
        
        // 最初のチェックも実行
        this.checkDateChange();
    }
    
    checkDateChange() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                const today = this.getTodayString();
                
                // 日付が変わっていればリセット
                if (data.date !== today) {
                    const oldTapCount = this.tapCount;
                    this.tapCount = 0;
                    this.saveTapCount();
                    this.updateTapCounter();
                    
                    // ボーナス表示も更新（偶数日/特別日の変更対応）
                    this.updateSpecialDayDisplay();
                    
                    // 新しい抽選結果を生成（確率が変わる可能性があるため）
                    this.generatePrizes();
                    
                    console.log(`日付が変更されました: ${data.date} → ${today}`);
                    console.log(`タップ回数をリセット: ${oldTapCount} → 0`);
                    
                    // ユーザーに通知（任意）
                    this.showDateChangeNotification();
                }
            }
        } catch (error) {
            console.log('日付チェックエラー:', error);
        }
    }
    
    showDateChangeNotification() {
        // 控えめな通知を表示
        const notification = document.createElement('div');
        notification.textContent = '🌅 新しい日になりました！タップ回数がリセットされました';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            color: white;
            padding: 15px 20px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.5s ease, fadeOut 4s ease;
            pointer-events: none;
        `;
        
        document.body.appendChild(notification);
        
        // 4秒後に削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
    
    setCardsDisabled(disabled, excludeCard = null) {
        this.cards.forEach(card => {
            if (card !== excludeCard && !card.isScratched) {
                if (disabled) {
                    card.element.classList.add('disabled');
                } else {
                    card.element.classList.remove('disabled');
                }
            }
        });
    }
    
    resetGame() {
        // ゲーム状態をリセット（タップ回数は保持）
        this.scratchedCount = 0;
        this.gameEnded = false;
        this.isProcessing = false; // 処理中フラグもリセット
        
        // 全カードをリセット
        this.cards.forEach(card => {
            card.isScratched = false;
            card.element.classList.remove('scratched', 'disabled');
            card.element.style.boxShadow = '';
            card.element.style.animation = '';
            
            const scratchContent = card.element.querySelector('.scratch-content');
            const prizeText = card.element.querySelector('.prize-text');
            
            scratchContent.className = 'scratch-content';
            prizeText.textContent = '';
        });
        
        // 新しい抽選結果を生成
        this.generatePrizes();
        
        // モーダルを閉じる
        this.closeModal();
        
        // リセットアニメーション
        const title = document.querySelector('.title');
        title.style.animation = 'none';
        title.offsetHeight;
        title.style.animation = 'bounce 2s infinite';
    }
    
    // クリーンアップ（ページを離れる際）
    destroy() {
        if (this.dateCheckInterval) {
            clearInterval(this.dateCheckInterval);
        }
    }
}

// ページを離れる際のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (window.scratchGame && window.scratchGame.destroy) {
        window.scratchGame.destroy();
    }
});

// CSS アニメーションを動的に追加
const additionalStyles = `
    @keyframes scratchShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px) rotate(-1deg); }
        75% { transform: translateX(5px) rotate(1deg); }
    }
    
    @keyframes particleFloat {
        0% {
            transform: translate(0, 0) rotate(var(--angle)) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(0, -50px) rotate(calc(var(--angle) + 180deg)) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes starBurst {
        0% {
            transform: translate(0, 0) rotate(var(--angle)) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(0, -30px) rotate(calc(var(--angle) + 90deg)) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(0, -80px) rotate(calc(var(--angle) + 180deg)) scale(0);
            opacity: 0;
        }
    }
`;

// スタイルを動的に追加
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ページ読み込み完了後にゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    window.scratchGame = new ScratchGame();
});

// PWA対応のサービスワーカー登録（オプション）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 