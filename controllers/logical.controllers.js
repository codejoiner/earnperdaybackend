

const conn = require("../conn/dbconn")
const crypto=require('crypto')
const bcrypt=require('bcrypt')


 const Get_agent_withdraw= async (req,res)=>{
     try{
   
      const return_agent="SELECT Realname FROM users WHERE Role='admin'"
      conn.query(return_agent, await function(err,data){
         if(err) throw err
      
         if(data.length==0){
            return res.status(404).json({message:"AGENT NOT FOUND!"})
         }
         else{
          
               return res.status(200).json(data)
        
            }
      })
     }
     catch(error){
               console.log('Error in get withdraw controller',error.message)

     } 
   
  }

  const Generate_Invitation_Link=async(req,res)=>{
   
      try{
          const base_URl="https://earnperday.vercel.app"
      const link_token=crypto.randomBytes(16).toString('hex')
      const new_Invitation_link={
      link_token,
      senderId:req.body.senderId,
      isused:false
     }
           
      return res.status(200).json({Link:`${base_URl}/join/${link_token}/?ref=${new_Invitation_link.senderId}`})
  
      }catch(err){
      console.log('Error in Generate Link controller',err.message)

      }
     
     }
     
 const SHOW_CURRENT_BALANCE = async (req, res) => {
  try {
    const active_userid = req.session.Current_userId;

    if (!active_userid) {
      return res.status(401).json({ message: "Session expired, login again" });
    }

    const check_user_balance = `
      SELECT 
        SUM(i.amount) AS amount,
        SUM(i.daily_earn) AS dailyEan,
        SUM(i.total_earn) AS totalEarn,
        i.Duration,
        COALESCE(AB.active_Balance, 0) AS accountBalance
      FROM users AS u
      LEFT JOIN account_balance AS AB ON u.userid = AB.UserID
      LEFT JOIN investments AS i ON u.userid = i.userID 
      WHERE u.userid = ? 
      GROUP BY i.Duration, AB.active_Balance;
    `;

    conn.query(check_user_balance, [active_userid], (err, response) => {
      if (err) {
        return 
      }

      if (response && response.length > 0) {
        return res.status(200).json(response[0]);
      } 
    });

  } catch (err) {
    
    return res.status(500).json({ message: "Server error" });
  }
};



const Deposits= async(req,res)=>{
   try{
      const today=new Date().toISOString().slice(0,10)
     
       const {amount,agent}=req.body;
       const deposed_amount=parseInt(amount)
       const active_userid=req.session.Current_userId
        if(!active_userid){
      return res.status(401).json({message:"session expire login again"})
    }
       if(deposed_amount<=0){
         return res.status(400).json({message:"Deposit amount must not be under  or equal to zero try again"})
       }
       if(!deposed_amount |!agent){
         return res.status(400).json({message:"Deposit amount required!"})
       }
        if(!active_userid){
      return res.status(401).json({message:"session Expires Login gain "})
   }
 
   
      if(active_userid){
           const [agentphone]=await conn.promise().query(`SELECT Phone FROM users WHERE Realname=?`,[agent])
     const agentphoneno=agentphone[0].Phone
          
          const make_deposit="INSERT INTO `deposit_request`(`userID`, `deposed_amount`, `agent`,`deposed_date`) VALUES (?,?,?,?)"
          conn.query(make_deposit,[active_userid,deposed_amount,agent,today],await function(err,response){

            if(err) throw err
            if(response.affectedRows==1){
            
               return res.status(200).json({successMessage:"Deposit Request submitted wait for agent approval",phone:agentphoneno})
            }
          })
      }
    
   }
   catch(error){
    return res.status(500).json({message:"Deposit failed try again!"})
   }
}


