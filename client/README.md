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


First - client changes - ng build 
Second - do migration(neccessary in visual studio if any changes in db)
Third - do update-database for local db changes (optional for production because app will automatically update the pending migration to db)
Forth - publish with monsterasp.net file 