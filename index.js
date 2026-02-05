const express = require('express')
const app = express()
const pool = require("./config/database")
const initModels = require("./models/init.models")
const authRoutes = require("./routers/auth.routes");
const adminRoutes = require("./routers/admin.routes")
const taskRoutes = require("./routers/task.routes")
const walletRoutes = require("./routers/wallet.routes")





app.use(express.json())

pool.connect()
initModels()



app.get('/',(req,res)=>{
    res.status(200).json({
        success : true,
        message : 'API is Running...'
    })
})


app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/task", taskRoutes);
app.use("/api/v1/wallet", walletRoutes);



const PORT = process.env.PORT || 4000
app.listen(PORT, ()=>{
    console.log(`App is Started at port ${PORT}`)
})

