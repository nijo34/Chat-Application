const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
    generateMessage,
    generateLocationMessage
    } 
    =require('./utils/messages')

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom

}=require('./utils/users')

const app= express()
const server= http.createServer(app)
const io= socketio(server)

const port= 3000 || process.env.PORT
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

//server(emit) -> client(recieve) - countUpdated
//client(emit) ->server(recieve)  - increment


io.on('connection',(socket)=>{                 //socket here is an object and it contains info regarding the new connection
    console.log('New WebSocket Connection') 

    //listener for joining users
    //socket.on('join',({username,room},callback)=>{
    //const {error,user} = addUser({id:socket.id,username,room})
    socket.on('join', (options , callback)=>{

         const { user , error } = addUser({id:socket.id, ...options})       //es6 spread operatoron the object
        if(error)
        {
           return callback(error)
        }


         socket.join(user.room)                      //user joins the room

         socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined the room`))

        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
     
        callback()   
    })

    socket.on('sendMessage',(message,callback)=>{

        const user = getUser(socket.id)
 
        const filter = new Filter()

        if(filter.isProfane(message))
        {
            return callback('Profanity is not allowed.')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))

        callback()
    })

    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)

        if(user)
        {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)
        //io.emit('message', `https://google.com/maps?q=${location.latitude},${location.longitude}`)      //provides a link from the google maps api
        io.to(user.room).emit('locationMessage',generateLocationMessage( user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('shared!') 
    })
})   

server.listen(port,()=>{
    console.log(`Server is set up on port ${port}`)
})
 

