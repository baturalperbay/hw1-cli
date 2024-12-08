import inquirer from 'inquirer';
import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs';

const DATA_FILE = './data.json';

function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                pool: { tokenA: 1000, tokenB: 1000, K: 1000000 },
                userBalance: { tokenA: 500, tokenB: 500 },
                liquidityShare: { tokenA: 0, tokenB: 0 }
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            //console.log(`File ${DATA_FILE} created with default data.`);
            return initialData;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (err) {
        console.error('Error reading or creating data file:', err);
        return { pool: { tokenA: 1000, tokenB: 1000, K: 1000000 }, userBalance: { tokenA: 500, tokenB: 500 }, liquidityShare: { tokenA: 0, tokenB: 0 } };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function truncate(number) {
    return Math.trunc(number * 100) / 100;
    // truncate because .toFixed(2) rounds the number.
    // not very necessary I know.
}

async function addLiquidity() {
    const data = readData();

    let { amountA } = await inquirer.prompt([
        {
            type: 'input',
            name: 'amountA',
            message: `Enter the amount of Token A you want to add (1 - ${truncate(data.userBalance.tokenA)}): `,
            validate: (input) => {
                const value = parseFloat(input);
                if (isNaN(value) || value <= 0 || value > data.userBalance.tokenA) {
                    return chalk.red(`Please enter a valid amount between 1 and ${truncate(data.userBalance.tokenA)}`);
                }
                return true;
            }
        }
    ]);

    let { amountB } = await inquirer.prompt([
        {
            type: 'input',
            name: 'amountB',
            message: `Enter the amount of Token B you want to add (1 - ${truncate(data.userBalance.tokenB)}): `,
            validate: (input) => {
                const value = parseFloat(input);
                if (isNaN(value) || value <= 0 || value > data.userBalance.tokenB) {
                    return `Please enter a valid amount between 1 and ${truncate(data.userBalance.tokenB)}`;
                }
                return true;
            }
        }
    ]);

    amountA = parseFloat(amountA);
    amountB = parseFloat(amountB);

    data.liquidityShare.tokenA += amountA;
    data.liquidityShare.tokenB += amountB;

    // Remove tokens from the user's balance.
    data.userBalance.tokenA -= amountA;
    data.userBalance.tokenB -= amountB;

    // Add the tokens to the pool
    data.pool.tokenA += amountA;
    data.pool.tokenB += amountB;

    // Update JSON file.
    writeData(data);
    console.log(chalk.green(`Success! ${truncate(amountA)} Token A and ${truncate(amountB)} Token B have been added to the pool.`));
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
                    message: `Enter the amount of Token A you want to swap (1 - ${truncate(data.userBalance.tokenA)}): `,
                },
            ]);

            tokenSwap_A2B_Amount = parseFloat(tokenSwap_A2B_Amount);

            if (data.userBalance.tokenA > tokenSwap_A2B_Amount) {
                const receivedTokenB =  data.pool.tokenB - (data.pool.K / (data.pool.tokenA + tokenSwap_A2B_Amount));
                data.pool.tokenA += tokenSwap_A2B_Amount;
                data.pool.tokenB -= receivedTokenB;
                data.userBalance.tokenB += receivedTokenB;
                data.userBalance.tokenA -= tokenSwap_A2B_Amount;

                console.log(chalk.green(`Swap successful! ${truncate(tokenSwap_A2B_Amount)} Token A was exchanged for ${truncate(receivedTokenB)} Token B.`));
            }

            break;

        case 'swap Token B for Token A':
            let { tokenSwap_B2A_Amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'tokenSwap_B2A_Amount',
                    message: `Enter the amount of Token B you want to swap (1 - ${truncate(data.userBalance.tokenB)}): `,
                },
            ]);

            tokenSwap_B2A_Amount = parseFloat(tokenSwap_B2A_Amount);

            if (data.userBalance.tokenB > tokenSwap_B2A_Amount) {
                const receivedTokenA =  data.pool.tokenA - (data.pool.K / (data.pool.tokenB + tokenSwap_B2A_Amount));
                data.pool.tokenB += tokenSwap_B2A_Amount;
                data.pool.tokenA -= receivedTokenA;
                data.userBalance.tokenA += receivedTokenA;
                data.userBalance.tokenB -= tokenSwap_B2A_Amount;

                console.log(chalk.green(`Swap successful! ${truncate(tokenSwap_B2A_Amount)} Token B was exchanged for ${truncate(receivedTokenA)} Token A.`));
            }

            break;
    }
    writeData(data);
}

async function viewCurrentPool() {
    const data = readData();
    console.log("Current pool: ");
    console.log(`Token A: ${truncate(data.pool.tokenA)} \nToken B: ${truncate(data.pool.tokenB)}`);
}

