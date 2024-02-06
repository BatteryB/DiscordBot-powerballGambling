import { REST, Routes, SlashCommandBuilder } from 'discord.js';
const TOKEN = 'TOKEN';
const CLIENT_ID = 'CLIENT_ID';



const commands = [
    {
        name: '가입하기',
        description: '도박 게임에 가입합니다.',
        options: [
            {
                name: '닉네임',
                description: '게임에 사용될 자신의 닉네임을 정해주세요!',
                type: 3,
                required: true
            }
        ]
    },
    {
        name: '내정보',
        description: '자신의 도박 정보를 확인합니다.'
    },
    {
        name: '도박',
        description: "게임중 하나를 시작합니다.",
        options: [
            {
                name: '게임',
                description: "게임 종류를 선택하세요!",
                type: 3,
                required: true,
                choices: [
                    {
                        name: '파워볼',
                        value: '파워볼'
                    }
                ]
            }
        ]
    },
    {
        name: '파워볼배팅',
        description: "파워볼의 다음회차에 배팅을 합니다. 배팅 후에는 '/도박 게임:파워볼' 명령어로 결과를 볼 수 있습니다.",
        options: [
            {
                name: '선택',
                description: '배당율은 1.95배 입니다.',
                type: 3,
                required: true,
                choices: [
                    {
                        name: '일반볼 짝수',
                        value: '일짝'
                    },
                    {
                        name: '일반볼 홀수',
                        value: '일홀'
                    },
                    {
                        name: '일반볼 언더',
                        description: '13~72',
                        value: '일언'
                    },
                    {
                        name: '일반볼 오버',
                        description: '73~130',
                        value: '일옵'
                    },
                    {
                        name: '파워볼 짝수',
                        value: '파짝'
                    },
                    {
                        name: '파워볼 홀수',
                        value: '파홀'
                    },
                    {
                        name: '파워볼 언더',
                        description: '0~4',
                        value: '파언'
                    },
                    {
                        name: '파워볼 오버',
                        description: '5~9',
                        value: '파옵'
                    },
                ]
            },
            {
                name: '금액',
                description: '배팅할 금액을 선택합니다.',
                type: 10,
                required: true
            }
        ]
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}
