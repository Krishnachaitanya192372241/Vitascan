process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const translate = require('translate-google');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

async function translateObject(obj, targetLang) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    
    const translatedObj = {};
    for (let i = 0; i < keys.length; i++) {
        try {
            const translatedValue = await translate(values[i], {to: targetLang});
            translatedObj[keys[i]] = translatedValue;
            // small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100));
        } catch(err) {
            console.error(`Failed to translate key ${keys[i]}:`, err);
            translatedObj[keys[i]] = values[i];
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
