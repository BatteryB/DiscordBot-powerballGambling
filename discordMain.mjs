import { Client, GatewayIntentBits } from 'discord.js';
import sqlite3 from 'sqlite3';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = 'TOKEN';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const db = new sqlite3.Database('DB/toto.db');

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === '가입하기') {
        let e;
        let userId = interaction.user.id
        let setNickName = interaction.options.getString('닉네임');
        let join = await joinCheck(userId);

        if (!join) {
            if (setNickName) {
                await db.run('INSERT INTO user (id, nickName, money) VALUES (?, ?, 10000)', [userId, setNickName], (err) => {
                    if (err) {
                        e = err;
                    }
                })

                if (!e) {
                    await interaction.reply({ content: '사용자 가입 성공\n가입 보너스 10000원 지급', ephemeral: true });
                } else {
                    await interaction.reply({ content: e, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: '게임에 사용될 닉네임을 입력해주세요.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: '이미 가입되어있습니다.', ephemeral: true });
        }

    }

    if (interaction.commandName === '내정보') {
        let e;
        let join = await joinCheck(interaction.user.id);
        let user = await getUserInfo(interaction.user.id);

        if (join) {

            let userPrinf = [
                '사용자이름: ' + interaction.user.displayName,
                '닉네임: ' + user.nickName,
                '돈: ' + user.money
            ]

            let userInfoEmbed = new EmbedBuilder()
                .setTitle('빳데리 도@박장')
                .setDescription(userPrinf.join('\n'))
                .setThumbnail(interaction.user.avatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [userInfoEmbed] });
        } else {
            await interaction.reply({ content: '먼저 가입을 해주세요.', ephemeral: true });
        }
    }

    if (interaction.commandName === '도박') {
        let join = await joinCheck(interaction.user.id);
        let gameName = interaction.options.getString('게임');
        if (join) {
            if (!gameName) {
                await interaction.reply({ content: '플레이 하실 게임을 입력 해주세요.', ephemeral: true })
            } else if (gameName === '파워볼') {
                let powerResult = powerball();
                let battingUser = await BattingUser(gameName), prizeUser = [], printPrizeUser = '';
                let prizeEmbed;

                for (let i = 0; i < battingUser.length; i++) {
                    if (battingUser[i].choice === powerResult.nomalResult.OdEv ||
                        battingUser[i].choice === powerResult.nomalResult.UnOv ||
                        battingUser[i].choice === powerResult.powerResult.OdEv ||
                        battingUser[i].choice === powerResult.powerResult.UnOv) {

                        prizeUser.push({ id: battingUser[i].id, name: battingUser[i].nickName, money: Math.trunc(battingUser[i].money * 1.95) });
                        printPrizeUser += (battingUser[i].nickName + ' | ' + Math.trunc(battingUser[i].money * 1.95) + '원\n')
                    }
                }

                for (let i = 0; i < prizeUser.length; i++) {
                    await db.run('update user set money = money + ? where id = ?', [prizeUser[i].money, prizeUser[i].id]);
                }

                await db.run('delete from powerballBatting');

                if (printPrizeUser) {
                    prizeEmbed = new EmbedBuilder()
                        .setTitle('당첨자 목록')
                        .setDescription(printPrizeUser)
                        .setColor('Green')
                        .setTimestamp();
                } else {
                    prizeEmbed = new EmbedBuilder()
                        .setTitle('당첨자가 없습니다.')
                        .setColor('Red')
                        .setTimestamp();
                }

                await interaction.reply({ content: powerResult.result, embeds: [prizeEmbed] });

            }
        } else {
            await interaction.reply({ content: '먼저 가입을 해주세요.', ephemeral: true });
        }
    }

    if (interaction.commandName === '파워볼배팅') {
        let join = await joinCheck(interaction.user.id);
        if (join) {
            let user = await getUserInfo(interaction.user.id);
            let battingChoice = interaction.options.getString('선택');
            let battingMoney = interaction.options.getNumber('금액');

            if (battingMoney < 100) {
                await interaction.reply({ content: '최소 배팅 금액은 100원 입니다.', ephemeral: true });
            } else if (user.money >= battingMoney) {
                setTimeout(async () => {
                    await db.run('update user set money = money - ? where id = ?', [battingMoney, interaction.user.id]);
                    await db.run('insert into powerballBatting (id, choice, money) values (?, ?, ?)', [interaction.user.id, battingChoice, battingMoney]);
                    interaction.reply({ content: '"' + battingChoice + '"에 ' + battingMoney + '원을 배팅하였습니다.', ephemeral: true });
                }, 100);
            } else {
                await interaction.reply({ content: '돈이 부족합니다.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: '먼저 가입을 해주세요.', ephemeral: true });
        }
    }

});


function joinCheck(id) {
    return new Promise((resolve, reject) => {
        db.get('select * from user where id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

function getUserInfo(id) {
    return new Promise((reslove, reject) => {
        db.get('select * from user where id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                reslove(row);
            }
        });
    });
}


function BattingUser(game) {
    let table;
    if (game === '사다리') {
        table = "ladderBatting";
    } else if (game === '파워볼') {
        table = "powerballBatting"
    }
    return new Promise((resolve, reject) => {
        db.all(`SELECT user.id, user.nickName, ${table}.choice, ${table}.money FROM ${table} INNER JOIN user ON ${table}.id = user.id`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function powerball() {
    let nomalBall = [], nomalDrow;
    let powerBall = Math.floor(Math.random() * 10);
    let Result = '--------------------------------\n            파워볼 게임 결과\n--------------------------------\n일반볼: ';
    let nomalResult = { OdEv: null, UnOv: null }, powerResult = { OdEv: null, UnOv: null };

    while (nomalBall.length < 5) {
        nomalDrow = Math.floor(Math.random() * 28) + 1;
        if (nomalBall.indexOf(nomalDrow) === -1) {
            nomalBall.push(nomalDrow);
        }
    }

    let nomalSum = 0;
    for (let i = 0; i < nomalBall.length; i++) {
        nomalSum += nomalBall[i];
    }

    //일홀짝
    if (nomalSum % 2 === 0) {
        nomalResult.OdEv = ['짝', '일짝'];
    } else {
        nomalResult.OdEv = ['홀', '일홀'];
    }

    //일언오바
    if (nomalSum < 73) {
        nomalResult.UnOv = ['언더', '일언'];
    } else {
        nomalResult.UnOv = ['오버', '일옵'];
    }

    //파홀짝
    if (powerBall % 2 === 0) {
        powerResult.OdEv = ['짝', '파짝'];
    } else {
        powerResult.OdEv = ['홀', '파홀'];
    }

    //파언오바
    if (powerBall < 5) {
        powerResult.UnOv = ['언더', '파언'];
    } else {
        powerResult.UnOv = ['오버', '파옵'];
    }


    Result += nomalBall[0];
    for (let i = 1; i < nomalBall.length; i++) {
        Result += ', ' + nomalBall[i];
    }
    Result += '\n파워볼: ' + powerBall + '\n--------------------------------\n                     일반볼\n--------------------------------\n합계: ' + nomalSum + '\n홀/짝: ' + nomalResult.OdEv[0] + '\n언더/오버: ' + nomalResult.UnOv[0];
    Result += '\n--------------------------------\n                     파워볼\n--------------------------------\n홀/짝: ' + powerResult.OdEv[0] + '\n언더/오버: ' + powerResult.UnOv[0];

    return {
        result: Result,
        nomal: nomalBall,
        nomalResult: { OdEv: nomalResult.OdEv[1], UnOv: nomalResult.UnOv[1] },
        power: powerBall,
        powerResult: { OdEv: powerResult.OdEv[1], UnOv: powerResult.UnOv[1] }
    };
}

client.login(TOKEN);