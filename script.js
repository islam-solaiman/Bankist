'use strict';

class BankistApp {
  constructor() {
    // Data
    this.accounts = [
      {
        owner: 'Jonas Schmedtmann',
        movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
        interestRate: 1.2, // %
        pin: 1111,
      },
      {
        owner: 'Jessica Davis',
        movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
        interestRate: 1.5,
        pin: 2222,
      },
      {
        owner: 'Steven Thomas Williams',
        movements: [200, -200, 340, -300, -20, 50, 400, -460],
        interestRate: 0.7,
        pin: 3333,
      },
      {
        owner: 'Sarah Smith',
        movements: [430, 1000, 700, 50, 90],
        interestRate: 1,
        pin: 4444,
      },
    ];

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
    this.deposit();
    this.withdraw();
    this.transfer();
    // this.loan();
    // this.closeAccount();
    this.sortMovements();

    // Get data from localStorage
    this.getLocalStorage();
  }

  // Functions
  displayMovements(movements, sort = false) {
    this.containerMovements.innerHTML = '';
    const movs = sort ? movements.slice().sort((a, b) => a - b) : movements;
    movs.forEach((mov, i) => {
      const type = mov > 0 ? 'deposit' : 'withdrawal';
      const html = `
        <div class="movements__row">
          <div class="movements__type movements__type--${type}">
            ${i + 1} ${type}
          </div>
          <div class="movements__value">${mov}$</div>
        </div>`;
      this.containerMovements.insertAdjacentHTML('afterbegin', html);
    });
  }

  calcDisplayBalance(acc) {
    acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
    this.labelBalance.textContent = `${acc.balance}$`;
  }

  calcDisplaySummary(acc) {
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

  deposit() {
    this.btnDeposit.addEventListener('click', e => {
      e.preventDefault();
      const amount = Number(this.inputDepositAmount.value);
      if (amount > 0 && this.currentAccount.movements) {
        this.currentAccount.movements.push(amount);
        this.updateUI(this.currentAccount);
      }
      this.inputDepositAmount.value = '';
    });
  }

  withdraw() {
    this.btnWithdraw.addEventListener('click', e => {
      e.preventDefault();
      const amount = Number(this.inputWithdrawAmount.value);
      if (amount > 0 && this.currentAccount.movements) {
        this.currentAccount.movements.push(-amount);
        this.updateUI(this.currentAccount);
      }
      this.inputWithdrawAmount.value = '';
    });
  }

  transfer() {
    this.btnTransfer.addEventListener('click', e => {
      e.preventDefault();
      const amount = Number(this.inputTransferAmount.value);
      const receiverAcc = this.accounts.find(acc => acc.username === this.inputTransferTo.value);
      this.inputTransferAmount.value = this.inputTransferTo.value = '';
      if (
        amount > 0 &&
        receiverAcc &&
        this.currentAccount.balance >= amount &&
        receiverAcc?.username !== this.currentAccount.username
      ) {
        this.currentAccount.movements.push(-amount);
        receiverAcc.movements.push(amount);
        this.updateUI(this.currentAccount);
      }
    });
  }

  // loan() {
  //   this.btnLoan.addEventListener('click', e => {
  //     e.preventDefault();
  //     const amount = Number(this.inputLoanAmount.value);
  //     if (amount > 0 && this.currentAccount.movements.some(mov => mov >= amount * 0.1)) {
  //       this.currentAccount.movements.push(amount);
  //       this.updateUI(this.currentAccount);
  //     }
  //     this.inputLoanAmount.value = '';
  //   });
  // }

  // closeAccount() {
  //   this.btnClose.addEventListener('click', e => {
  //     e.preventDefault();
  //     if (
  //       this.inputCloseUsername.value === this.currentAccount.username &&
  //       Number(this.inputClosePin.value) === this.currentAccount.pin
  //     ) {
  //       const index = this.accounts.findIndex(acc => acc.username === this.currentAccount.username);
  //       this.accounts.splice(index, 1);
  //       this.containerApp.style.opacity = 0;
  //     }
  //     this.inputCloseUsername.value = this.inputClosePin.value = '';
  //   });
  // }

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
