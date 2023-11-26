# Bankist App Project

# Live Demo :  https://islam-solaiman.github.io/Bankist-App/

![Alt](https://github.com/islam-solaiman/Banklist-App/blob/main/ezgif.com-video-to-gif.gif?raw=true)


## About The Project:

The is project is about online banking interface:
interface includes:
    - Current User Balance
    - User Movements With Dates
    - Sumery Data for Total Deposits, Withdrawalls and Interserts
    - Transfer Money Window
    - Request Loan Window
    - Close Account Window

## App Behavior

    While login:
        - The user will be able to see welcome back notice with his name 
        - The user will be able to see Current Balance + Account Movements + Account Summery
        - While transfer money to differnet user:
            - Sender:  the Amount will be deducted from the current balance 
            and will show in the current movements as withdrwal transaction
            - Recever: the amount will be added to the receiver's current balance and will show in 
            hi movements as deposit transaction
        - While requesting a loan the App whill check if the request Loan amount Doesn't Exceed 10% of the user current balance and in this case the amount will be added to the current balnance and will show in the current movement as Deposit transaction
        - While Choosing Close Account The user has to provide his name And Password Then the Account will be Closed
        - The app Allows only 30 Second of Inactivity then the user will be logged out otherwise while making any transaction the timer will be resetted again to 30 sec 

## Test Users:
    - UserName: js - PassWord: 1111
    - UserName: jd - PassWord: 2222