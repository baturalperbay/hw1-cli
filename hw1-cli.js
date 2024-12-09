#!/usr/bin/env node

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

async function removeLiquidity() {
    const data = readData();

    const tokenA20 = truncate(data.liquidityShare.tokenA / 5);
    const tokenA50 = truncate(data.liquidityShare.tokenA / 2);
    const tokenA100 = truncate(data.liquidityShare.tokenA);
    const tokenB20 = truncate(data.liquidityShare.tokenB / 5);
    const tokenB50 = truncate(data.liquidityShare.tokenB / 2);
    const tokenB100 = truncate(data.liquidityShare.tokenB);

    // display the token shares and the amounts for 20%, 50%, and 100%
    console.log(chalk.blueBright("Your shares in the pool:"));
    console.log(chalk.yellowBright(`Token A: ${truncate(data.liquidityShare.tokenA)}`));
    console.log(chalk.yellowBright(`Token B: ${truncate(data.liquidityShare.tokenB)}`));
    console.log();

    console.log(chalk.blueBright("Percentages for Token A:"));
    console.log(chalk.yellowBright(`20%: ${tokenA20}\n50%: ${tokenA50}\n100%: ${tokenA100}`));
    console.log();

    console.log(chalk.blueBright("Percentages for Token B:"));
    console.log(chalk.yellowBright(`20%: ${tokenB20}\n50%: ${tokenB50}\n100%: ${tokenB100}`));
    console.log();

    let { percentage } = await inquirer.prompt([
        {
            type: 'input',
            name: 'percentage',
            message: `Enter percentage you want to withdraw from the pool %1-100:  `,
            validate: (input) => {
                const value = parseFloat(input);
                if (isNaN(value) || value <= 0 || value > 100) {
                    return chalk.red(`Please enter a valid amount between 1 and 100`);
                }
                return true;
            }
        }
    ]);

    percentage = parseFloat(percentage);
    const amountWithdrawA = data.liquidityShare.tokenA * percentage / 100;
    const amountWithdrawB = data.liquidityShare.tokenB * percentage / 100;

    data.pool.tokenA -= amountWithdrawA;
    data.pool.tokenB -= amountWithdrawB;

    data.userBalance.tokenA += amountWithdrawA;
    data.userBalance.tokenB += amountWithdrawB;

    data.liquidityShare.tokenA -= amountWithdrawA;
    data.liquidityShare.tokenB -= amountWithdrawB;

    console.log(chalk.green(`Success! You have withdrawn ${truncate(amountWithdrawA)} Token A and ${truncate(amountWithdrawB)} Token B from the pool.`))
}

async function addLiquidity() {
    const data = readData();
    const poolRatio = data.pool.tokenA / data.pool.tokenB;

    const { amountA } = await inquirer.prompt([
        {
            type: 'input',
            name: 'amountA',
            message: `Enter the amount of Token A you want to add (1 - ${truncate(data.userBalance.tokenA)}): `,
            validate: (input) => {
                const value = parseFloat(input);
                if (isNaN(value) || value <= 0 || value > data.userBalance.tokenA) {
                    return chalk.red(`Please enter a valid amount between 1 and ${truncate(data.userBalance.tokenA)}.`);
                }
                return true;
            }
        }
    ]);

    const tokenAmountA = parseFloat(amountA);
    const requiredTokenB = tokenAmountA / poolRatio;

    // check if the user has enough Token B
    if (requiredTokenB > data.userBalance.tokenB) {
        console.log(chalk.red(`Insufficient Token B for the given Token A amount. You need ${truncate(requiredTokenB)} Token B.`));
        console.log(chalk.yellowBright(`You can contribute up to ${truncate(data.userBalance.tokenB * poolRatio)} Token A with your current Token B balance.`));
        return;
    }

    // confirmation for the liquidity addition
    console.log(chalk.blueBright(`For ${truncate(tokenAmountA)} Token A, you need to add ${truncate(requiredTokenB)} Token B.`));
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to proceed with this contribution?',
        }
    ]);

    if (!confirm) {
        console.log(chalk.yellow('Liquidity addition canceled.'));
        return;
    }

    data.userBalance.tokenA -= tokenAmountA;
    data.userBalance.tokenB -= requiredTokenB;
    data.pool.tokenA += tokenAmountA;
    data.pool.tokenB += requiredTokenB;

    data.liquidityShare.tokenA += tokenAmountA;
    data.liquidityShare.tokenB += requiredTokenB;

    writeData(data);
    console.log(chalk.green(`Success! ${truncate(tokenAmountA)} Token A and ${truncate(requiredTokenB)} Token B have been added to the pool.`));
}

