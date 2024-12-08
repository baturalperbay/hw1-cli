import inquirer from 'inquirer';
import fs from 'fs';

const DATA_FILE = './data.json';

function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                pool: { tokenA: 1000, tokenB: 1000, K: 1000000 },
                userBalance: { tokenA: 500, tokenB: 500 }
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            //console.log(`File ${DATA_FILE} created with default data.`);
            return initialData;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (err) {
        console.error('Error reading or creating data file:', err);
        return { pool: { tokenA: 1000, tokenB: 1000, K: 1000000 }, userBalance: { tokenA: 500, tokenB: 500 } };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* directly from hw1 page
let pool = { tokenA: 1000, tokenB: 1000, K: 1000000 };
let userBalance = { tokenA: 500, tokenB: 500 };
directly from hw1 page */

async function addLiquidity() {
    console.log("You chose to add liquidity.");
}

async function swapTokens() {
    const data = readData();
    const { choice: tokenSwapChoice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Choose operation:',
            choices: [
                'swap Token A for Token B',
                'swap Token B for Token A',
            ],
        },
    ]);

    switch ( tokenSwapChoice ) {
        case 'swap Token A for Token B':
            let { tokenSwap_A2B_Amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'tokenSwap_A2B_Amount',
                    message: `Enter the amount of Token A you want to swap (1 - ${data.userBalance.tokenA}): `,
                },
            ]);

            tokenSwap_A2B_Amount = parseFloat(tokenSwap_A2B_Amount);

            if (data.userBalance.tokenA > tokenSwap_A2B_Amount) {
                const receivedTokenB =  data.pool.tokenB - (data.pool.K / (data.pool.tokenA + tokenSwap_A2B_Amount));
                data.pool.tokenA += tokenSwap_A2B_Amount;
                data.pool.tokenB -= receivedTokenB;
                data.userBalance.tokenB += receivedTokenB;
                data.userBalance.tokenA -= tokenSwap_A2B_Amount;
            }

            break;

        case 'swap Token B for Token A':
            let { tokenSwap_B2A_Amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'tokenSwap_B2A_Amount',
                    message: `Enter the amount of Token B you want to swap (1 - ${data.userBalance.tokenB}): `,
                },
            ]);

            tokenSwap_B2A_Amount = parseFloat(tokenSwap_B2A_Amount);

            if (data.userBalance.tokenB > tokenSwap_B2A_Amount) {
                const receivedTokenA =  data.pool.tokenA - (data.pool.K / (data.pool.tokenB + tokenSwap_B2A_Amount));
                data.pool.tokenB += tokenSwap_B2A_Amount;
                data.pool.tokenA -= receivedTokenA;
                data.userBalance.tokenA += receivedTokenA;
                data.userBalance.tokenB -= tokenSwap_B2A_Amount;
            }

            break;
    }
    writeData(data);
}

async function viewCurrentPool() {
    const data = readData();
    console.log("Current pool: ");
    console.log(`Token A: ${data.pool.tokenA} \n Token B: ${data.pool.tokenB}`);
}

async function viewUserBalance() {
    const data = readData();
    console.log(`Token A: ${data.userBalance.tokenA} \n Token B: ${data.userBalance.tokenB}`);
}

async function showMenu() {
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: '',
            choices: [
                'Add Liquidity',
                'Swap Tokens',
                'View the current pool',
                'View user balance',
                'Exit',
            ],
        },
    ]);

    switch (choice) {
        case 'Add Liquidity':
            await addLiquidity();
            break;
        case 'Swap Tokens':
            await swapTokens();
            break;
        case 'View the current pool':
            await viewCurrentPool();
            break;
        case 'View user balance':
            await viewUserBalance();
            break;
        case 'Exit':
            console.log("brb");
            return;
        default:
            console.log("invalid choice.");
    }

    await showMenu(); // => show the menu again.
}

showMenu().catch(err => {
    console.error("An error occurred:", err);
});
