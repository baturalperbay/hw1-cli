global installation ```npm install -g hw1-cli```

local installation ```npm install hw1-cli```

This CLI integrates both Commander for command-based execution and Inquirer for an interactive usage.
---
Commander Commands:

    pool-status: Displays the status of the liquidity pool.
    add-liquidity <amountA> <amountB>: Adds liquidity to the pool with specified token amounts.
    remove-liquidity <percent>: Removes liquidity from the pool by percentage.
    swap <fromToken> <toToken> <amount>: Swaps an amount of one token for another.
    view-user-balance: Displays the user's token balance.
---
Interactive Mode (Inquirer):
- If you start the CLI without any arguments or flags, it will open an interactive mode powered by Inquirer. 
