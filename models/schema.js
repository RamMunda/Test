const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    secretToken:String,
    tokens:[{
        token:{
            type:String
        }
    }],
    ip:String,
    history:[{
        ip:{
            type:Number
        },
        date:{
            type:Date
        },
        }],  
    // {
    //     value:String,
    //     expireAt:{
    //         type:Date,
    //         expires:60,
    //         default:Date.now
    //     }
    // },
    active:Number,
    tags:[String],
    isPublished:Boolean,
    Enrollment_ID:String,
  Name_of_candidate:String,
  Email_ID:String,
  Mobile_No:String,
  Date_of_Birth:String,
  Gender:String,
  Name_of_Parent:String,
  Mobile_No_of_Parent:String,
  Nationality:String,
  Category:String,
  Person_with_disability:String,
  Country_of_Permanent_Residence:String,
  State_or_Union_Territory_of_Permanent_Residence:String,
  ID_Proof:String,
  ID_Proof_Number:String
});

const User = mongoose.model( 'User',userSchema);
module.exports = User;