const express=require('express')
const router=express.Router()


const {Join,Login,getUserName}=require('../controllers/user.controllers')
const {SHOW_CURRENT_BALANCE,Investment,
    Get_agent_withdraw,
    Withdraw_funds_Request,
    Generate_Invitation_Link,
    Deposits,Me_contollers,
    Fetch_withdraw_history,
    approval_withdraw,Transaction,
    approval_deposit,
    Return_W_Request,
    Return_D_Request,
    GetUserCredentials,
    EditPassword,
    updatePhoneNO,
    UpdateUsername,
  

}=require('../controllers/logical.controllers')

const {VerifyToken,
    allowedRole,
     
} = require('../middleware/middleware')





router.post('/join',Join)
router.post('/login',Login)

router.get('/balance/panel',VerifyToken(),allowedRole('user'),SHOW_CURRENT_BALANCE)
router.post('/investment',VerifyToken(),allowedRole('user'),Investment)
router.get('/fetch/agent',VerifyToken(),allowedRole('user'),Get_agent_withdraw)
router.post('/generate/invitation/link',VerifyToken(),allowedRole('user'),Generate_Invitation_Link)
router.post('/Deposit',VerifyToken(),allowedRole('user'),Deposits)
router.get('/load/me',VerifyToken(),allowedRole('user'),Me_contollers)
router.post('/request/withdraw',VerifyToken(),Withdraw_funds_Request)
router.get('/withdraw/history',VerifyToken(),allowedRole('user'),Fetch_withdraw_history)
 router.get('/transaction',VerifyToken(),allowedRole('user',),Transaction)
router.post('/withdraw/approval/:withdraw_id/userid/:userId',VerifyToken(),allowedRole('superadmin','admin'),approval_withdraw)
router.post('/Deposit/approval/:deposit_id/userid/:userId',VerifyToken(),allowedRole('superadmin','admin'),approval_deposit)
router.get('/return/with/request',VerifyToken(),allowedRole('superadmin','admin'),Return_W_Request)
router.get('/Return/Deposit',VerifyToken(),allowedRole('superadmin','admin'),Return_D_Request)

router.get('/login',VerifyToken(),allowedRole('user','admin'),getUserName)
router.get('/currentuserCridentials',VerifyToken(),allowedRole('user'),GetUserCredentials)

router.put('/update/password',EditPassword,VerifyToken(),allowedRole('user'))
router.put('/Edit/phoneno',updatePhoneNO,VerifyToken(),allowedRole('user'))
router.put('/update/details',UpdateUsername,VerifyToken(),allowedRole('user'))



module.exports=router