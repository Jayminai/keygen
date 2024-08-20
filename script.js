const EVENTS_DELAY = 20000;

const gamePromoConfigs = {
    MyCloneArmy: {
        appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
        promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767'
    },
    ChainCube2048: {
        appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
        promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3'
    },
    TrainMiner: {
        appToken: '82647f43-3f87-402d-88dd-09a90025313f',
        promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954'
    },
    BikeRide3D: {
        appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
        promoId: '43e35910-c168-4634-ad4f-52fd764a843f'
    },
    MergeAway: {
        appToken: '8d1cc2ad-e097-4b86-90ef-7a27e19fb833',
        promoId: 'dc128d28-c45b-411c-98ff-ac7726fbaea4'
    },
    TwerkRace3D: {
        appToken: '61308365-9d16-4040-8bb0-2f4a4c69074c',
        promoId: '61308365-9d16-4040-8bb0-2f4a4c69074c',
    }       
};

document.addEventListener('DOMContentLoaded', () => {
    const gameSelect = document.getElementById('game-select');
    const keyCountInput = document.getElementById('key-count');
    const generateBtn = document.getElementById('generate-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const keysContainer = document.getElementById('keys-container');
    const keysList = document.getElementById('keys-list');
    const anotherRoundBtn = document.getElementById('another-round-btn');

    let currentAppConfig;

    generateBtn.addEventListener('click', async () => {
        const gameChoice = gameSelect.value;
        currentAppConfig = gamePromoConfigs[gameChoice];
        
        const keyCount = parseInt(keyCountInput.value);
        
        console.log('Generating keys...');
        generateBtn.disabled = true;
        keysContainer.classList.add('hidden');
        anotherRoundBtn.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0';

        const keys = await Promise.all(Array.from({ length: keyCount }, generateKeyProcess));

        updateProgress(1, 0);  // Final update to 100% and show "Done"
        console.log('\nKeys generated:', keys);

        keysList.innerHTML = keys.map(key => `<li class="key-item" data-key="${key}">${key}</li>`).join('');
        keysContainer.classList.remove('hidden');
        anotherRoundBtn.classList.remove('hidden');
        generateBtn.disabled = false;

        // Add event listener to each key item for copy functionality
        document.querySelectorAll('.key-item').forEach(item => {
            item.addEventListener('click', () => {
                copyToClipboard(item.getAttribute('data-key'));
                alert('Promo code copied to clipboard: ' + item.getAttribute('data-key'));
            });
        });
    });

    anotherRoundBtn.addEventListener('click', () => {
        keysContainer.classList.add('hidden');
        anotherRoundBtn.classList.add('hidden');
    });

    async function generateKeyProcess() {
        const clientId = generateClientId();
        let clientToken;
        try {
            clientToken = await login(clientId);
        } catch (error) {
            console.error(`Failed to log in: ${error.message}`);
            return null;
        }

        const steps = 7; // Total number of steps
        const totalTime = steps * EVENTS_DELAY * 1.33; // Estimate total time based on delay and random factor

        for (let i = 0; i < steps; i++) {
            await sleep(EVENTS_DELAY * delayRandom());
            const remainingTime = Math.max(0, totalTime - ((i + 1) * EVENTS_DELAY)); // Calculate remaining time
            updateProgress(Math.min((i + 1) / steps, 0.99), remainingTime);
            const hasCode = await emulateProgress(clientToken);
            if (hasCode) {
                break;
            }
        }

        try {
            const key = await generateKey(clientToken);
            return key;
        } catch (error) {
            console.error(`Failed to generate key: ${error.message}`);
            return null;
        }
    }

    function generateClientId() {
        const timestamp = Date.now();
        const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
        return `${timestamp}-${randomNumbers}`;
    }

    async function login(clientId) {
        const response = await fetch('https://api.gamepromo.io/promo/login-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appToken: currentAppConfig.appToken, clientId, clientOrigin: 'deviceid' })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error_message || 'Failed to log in');
        }

        return data.clientToken;
    }

    async function emulateProgress(clientToken) {
        const response = await fetch('https://api.gamepromo.io/promo/register-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({
                promoId: currentAppConfig.promoId,
                eventId: generateUUID(),
                eventOrigin: 'undefined'
            })
        });
        const data = await response.json();
        return data.hasCode;
    }

    async function generateKey(clientToken) {
        const response = await fetch('https://api.gamepromo.io/promo/create-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`
            },
            body: JSON.stringify({ promoId: currentAppConfig.promoId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error_message || 'Failed to generate key');
        }
        return data.promoCode;
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function delayRandom() {
        return Math.random() / 3 + 1;
    }

    function updateProgress(progress, remainingTime) {
        progressBar.style.width = `${progress * 100}%`;
        const timeLeft = remainingTime > 0 ? `${Math.ceil(remainingTime / 1000)}s left` : 'Done';
        progressBar.textContent = `${Math.round(progress * 100)}% - ${timeLeft}`;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
});

