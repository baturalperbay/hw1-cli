import inquirer from 'inquirer';

/* directly from hw1 page */
let pool = { tokenA: 1000, tokenB: 1000, K: 1000000 };
let userBalance = { tokenA: 500, tokenB: 500 };
/* directly from hw1 page */

async function addLiquidity() {
    console.log("You chose to add liquidity.");
}

async function swapTokens() {
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
                    message: 'Enter the amount of Token A you want to swap:',
                },
            ]);

            tokenSwap_A2B_Amount = parseFloat(tokenSwap_A2B_Amount);

            if (userBalance.tokenA > tokenSwap_A2B_Amount) {
                const receivedTokenB =  pool.tokenB - (pool.K / (pool.tokenA + tokenSwap_A2B_Amount));
                pool.tokenA += tokenSwap_A2B_Amount;
                pool.tokenB -= receivedTokenB;
                userBalance.tokenB += receivedTokenB;
                userBalance.tokenA -= tokenSwap_A2B_Amount;
            }

            break;

        case 'swap Token B for Token A':
            let { tokenSwap_B2A_Amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'tokenSwap_B2A_Amount',
                    message: 'Enter the amount of Token B you want to swap:',
                },
            ]);

            tokenSwap_B2A_Amount = parseFloat(tokenSwap_B2A_Amount);

            if (userBalance.tokenB > tokenSwap_B2A_Amount) {
                const receivedTokenA =  pool.tokenA - (pool.K / (pool.tokenB + tokenSwap_B2A_Amount));
                pool.tokenB += tokenSwap_B2A_Amount;
                pool.tokenA -= receivedTokenA;
                userBalance.tokenA += receivedTokenA;
                userBalance.tokenB -= tokenSwap_B2A_Amount;
            }

            break;
    }
}

async function viewCurrentPool() {
    console.log("You chose to view the current pool.");
    console.log(" Token A:", pool['tokenA'], "\n", "Token B:", pool['tokenB']);
}

async function viewUserBalance() {
    console.log(" Token A:", userBalance['tokenA'], "\n", "Token B:", userBalance['tokenB']);
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
