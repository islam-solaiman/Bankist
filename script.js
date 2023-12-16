class BankistApp {
  constructor() {
    // Initialize accounts as an empty array initially
    this.accounts = [];

    this.fetchAccounts(); // Fetch accounts when the app starts

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
  
      for (const account of fetchedAccounts) {
        try {
          const movementsResponse = await fetch(`http://localhost:3000/movements/${account.id}`);
  
          if (!movementsResponse.ok) {
            throw new Error(`Could not fetch movements for account ${account.id}. Status: ${movementsResponse.status}`);
          }
  
          const movements = await movementsResponse.json();
  
          if (!Array.isArray(movements)) {
            console.error(`Invalid data format for movements of account ${account.id}`);
            return;
          }
  
          // Add movements to each account object
          account.movements = movements || []; // Ensure movements array exists even if empty
        } catch (error) {
          console.error('Error fetching movements:', error.message);
          // Handle errors or display an error message to the user
        }
      }
  
      this.accounts = fetchedAccounts || []; // Ensure accounts array exists even if empty
  
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
    this.btnLogout = document.querySelector('.logout__btn');
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
    this.calcDisplaySummary();
    this.updateDate();
    this.logout();
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
  
    const totalDeposits = acc.movements
      .filter(mov => mov.movement > 0)
      .reduce((acc, mov) => acc + parseFloat(mov.movement), 0);
    this.labelSumIn.textContent = `${totalDeposits}$`;
  
    const totalWithdrawals = acc.movements
      .filter(mov => mov.movement < 0)
      .reduce((acc, mov) => acc + parseFloat(mov.movement), 0);
    this.labelSumOut.textContent = `${Math.abs(totalWithdrawals)}$`;
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
    this.calcDisplaySummary(acc); // Passing 'acc' as a parameter instead of 'accs'
    this.updateDate();
    this.startLogOutTimer();
  }
  


  // Event handlers

  updateDate() {
    const now = new Date();
    const day = `${now.getDate()}`.padStart(2, 0);
    const month = `${now.getMonth() + 1}`.padStart(2, 0);
    const year = `${now.getFullYear()}`;
    const hour = `${now.getHours()}`.padStart(2, 0);
    const min = `${now.getMinutes()}`.padStart(2, 0);

    this.labelDate.textContent = `${day}/${month}/${year}, ${hour}:${min}`
  }
  
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
      }else
        alert('Wrong User Name Or Password');
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
        alert('Loan request denied, Current Balance must be more than or equal 10% of the requested loan amount');
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
        // Add negative movement for the sender (current account)
        this.currentAccount.movements.push({ movement: -amount }); // Update to an object with a negative movement
  
        // Add positive movement for receiver
        receiverAcc.movements.push({ movement: amount }); // Update to an object with a positive movement
  
        // Update UI for both sender and receiver
        this.updateUI(this.currentAccount);
      } else {
        // Display a message indicating that the transfer cannot be completed
        alert('Transfer request denied, transfered amount must be more than or equal cuurent balance');
      }
    });
  }

  sortMovements() {
    this.btnSort.addEventListener('click', e => {
      e.preventDefault();

      // Toggle sorting order
      this.currentAccount.movements.reverse();

      this.displayMovements(this.currentAccount.movements);
      this.sorted = !this.sorted; // Update the sorted flag
    });
  }


  startLogOutTimer() {
    // Set time to 2 minutes (2 * 60 seconds)
    let time = 300;

    const timer = setInterval(() => {
      const min = String(Math.trunc(time / 60)).padStart(2, '0');
      const sec = String(time % 60).padStart(2, '0');

      // Assign the remaining time to labelTimer.textContent
      this.labelTimer.textContent = `${min}:${sec}`;

      // Decrease time by 1 second
      time--;

      if (time < 0) {
        clearInterval(timer);
        // Set necessary actions upon timeout
        this.labelWelcome.textContent = 'Log in to get started';
        this.containerApp.style.opacity = 0;
      }
    }, 1000); // Call the timer every second (1000 milliseconds)
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

  logout() {
    this.btnLogout.addEventListener(onclick, function(){
      this.containerApp.style.opacity = 0;
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