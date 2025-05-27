import { WebSocketServer } from 'ws';
import { randomInt } from 'crypto'; 
import bigInt from 'big-integer';

var wss = new WebSocketServer({ port: 8080 });

const p = bigInt('90722155828181048969749728539684045541745868571065892969806150299010470107853576829377738891122890902459409044070980516686519432661653114187372550953623168829856997530433139610279676550711254544249739567203338425641250321746731203051622163394729483418642048999311182810556907794341451840856064650862678671989');
const q = bigInt('953645056392132296959171247654650030037577699977');
const g = bigInt('11867502735465485252934255912858108285082089078785805327397379545747507867897804887876074842401597178394225740130912362959417814543756675149414999671130635454726545326769189101512525130037778255185334429896454528136714514123090361979369913339042170701710462532232347374243348413339748896097752222359855509171');
const w = bigInt(211);
const y = g.modPow(q.minus(w), p);


wss.on('connection', (ws) => {
    console.log('Клиент подключен');

    let xReceived;
    let currentE;

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            if (msg.step === 'commit') {
                if (!msg.x || !msg.r) throw new Error('Неверный формат коммита');
                xReceived = bigInt(msg.x);
            
                currentE = bigInt(129); 
                ws.send(JSON.stringify({
                    step: 'challenge',
                    e: currentE.toString()
                }));
            } 
            else if (msg.step === 'response') {

                if (!msg.s) throw new Error('Неверный формат ответа');
                const s = bigInt(msg.s);

                const gs = g.modPow(s, p);
                const ye = y.modPow(currentE, p);
                const z = gs.multiply(ye).mod(p);

                const result = z.equals(xReceived);
                
                ws.send(JSON.stringify({
                    step: 'result',
                    verified: result,
                    z: z.toString(),
                    x: xReceived.toString()
                }));
            }
            else {
                throw new Error('Неизвестный шаг протокола');
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: e.message }));
            console.error('Ошибка:', e.message);
        }
    });

    ws.on('close', () => {
        console.log('Клиент отключен');
    });
});

console.log('Сервер запущен на ws://localhost:8080');