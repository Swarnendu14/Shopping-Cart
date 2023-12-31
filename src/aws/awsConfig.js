const aws = require("aws-sdk")
const dotenv = require('dotenv').config()
const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } = process.env;

aws.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
})
let uploadFile = async(file) => {
    return new Promise(function(resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket", //HERE
            Key: "rohit/" + file.originalname, //HERE 
            Body: file.buffer
        }


        s3.upload(uploadParams, function(err, data) {
            if (err) {
                return reject({ "error": err.message })
            }
            // console.log(data)
            // console.log("file uploaded succesfully")
            return resolve(data.Location)
        })

        // let data= await s3.upload( uploadParams)
        // if( data) return data.Location
        // else return "there is an error"

    })
}


module.exports.uploadFile = uploadFile