async function swapTokens() {
    const data = readData();
    const { choice: tokenSwapChoice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Choose operation:',
            choices: [
                'Swap Token A for Token B',
                'Swap Token B for Token A',
                'Go Back'
            ],
        },
    ]);

    switch ( tokenSwapChoice ) {
        case 'Go Back':
            await showMenu();
            break;
        case 'Swap Token A for Token B':
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

        case 'Swap Token B for Token A':
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
    console.log(chalk.blueBright('Pool Status:'));
    console.log(chalk.yellowBright(`Token A: ${truncate(data.pool.tokenA)}`));
    console.log(chalk.yellowBright(`Token B: ${truncate(data.pool.tokenB)}`));
}

async function viewUserBalance() {
    const data = readData();
    console.log(chalk.blueBright('User balance:'));
    console.log(chalk.yellowBright(`Token A: ${truncate(data.userBalance.tokenA)}`));
    console.log(chalk.yellowBright(`Token B: ${truncate(data.userBalance.tokenB)}`));
}

async function showMenu() {
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: chalk.bgGreenBright('Uniswap V2 DEX Simulation'),
            choices: [
                'Pool Status',
                'View User Balance',
                'Swap Tokens',
                'Add Liquidity',
                'Remove Liquidity',
                'Exit',
            ],
        },
    ]);

    switch (choice) {
        case 'Pool Status':
            await viewCurrentPool();
            break;
        case 'View User Balance':
            await viewUserBalance();
            break;
        case 'Swap Tokens':
            await swapTokens();
            break;
        case 'Add Liquidity':
            await addLiquidity();
            break;
        case 'Remove Liquidity':
            await removeLiquidity();
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
    .action(async () => {
        await viewCurrentPool()
    });

program
    .command('view-user-balance')
    .description('View user balance')
    .action(async () => {
        await viewUserBalance();
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
    const inputWithFee = inputAmount //  ̶0̶.̶3̶%̶ ̶f̶e̶e̶
    const numerator = inputWithFee * reserveOut;
    const denominator = reserveIn + inputWithFee;
    return numerator / denominator;
}

program
    .command('add-liquidity <amountA> <amountB>')
    .description('Adds liquidity to the pool.')
    .action(async(amountA, amountB) => {
        const data = readData();
        const tokenAmountA = parseFloat(amountA);
        const tokenAmountB = parseFloat(amountB);

        if (tokenAmountA <= 0 || tokenAmountB <= 0) {
            console.log(chalk.red('Amounts must be greater than zero.'));
            return;
        }

        if (data.userBalance.tokenA < tokenAmountA || data.userBalance.tokenB < tokenAmountB) {
            console.log(chalk.red('Insufficient balance!'));
            await viewUserBalance()
            return;
        }

        let poolRatio = data.pool.tokenA / data.pool.tokenB;
        const requiredTokenB = tokenAmountA / poolRatio;

        if (!(truncate(poolRatio) === truncate(tokenAmountA / (tokenAmountB)))) {
            if (data.userBalance.tokenB < requiredTokenB) {
                const maxTokenA = data.userBalance.tokenB * poolRatio;
                console.log(chalk.red(`Token B required for the given Token A value is ${truncate(requiredTokenB)}. Insufficient Token B.`));
                console.log(chalk.yellowBright(`You can only contribute up to ${truncate(maxTokenA)} Token A with your current Token B balance.`));
                return;
            }

            console.log(chalk.red(`Invalid ratio for the pool. Make sure A/B is ${truncate(poolRatio)}\nThe correct Token B amount is ${truncate(tokenAmountA / poolRatio)}`));
            await viewCurrentPool()
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
