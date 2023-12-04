'use strict';

class BankistApp {
  constructor() {
    // Initialize accounts as an empty array initially
    this.accounts = [];

    // Other properties remain the same as in your previous code
    // ... (other properties initialization)

    this.fetchAccounts(); // Fetch accounts when the app starts

    // Other functionalities and event handlers remain the same
    // ...
  }

  async fetchAccounts() {
    try {
      const response = await fetch('http://localhost:3000/accounts');
  
      if (!response.ok) {
        throw new Error('Could not fetch accounts');
      }
  
      const fetchedAccounts = await response.json();
  
      if (!Array.isArray(fetchedAccounts)) {
        console.error('Invalid data format for accounts');
        return;
      }
  
      // Fetch movements for each account
      for (const account of fetchedAccounts) {
        const movementsResponse = await fetch(`http://localhost:3000/movements/${account.id}`);
        
        if (!movementsResponse.ok) {
          throw new Error(`Could not fetch movements for account ${account.id}`);
        }
  
        const movements = await movementsResponse.json();
  
        if (!Array.isArray(movements)) {
          console.error(`Invalid data format for movements of account ${account.id}`);
          return;
        }
  
        // Add movements to each account object
        account.movements = movements;
      }
  
      this.accounts = fetchedAccounts;
  
      // Call a method to handle UI update or perform actions based on the fetched accounts
      this.handleFetchedAccounts();
    } catch (error) {
      console.error('Error fetching accounts:', error.message);
      // Handle errors or display an error message to the user
    }
  }
  

  // Method to handle UI update based on fetched accounts
  handleFetchedAccounts() {
    // For example, log the fetched accounts
    console.log('Fetched accounts:', this.accounts);

    // You can perform other operations here based on the fetched accounts data
    // Update UI, set up event listeners, etc.
    // ...


    // Other properties
    this.labelWelcome = document.querySelector('.welcome');
    this.labelDate = document.querySelector('.date');
    this.labelBalance = document.querySelector('.balance__value');
    this.labelSumIn = document.querySelector('.summary__value--in');
    this.labelSumOut = document.querySelector('.summary__value--out');
    this.labelSumInterest = document.querySelector('.summary__value--interest');
    this.labelTimer = document.querySelector('.timer');
    this.containerApp = document.querySelector('.app');
    this.containerMovements = document.querySelector('.movements');
    this.btnLogin = document.querySelector('.login__btn');
    this.btnDeposit = document.querySelector('.form__btn--deposit');
    this.btnWithdraw = document.querySelector('.form__btn--withdraw');
    this.btnTransfer = document.querySelector('.form__btn--transfer');
    this.btnLoan = document.querySelector('.form__btn--loan');
    this.btnClose = document.querySelector('.form__btn--close');
    this.btnSort = document.querySelector('.btn--sort');
    this.inputLoginUsername = document.querySelector('.login__input--user');
    this.inputLoginPin = document.querySelector('.login__input--pin');
    this.inputDepositAmount = document.querySelector('.form__input--deposit-amount');
    this.inputWithdrawAmount = document.querySelector('.form__input--withdraw-amount');
    this.inputTransferTo = document.querySelector('.form__input--to');
    this.inputTransferAmount = document.querySelector('.form__input--amount');
    this.inputLoanAmount = document.querySelector('.form__input--loan-amount');
    this.inputCloseUsername = document.querySelector('.form__input--user');
    this.inputClosePin = document.querySelector('.form__input--pin');
    this.sorted = false;
    this.currentAccount = null;

    this.createUsernames(this.accounts);
    this.login();
    // this.deposit();
    // this.withdraw();
    this.transfer();
    this.loan();
    this.closeAccount();
    this.sortMovements();

    // Get data from localStorage
    this.getLocalStorage();
  }

  // Functions
  displayMovements(movements, sort = false) {
    this.containerMovements.innerHTML = '';
  
    if (!Array.isArray(movements)) {
      console.error('Movements data is not an array');
      return;
    }
  
    const movs = sort ? movements.slice().sort((a, b) => a - b) : movements;
  
    movs.forEach((mov, i) => {
      const type = mov.movement > 0 ? 'deposit' : 'withdrawal';
      const html = `
        <div class="movements__row">
          <div class="movements__type movements__type--${type}">
            ${i + 1} ${type}
          </div>
          <div class="movements__value">${mov.movement}$</div>
        </div>`;
      this.containerMovements.insertAdjacentHTML('afterbegin', html);
    });
  }    
  

  calcDisplayBalance(acc) {
    if (!Array.isArray(acc.movements) || acc.movements.length === 0) {
      console.error('Movements data is invalid or empty');
      return;
    }
  
    const balance = acc.movements.reduce((accBalance, movement) => accBalance + parseFloat(movement.movement), 0);
    acc.balance = balance;
    this.labelBalance.textContent = `${acc.balance}$`;
  }
  
  
  

