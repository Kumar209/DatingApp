APP Loading Flow  -->

APP_INITIALIZER
   ↓
InitService.init()
   ↓
AccountService.loadCurrentUser()
   ↓
currentUser signal restored
   ↓
guards run
   ↓
navbar renders correctly