const Me_contollers=async(req,res)=>{
      const active_user_id=req.session.Current_userId
      if(!active_user_id){
         return res.status(401).json({message:"session expires login again"})
      }
      try{
         const me=`SELECT u.userid ,COALESCE(d.Damount,0.00)
          AS Damount ,COALESCE(w.Wamount,0.00) AS Wamount 
          ,COALESCE(bns.bonus,0.00) AS bonus, 
          COALESCE(ab.active_Balance,0.00) AS 
          active_Balance FROM users u LEFT JOIN
           account_balance AS ab ON u.userid=ab.UserID 
           LEFT JOIN ( SELECT UserID, SUM(deposed_amount) 
           as Damount FROM deposit_request AS d WHERE UserID=${active_user_id}
            GROUP BY UserID)d ON u.userid=d.UserID LEFT JOIN ( SELECT UserID, 
            SUM(withdrawed_amount) AS Wamount FROM withdraw_request AS w WHERE
             UserID=${active_user_id} GROUP BY UserID ) w ON u.userid=w.userID LEFT JOIN
          ( SELECT UserID, bonus FROM bonuses as bns WHERE userID=${active_user_id} )
            bns ON u.userid=bns.userID WHERE u.userid=${active_user_id}`

            conn.query(me,[active_user_id],await function(err,response){
               if(err) throw err
              return res.status(200).json(response)

            })

      }catch(err){
              console.log('Error in Me controller controller',err.message)

      }

   }

const Withdraw_funds_Request=async (req,res)=>{
   const today=new Date().toISOString().slice(0,10)
   const active_userid=req.session.Current_userId

    try{
      if(!active_userid){
         return  res.status(401).json({message:"session Expire login again"});
      }

      const {amount,selectedagent,amount_to_recieve}=req.body;
        if(!amount || !selectedagent){
         return res.status(400).json({message:"Field Required"})

        }

        const Retrieve_balance=`SELECT COALESCE (ab.active_Balance,0) AS active_balance FROM 
        account_balance as ab INNER JOIN
        users ON ab.UserID=users.userid WHERE users.userid=?`
           
         conn.query(Retrieve_balance,[active_userid], await function(err,response){
            if(err) throw err

        
            if(response.length==0){
             return res.status(401).json({message:"Insuffient balance try again"})

            }

          
               if(response.length==1){
               let user_balance=response[0].active_balance
               console.log(user_balance)
               console.log(user_balance,amount)
             const newBalance=parseFloat(user_balance)-parseFloat(amount)

                 
               if(parseFloat(user_balance) < amount||user_balance<=0){
               return res.status(401).json({message:"Insuffient balance try again"})
              }
             

             const make_request="INSERT INTO `withdraw_request`(`userID`, `withdrawed_amount`, `net_recieve`, `agent`,`withdrawed_date`  ) VALUES (?,?,?,?,?)"
             conn.query(make_request,[active_userid,amount,amount_to_recieve,selectedagent,today], async(err,response)=>{
                 if(err) throw err

                 if(response.affectedRows==1){
                  const update_balance="UPDATE `account_balance` SET `active_Balance`=? WHERE UserID=?"
                  conn.query(update_balance,[newBalance,active_userid], await function(err){
                     if(err) throw err
                    return res.status(200).json({successMessage:"Withdraw request submitted wait for agent approval"})

                  })
                 }
             })
              

     } })
           
                  
   
    }
    catch(error){
      return res.status(500).json({message:"Failed to withdraw due to server error try again!"})
    }
}


const Transaction =async(req,res)=>{
   try{
      const active_userid=req.session.Current_userId
       if(!active_userid){
      return res.status(401).json({message:"session expire login again"})
    }
       if(active_userid){
          const fetch_transaction=`SELECT 
    deposed_date AS transaction_date, 
    'Deposit' AS Transaction_Type,  
    deposed_amount AS amount, 
    agent, 
    status, 
    userID 
FROM 
    deposit_request 
WHERE 
    userID = ${active_userid} 
UNION ALL 
SELECT 
    withdrawed_date AS transaction_date,
    'Withdraw' AS Transaction_Type, 
    withdrawed_amount AS amount, 
    agent, 
    status, 
    userID 
FROM 
    withdraw_request 
WHERE 
    userID = ${active_userid}
ORDER BY 
    transaction_date ASC `
           conn.query(fetch_transaction,await function(err,response){
             if(err) throw err
               if(response.length==0){
                  return res.status(404).json({message:"No transaction status available"})
               }
             
                  return res.status(200).json(response)
            
       })

       }
      
   }
   catch(error){
           console.log('Error in transaction controller',error.message)
           return res.status(500).json({message:'system failed to retrieve transaction!'})

   }

}