  calcDisplaySummary(acc) {
    if (!Array.isArray(acc.movements) || acc.movements.length === 0) {
      console.error('Movements data is invalid or empty');
      return;
    }
  
    const incomes = acc.movements.filter(mov => mov > 0).reduce((acc, mov) => acc + mov, 0);
    this.labelSumIn.textContent = `${incomes}$`;
  
    const out = acc.movements.filter(mov => mov < 0).reduce((acc, mov) => acc + mov, 0);
    this.labelSumOut.textContent = `${Math.abs(out)}$`;
  
    const interest = acc.movements
      .filter(mov => mov > 0)
      .map(deposit => (deposit * acc.interestRate) / 100)
      .filter(int => int >= 1)
      .reduce((acc, int) => acc + int, 0);
    this.labelSumInterest.textContent = `${interest}$`;
  }
  

  createUsernames(accs) {
    accs.forEach(acc => {
      acc.username = acc.owner
        .toLowerCase()
        .split(' ')
        .map(name => name[0])
        .join('');
    });
  }

  updateUI(acc) {
    this.displayMovements(acc.movements);
    this.calcDisplayBalance(acc);
    this.calcDisplaySummary(acc);
  }

  // Event handlers
  login() {
    this.btnLogin.addEventListener('click', e => {
      e.preventDefault();
      this.currentAccount = this.accounts.find(acc => acc.username === this.inputLoginUsername.value);
      if (this.currentAccount?.pin === Number(this.inputLoginPin.value)) {
        this.labelWelcome.textContent = `Welcome back, ${this.currentAccount.owner.split(' ')[0]}`;
        this.containerApp.style.opacity = 100;
        this.inputLoginUsername.value = this.inputLoginPin.value = '';
        this.inputLoginPin.blur();
        this.updateUI(this.currentAccount);

        // Local storage 
        this.setLocalStorage();
      }
    });
  }

  // deposit() {
  //   this.btnDeposit.addEventListener('click', e => {
  //     e.preventDefault();
  //     const amount = Number(this.inputDepositAmount.value);
  //     if (amount > 0 && this.currentAccount.movements) {
  //       this.currentAccount.movements.push(amount);
  //       this.updateUI(this.currentAccount);
  //     }
  //     this.inputDepositAmount.value = '';
  //   });
  // }

  // withdraw() {
  //   this.btnWithdraw.addEventListener('click', e => {
  //     e.preventDefault();
  //     const amount = Number(this.inputWithdrawAmount.value);
  //     if (amount > 0 && this.currentAccount.movements) {
  //       this.currentAccount.movements.push(-amount);
  //       this.updateUI(this.currentAccount);
  //     }
  //     this.inputWithdrawAmount.value = '';
  //   });
  // }

  loan() {
    this.btnLoan.addEventListener('click', e => {
      e.preventDefault();
      const amount = Number(this.inputLoanAmount.value);
  
      if (amount > 0 && this.currentAccount.balance >= amount * 0.1) {
        // Add movement for the loan (current account)
        this.currentAccount.movements.push({ movement: amount }); // Update to an object with a movement property
  
        // Update UI for the current account
        this.updateUI(this.currentAccount);
      } else {
        // Display a message indicating that the loan cannot be granted
        console.log('Loan request denied.');
      }
  
      this.inputLoanAmount.value = '';
    });
  }
  
  
  transfer() {
    this.btnTransfer.addEventListener('click', e => {
      e.preventDefault();
      const amount = Number(this.inputTransferAmount.value);
      const receiverUsername = this.inputTransferTo.value;
      const receiverAcc = this.accounts.find(acc => acc.username === receiverUsername);
  
      this.inputTransferAmount.value = this.inputTransferTo.value = '';
  
      if (
        amount > 0 &&
        receiverAcc &&
        this.currentAccount.balance >= amount &&
        receiverAcc.username !== this.currentAccount.username
      ) {
        // Add movement for sender (current account)
        this.currentAccount.movements.push({ movement: -amount }); // Update to an object with a movement property
  
        // Add movement for receiver
        receiverAcc.movements.push({ movement: amount }); // Update to an object with a movement property
  
        // Update UI for both sender and receiver
        this.updateUI(this.currentAccount);
        // this.updateUI(receiverAcc);
      } else {
        // Display a message indicating that the transfer cannot be completed
        console.log('Transfer request denied.');
      }
    });
  }
  
  
  

  closeAccount() {
    this.btnClose.addEventListener('click', e => {
      e.preventDefault();
      if (
        this.inputCloseUsername.value === this.currentAccount.username &&
        Number(this.inputClosePin.value) === this.currentAccount.pin
      ) {
        const index = this.accounts.findIndex(acc => acc.username === this.currentAccount.username);
        this.accounts.splice(index, 1);
        this.containerApp.style.opacity = 0;
      }
      this.inputCloseUsername.value = this.inputClosePin.value = '';
    });
  }

  sortMovements() {
    this.btnSort.addEventListener('click', e => {
      e.preventDefault();
      this.displayMovements(this.currentAccount.movements, !this.sorted);
      this.sorted = !this.sorted;
    });
  }

  setLocalStorage() {
    localStorage.setItem('movements', JSON.stringify(this.accounts.movements));
  }

  getLocalStorage() {
    const data = localStorage.getItem('movements');
  console.log(data);
  }

  reset() {
    localStorage.removeItem('movements');
    location.reload();
  }
}

const app = new BankistApp();