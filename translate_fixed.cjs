const fs = require('fs');
const https = require('https');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

function translateText(text, targetLang) {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    let translated = '';
                    if (json[0]) {
                        json[0].forEach(item => {
                            if (item[0]) translated += item[0];
                        });
                    }
                    resolve(translated || text);
                } catch (e) {
                    resolve(text); // fallback
                }
            });
        }).on('error', (err) => {
            resolve(text); // fallback
        });
    });
}

async function translateObject(obj, targetLang) {
    const keys = Object.keys(obj);
    const translatedObj = {};
    for (let i = 0; i < keys.length; i++) {
        const val = obj[keys[i]];
        // Only translate actual strings, and skip very basic formatting if needed
        try {
            const translated = await translateText(val, targetLang);
            translatedObj[keys[i]] = translated;
            if (i % 20 === 0) console.log(`Translated ${i}/${keys.length}`);
            await new Promise(r => setTimeout(r, 100)); // Rate limit protection
        } catch (err) {
            translatedObj[keys[i]] = val;
        }
    }
    return translatedObj;
}

async function run() {
    try {
        console.log('Translating to Hindi...');
        const hi = await translateObject(en, 'hi');
        fs.writeFileSync('src/locales/hi.json', JSON.stringify(hi, null, 2));
        
        console.log('Translating to Telugu...');
        const te = await translateObject(en, 'te');
        fs.writeFileSync('src/locales/te.json', JSON.stringify(te, null, 2));
        
        console.log('Translating to Tamil...');
        const ta = await translateObject(en, 'ta');
        fs.writeFileSync('src/locales/ta.json', JSON.stringify(ta, null, 2));
        
        console.log('Done!');
    } catch (e) {
        console.error(e);
    }
}
run();