const Investment = async (req, res) => {
  try {
    const active_userid = req.session.Current_userId;

    if (!active_userid) {
      return
    }

    const { RequiredInvestment, Duration, startDate, endDate } = req.body;
    let last_credited_date = startDate;

    if (!RequiredInvestment || !Duration) {
      return
    }

    const investmentAmount = parseFloat(RequiredInvestment);
    let dailyEarn = 0;

    
    if (investmentAmount === 2) {
      dailyEarn = investmentAmount * 0.08;
    } else if ([3, 5, 6, 8, 10, 12, 15, 17].includes(investmentAmount)) {
      dailyEarn = investmentAmount * 0.07;
    } else if ([20, 25, 30].includes(investmentAmount)) {
      dailyEarn = investmentAmount * 0.07;
    } else if ([35, 45, 55, 60, 63, 70,85,100,125,150].includes(investmentAmount)) {
      dailyEarn = investmentAmount * 0.08;
    } else {
      return res.status(400).json({ message: "Invalid investment amount." });
    }

    const [existing] = await conn
      .promise()
      .query(`SELECT * FROM investments WHERE userID=? AND amount=?`, [active_userid, RequiredInvestment]);

    if (existing.length > 0) {
      return res.status(400).json({ message: "You already invest on that Product!" });
    }

 
    const [balanceResult] = await conn
      .promise()
      .query(`SELECT active_Balance FROM account_balance WHERE UserID=?`, [active_userid]);

    if (balanceResult.length === 0) {
      return res.status(404).json({ message: "Insuffient balance Tap to deposit!" });
    }

    const current_balance = parseFloat(balanceResult[0].active_Balance);
    const investment_required = parseFloat(RequiredInvestment);

    if (current_balance < investment_required) {
      return res.status(400).json({ message: "Insuffient balance Tap to deposit!" });
    }

    const total_earn = dailyEarn * parseFloat(Duration);
    const newBalance = current_balance - investment_required;

   
    const investQuery = `
      INSERT INTO investments (userID, amount, total_earn, daily_earn, Duration, start_date, end_date, last_credited_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [investResult] = await conn
      .promise()
      .query(investQuery, [
        active_userid,
        investmentAmount,
        total_earn,
        dailyEarn,
        Duration,
        startDate,
        endDate,
        last_credited_date
      ]);

    if (investResult.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to record investment." });
    }

  
    await conn
      .promise()
      .query(`UPDATE account_balance SET active_Balance=? WHERE UserID=?`, [newBalance, active_userid]);

  
    const [refRow] = await conn
      .promise()
      .query(`SELECT invitors_id FROM users WHERE userid=?`, [active_userid]);

    if (refRow.length > 0 && refRow[0].invitors_id) {
      const invitorId = refRow[0].invitors_id;

      
      const [countInvest] = await conn
        .promise()
        .query(`SELECT COUNT(*) AS total FROM investments WHERE userID=?`, [active_userid]);

      if (countInvest[0].total === 1) {
        const Bonusvalue = investmentAmount * 0.05;

       
        const [bonusRecord] = await conn
          .promise()
          .query(`SELECT bonus, invited_user FROM bonuses WHERE userID=?`, [invitorId]);

        if (bonusRecord.length === 0) {
         
          await conn
            .promise()
            .query(`INSERT INTO bonuses (userID, bonus, invited_user) VALUES (?, ?, ?)`, [
              invitorId,
              Bonusvalue,
              1
            ]);
        } else {
        
          const newBonus = bonusRecord[0].bonus + Bonusvalue;
          const newInvitedUser = bonusRecord[0].invited_user + 1;
          await conn
            .promise()
            .query(`UPDATE bonuses SET bonus=?, invited_user=? WHERE userID=?`, [
              newBonus,
              newInvitedUser,
              invitorId
            ]);
        }


        const [invitorBalanceRow] = await conn
          .promise()
          .query(`SELECT active_Balance FROM account_balance WHERE UserID=?`, [invitorId]);

        if (invitorBalanceRow.length === 0) {

          await conn
            .promise()
            .query(`INSERT INTO account_balance (UserID, active_Balance) VALUES (?, ?)`, [
              invitorId,
              Bonusvalue
            ]);
        } else {
          const newInvitorBalance = parseFloat(invitorBalanceRow[0].active_Balance) + Bonusvalue;
          await conn
            .promise()
            .query(`UPDATE account_balance SET active_Balance=? WHERE UserID=?`, [
              newInvitorBalance,
              invitorId
            ]);
        }
      }
    }

    return res.status(200).json({
      successMessage: " Congratulations! Your investment was successful."
    });

  } catch (err) {
            console.log('Error in investment controller',err.message)
            return res.status(500).json({message:'Investment failed try again!'})

  }
};





const approval_withdraw= async (req,res)=>{
  
     const {withdraw_id}=req.params
   
     const {userId}=req.params


    
     
    

      try{
     const is_request_available="SELECT * FROM `withdraw_request` WHERE userID=? AND withdraw_id=?"
     conn.query(is_request_available,[userId,withdraw_id],await  function(err,response){
      if(err)  throw err
        if(response.length==0){
         return 
        }
        if(response[0].status=='completed'){
         return
        }
         
        
        if(response[0].status=='pending'){
         const approval_w="UPDATE `withdraw_request` SET `status`='completed' WHERE userID=? AND withdraw_id=?"
         conn.query(approval_w,[userId,withdraw_id],(err,response)=>{
            if(err) throw err;
            if(response.affectedRows==1){
               return res.status(200).json({confrimation:"approved"})
            }

         })
        }
      
       
      
     })
           
      }catch(error){
                 console.log('Error in withdraw controller',error.message)

      }
}


const approval_deposit=async(req,res)=>{
   const {userId}=req.params
   const {deposit_id}=req.params

    try{
      const check_deposit_request="SELECT `deposed_amount`,`status` FROM `deposit_request` WHERE userID=? AND deposit_id=?"
      conn.query(check_deposit_request,[userId,deposit_id],async(err,response)=>{
        if(err) throw err 
        if(response.length==0){
         return
        }
        if(response[0].status==='Completed'|response[0].status==='completed'){
         return
        }
          if(response.length==1){
            const amount=response[0].deposed_amount
         
           

            const Retrieve_u_balance="SELECT  COALESCE(active_Balance,0) AS u_active_balance FROM account_balance WHERE UserID=?"
            conn.query(Retrieve_u_balance,[userId],await function(err,response){
                
               if(err) throw err
             

                   if(response.length==0){
                  const make_Deposit="INSERT INTO `account_balance`(`UserID`, `active_Balance`) VALUES (?,?)"
                  conn.query(make_Deposit,[userId,amount],async(err,response)=>{
                     if(err) throw err
                     if(response.affectedRows==1){
                        const update_status="UPDATE `deposit_request` SET `status`='completed' WHERE userID=?"
                        conn.query(update_status,[userId],await function(err){
                           if(err) throw err
                           return                 
                        })
                     }

                  })
               }



                if(response.length==1){
                  const CurrentBalance=response[0].u_active_balance
                  const TotalBalance=parseFloat(CurrentBalance)+parseFloat(amount)
                   const updateBalance="UPDATE `account_balance` SET `active_Balance`=? WHERE UserID=?"
                   conn.query(updateBalance,[TotalBalance,userId],(err)=>{
                     if(err) throw err
                 
                        const updateStatus="UPDATE `deposit_request` SET `status`='completed' WHERE userID=? AND deposit_id=?"
                        conn.query(updateStatus,[userId,deposit_id],(err)=>{
                           if(err) throw err
                           return
                        })
                  
                   })
                }
                
               })
          }
      })

    }
     catch(error){
      console.log('Error in approval deposit controller',error.message)
     }

}


const Fetch_withdraw_history=async(req,res)=>{
   const active_userid=req.session.Current_userId
  try{
    
   if(!active_userid){
      return res.status(401).json({message:"session expire Login again"})
   }
   if(active_userid){
   const Fetch_withdraw_history="SELECT  `withdrawed_amount`, `withdrawed_date`, `net_recieve`, `transaction_type`, `status`, `description` FROM `withdraw_request` WHERE  userID=?"
   conn.query(Fetch_withdraw_history,[active_userid], await function(err,response){
      if(err) throw err
        if(response.length==0){
         return res.status(404).json({message:"NO withdraw History"})
        }
        return res.status(200).json(response)
   })
   }
  



  }
  catch(error){
    console.log('Error in fetch withdraw controller',error.message)
   return res.status(500).json("system failed to retrieve your withdraw history data" );

  }
}




const Return_W_Request= async (req,res)=>{
      const role=req.session.Role
      const agent=req.session.realname
       if(!role||role!=='admin'){
    return
   } 
   try{
      if(role==='admin'){
 const sel_all_request=`
SELECT w.status, w.withdraw_id,w.userID,w.withdrawed_amount,w.net_recieve,
w.withdrawed_date,u.Realname,
u.Phone FROM withdraw_request
 AS w INNER JOIN users AS  u
 ON u.userid=w.userID WHERE w.agent=? ORDER BY w.withdraw_id ASC, w.withdrawed_date ASC` 
   conn.query(sel_all_request,[agent],await function(err,response){
      if(err) throw err
      return res.status(200).json(response)

   })
      }
     

   }
   catch(error){
      console.error("Error in Return deposit withdraw request controller", error.message);

   }
}


const Return_D_Request=async(req,res)=>{
      const role=req.session.Role
  const agent=req.session.realname
 
  
   if(!role){
    return
   } 
   try{
      if(role==='admin'){
         const fetch_Deposit=`SELECT D.userID,D.deposit_id,D.Transaction_Type,D.status,
        D.deposed_amount,D.deposed_date,u.Realname
       FROM deposit_request AS D
        INNER JOIN users AS u ON u.userid=D.userID WHERE D.agent=?
          ORDER BY D.deposit_id ASC,D.deposed_date ASC `

        conn.query(fetch_Deposit,[agent], await function(err,response){
         if(err) throw err
          if(response.length==0){
            console.log('no result')
          } 
         return res.status(200).json(response)
      })
      }
       
   }
   catch(error){
            console.error("Error in Return deposit request controller", error.message);
   }
}



 

const TrackerDailyEarn = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [users] = await conn.promise().query("SELECT UserID FROM account_balance");

    for (const user of users) {
      const userID = user.UserID;

      const [investments] = await conn.promise().query(
        `SELECT id, daily_earn, total_earn, last_credited_date, start_date, end_date, _Status
         FROM investments 
         WHERE userID = ? 
           AND _Status = 'active' 
           AND start_date <= end_date`,  
        [userID]
      );

      if (investments.length === 0) continue;
      const [balanceRes] = await conn.promise().query(
        "SELECT active_Balance FROM account_balance WHERE UserID=?",
        [userID]
      );

      if (balanceRes.length !== 1) continue;

      let currentBalance = parseFloat(balanceRes[0].active_Balance || 0);
      let totalDailyEarn = 0;

      for (const inv of investments) {
        const invEnd = new Date(inv.end_date);
        const invLast = new Date(inv.last_credited_date || inv.start_date);
        const todayDate = new Date(today);

        if (invEnd < todayDate) {
          await conn.promise().query(
            "UPDATE investments SET _Status='completed' WHERE id=?",
            [inv.id]
          );
          continue;
        }

        const missedDays = Math.floor(
          (todayDate - invLast) / (1000 * 60 * 60 * 24)
        );

        if (missedDays <= 0) continue;

        let earnThisPeriod = parseFloat(inv.daily_earn) * missedDays;

        const maxPossibleEarn = parseFloat(inv.total_earn);

        if (earnThisPeriod > maxPossibleEarn) {
          earnThisPeriod = maxPossibleEarn;
        }

        currentBalance += earnThisPeriod;
        totalDailyEarn += earnThisPeriod;

        await conn.promise().query(
          "UPDATE investments SET last_credited_date=? WHERE id=?",
          [today, inv.id]
        );

        if (invEnd.getTime() === todayDate.getTime()) {
          await conn.promise().query(
            "UPDATE investments SET _Status='completed' WHERE id=?",
            [inv.id]
          );
        }

       
      }

      await conn.promise().query(
        "UPDATE account_balance SET active_Balance=? WHERE UserID=?",
        [currentBalance, userID]
      );

    }

    console.log(`[${new Date().toLocaleString()}] 🎯 daily earn added very well.`);
  } catch (err) {
    console.error("tracking user daily earn error", err.message);
  }
};

const GetUserCredentials=async(req,res)=>{
  const CurrentUserID=req.session.Current_userId
  if(!CurrentUserID){
    return;
  }
const [userResult]=await conn.promise().query('SELECT  `Realname`, `Username`, `Phone` FROM `users` WHERE userid=?',[CurrentUserID])
  return res.status(200).json({user:userResult})
  
}


const EditPassword= async(req,res)=>{
   const CurrentUserID=req.session.Current_userId
  if(!CurrentUserID){
    return;
  }
  try{
   
    const  {newPassword}=req.body
 
    const salt=await bcrypt.genSalt(10)
    const hashednewpassword = await bcrypt.hash(newPassword,salt)
    const [passwordupdation]=await conn.promise().query('UPDATE `users` SET `Password`=? WHERE userid=?',[hashednewpassword,CurrentUserID])
    
    if(passwordupdation&&passwordupdation.affectedRows===1){
        return res.status(200).json({successMessage:"New Password saved"})
    }

   
  }
  catch(error){
          console.error("Error in get username controller", error.message);
        return res.status(500).json({ message: "Failed to  Edit password try again!" });
  }

}


const UpdateUsername= async(req,res)=>{
  try{
  const CurrentuserID=req.session.Current_userId
const {realname,username}=req.body


console.log(CurrentuserID,username,realname)
if(!CurrentuserID){
  return
}
const [updatestatus]=await conn.promise().query('UPDATE `users` SET `Realname`=?,`Username`=? WHERE userid=?',[realname,username,CurrentuserID])
   if(updatestatus.affectedRows===1){
    return res.status(200).json({successMessage:"New Changes saved"})
   }
  }catch(error){
        console.error("Error in update username controller", error.message);
        return res.status(500).json({ message: "Failed to Edit username try again!" });
  }
}


const updatePhoneNO=async(req,res)=>{
  try{
   const CurrentuserId=req.session.Current_userId
   const {phoneno}=req.body
   if(!CurrentuserId){
    return
   }
     
   const [phoneupdate]=await conn.promise().query('UPDATE `users` SET `Phone`=? WHERE userid=?',[phoneno,CurrentuserId])
   if(phoneupdate.affectedRows===1){
    return res.status(200).json({successMessage:"New phone number saved"})
   }
  }
  catch(error){
          console.error("Error in updatephoneNO controllers", error.message);
        return res.status(500).json({ message: "failed to Edit Phone no try again!" });
  }
}





module.exports={
   
    Get_agent_withdraw,
   SHOW_CURRENT_BALANCE,
   Investment,
   Generate_Invitation_Link,
   Deposits,Transaction,
   Withdraw_funds_Request,
   Me_contollers,
   Fetch_withdraw_history,
   approval_withdraw,
   approval_deposit,
   Return_W_Request,
   Return_D_Request
   ,TrackerDailyEarn,
   GetUserCredentials,
   EditPassword,
   updatePhoneNO,
   UpdateUsername
 
  
}