async function viewUserBalance() {
    const data = readData();
    console.log(`Token A: ${truncate(data.userBalance.tokenA)} \n Token B: ${truncate(data.userBalance.tokenB)}`);
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

program
    .command('pool-status')
    .description('View pool status')
    .action(() => {
        const data = readData();
        console.log(chalk.blue('Pool Status:'));
        console.log(`Token A: ${truncate(data.pool.tokenA)}`);
        console.log(`Token B: ${truncate(data.pool.tokenB)}`);
        //console.log(`K (Sabiti): ${data.pool.K}`);
    });

program
    .command('view-user-balance')
    .description('View user balance')
    .action(() => {
        const data = readData();
        console.log(chalk.blue('User balance:'));
        console.log(`Token A: ${truncate(data.userBalance.tokenA)}`);
        console.log(`Token B: ${truncate(data.userBalance.tokenB)}`);
    });

program
    .command('swap <fromToken> <toToken> <amount>')
    .description('Swap tokens within the pool.')
    .action((fromToken, toToken, amount) => {
        const data = readData();
        const fromTokenKey = `token${fromToken.toUpperCase()}`;
        const toTokenKey = `token${toToken.toUpperCase()}`;

        // Making sure the token is valid.
        if (!data.pool[fromTokenKey] || !data.pool[toTokenKey] || !data.userBalance[fromTokenKey]) {
            console.log(chalk.red('Invalid token or insufficient balance! Please enter a valid token name.'));
            return;
        }

        const inputAmount = parseFloat(amount);

        // Check if the user has sufficient funds.
        if (data.userBalance[fromTokenKey] < inputAmount) {
            console.log(chalk.red('Insufficient balance!'));
            return;
        }

        // swap (x * y = k)
        const outputAmount = calculateSwapOutput(inputAmount, data.pool[fromTokenKey], data.pool[toTokenKey]);

        // Check if there is a sufficient amount of tokens in the pool.
        if (outputAmount > data.pool[toTokenKey]) {
            console.log(chalk.red('Insufficient tokens in the pool!'));
            return;
        }

        // update pool and userBalance
        data.userBalance[fromTokenKey] -= inputAmount;
        data.userBalance[toTokenKey] += outputAmount;

        data.pool[fromTokenKey] += inputAmount;
        data.pool[toTokenKey] -= outputAmount;

        //data.pool.K = data.pool.tokenA * data.pool.tokenB;

        // update JSON file.
        writeData(data);

        console.log(chalk.green(`Swap successful! ${truncate(amount)} ${fromToken} was exchanged for ${truncate(outputAmount)} ${toToken}.`));
    });

function calculateSwapOutput(inputAmount, reserveIn, reserveOut) {
    const inputWithFee = inputAmount * 0.997; // 0.3% fee
    const numerator = inputWithFee * reserveOut;
    const denominator = reserveIn + inputWithFee;
    return numerator / denominator;
}

program
    .command('add-liquidity <amountA> <amountB>')
    .description('Adds liquidity to the pool.')
    .action((amountA, amountB) => {

        const data = readData();
        let poolRatio = data.pool.tokenA / data.pool.tokenB;
        const tokenAmountA = parseFloat(amountA);
        const tokenAmountB = parseFloat(amountB);

        if (!(poolRatio.toFixed(2) === (tokenAmountA / tokenAmountB).toFixed(2))) {
            console.log(chalk.red(`Invalid ratio for the pool. Make sure A/B is ${truncate(poolRatio)}\nThe correct Token B amount is ${truncate(tokenAmountA / poolRatio)}`));
            console.log(chalk.blue('Pool Status:'));
            console.log(chalk.yellowBright(`Token A: ${truncate(data.pool.tokenA)}`));
            console.log(chalk.yellowBright(`Token B: ${truncate(data.pool.tokenB)}`));
            return;
        }


        if (data.userBalance.tokenA < tokenAmountA || data.userBalance.tokenB < tokenAmountB) {
            console.log(chalk.red('Insufficient balance!'));
            return;
        }

        // remove tokens from the user's balance.
        data.userBalance.tokenA -= tokenAmountA;
        data.userBalance.tokenB -= tokenAmountB;

        // add tokens to the pool.
        data.pool.tokenA += tokenAmountA;
        data.pool.tokenB += tokenAmountB;

        data.liquidityShare.tokenA += tokenAmountA;
        data.liquidityShare.tokenB += tokenAmountB;

        //data.pool.K = data.pool.tokenA * data.pool.tokenB;
        // update JSON file.
        writeData(data);

        console.log(chalk.green(`Success! ${truncate(tokenAmountA)} Token A and ${truncate(tokenAmountB)} Token B have been added to the pool.`));
    });

program
    .command('remove-liquidity <percent>')
    .description('Removes liquidity from the pool with the given percentage.')
    .action((percent) => {
        const data = readData();
        const percentToRemove = parseFloat(percent) / 100;

        const tokenARemove = data.liquidityShare.tokenA * percentToRemove;
        const tokenBRemove = data.liquidityShare.tokenB * percentToRemove;

        // add tokens to the share.
        data.liquidityShare.tokenA -= tokenARemove;
        data.liquidityShare.tokenB -= tokenBRemove;

        // add tokens back to the user.
        data.userBalance.tokenA += tokenARemove;
        data.userBalance.tokenB += tokenBRemove;

        // remove the tokens from the pool.
        data.pool.tokenA -= tokenARemove;
        data.pool.tokenB -= tokenBRemove;

        //data.pool.K = data.pool.tokenA * data.pool.tokenB;

        // update JSON file.
        writeData(data);

        console.log(chalk.green(`Success! ${truncate(tokenARemove)} of Token A and ${truncate(tokenBRemove)} of Token B have been removed from the pool.`))
    });

if (process.argv.length > 2) {
    program.parse(process.argv); // if there are any arguments, open commander.
}
else {
    showMenu().catch(err => console.error("Error:", err));
}
