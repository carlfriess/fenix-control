// Imports
let net = require('net');
let fs = require('fs');

// Ports
const PROTOCOL_PORT = 3001;

// Message IDs
const GENERATOR_STATUS_MSG = 1;
const ULTRASONIC_MSG = 2;
const IMAGE_MSG = 3;

// Set up protocol port
let conn;
net.createServer({}, socket => {
    document.querySelector('#status').innerHTML = '🔵';

    conn = socket;
    let buf = Buffer.alloc(0);

    socket.on('error', err => {
        console.log("ERROR: " + err);
    });

    socket.on('close', () => {
        console.log("Socket Closed!");
    });

    socket.on('data', data => {

        buf = Buffer.concat([buf, data]);

        switch (buf.readUInt8(0)) {
            case GENERATOR_STATUS_MSG:
                if (buf.length >= 2) {
                    handleGenerator(data.slice(1));
                    buf = buf.slice(2);
                }
                break;
            case ULTRASONIC_MSG:
                if (buf.length >= 21) {
                    handleUltrasonic(data.slice(1));
                    buf = buf.slice(21);
                }
                break;
            case IMAGE_MSG:
                if (buf.length >= 5 && buf.length - 5 >= buf.readUInt32LE(1)) {
                    handleImage(buf.slice(5));
                    buf = buf.slice(5 + buf.readUInt32LE(1));
                }
                break;
        }
    });
}).listen(PROTOCOL_PORT);

function emergencyStop() {
    let buffer = Buffer.from([0]);
    conn.write(buffer);
}

let toggle = false;

function handleLog(buffer) {
    let log = document.querySelector('#log');

    log.innerHTML += `${(toggle) ? '\n' : (toggle = true) && ''}${buffer.toString()}`;
    log.scrollTop = log.scrollHeight;
}

function handleGenerator(buffer) {
    const generators = [
        document.querySelector('#generator0'),
        document.querySelector('#generator1'),
        document.querySelector('#generator2')
    ];

    let i = buffer.readUInt8(0);
    generators.forEach((value, index, _) => {
        value.innerHTML = (index == i) ? "🔴" : "🔵";
    });
}

function handleUltrasonic(buffer) {
    const ultrasonics = [
        document.querySelector('#ultrasonic-forward'),
        document.querySelector('#ultrasonic-right'),
        document.querySelector('#ultrasonic-backward'),
        document.querySelector('#ultrasonic-left'),
        document.querySelector('#ultrasonic-down'),
    ];

    ultrasonics.reduce((prev, curr) => {
        curr.innerHTML = buffer.readFloatLE(prev).toFixed(2);
        return prev + 4;
    }, 0);
}

function handleImage(buffer) {
    const FILEPATH = `${__dirname}/img/${new Date().getTime()}.jpg`;

    fs.writeFile(FILEPATH, buffer, () => {
        document.querySelector('#img').src = FILEPATH;
    });
    // sharp(buffer).toFile(FILEPATH).then(() => {
    // }).catch((err) => console.log(err));
}

// Generator Test
// handleGenerator(Buffer.from([1]));

// Ultrasonic Test
// handleUltrasonic(Buffer.from([
//     0, 0, 72, 65,
//     0, 0, 72, 65,
//     0, 0, 72, 65,
//     0, 0, 72, 65,
//     0, 0, 72, 65
// ]));

// Image Test
// sharp('sample.jpg').toBuffer().then(data => {
//     handleImage(data);
// }).catch((err) => console.log(err));