import inquirer from 'inquirer';

/* directly from hw1 page */
let pool = { tokenA: 1000, tokenB: 1000, K: 1000000 };
let userBalance = { tokenA: 500, tokenB: 500 };
/* directly from hw1 page */

async function addLiquidity() {
    console.log("You chose to add liquidity.");
}

async function swapTokens() {
    console.log("You chose to swap tokens.");
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
