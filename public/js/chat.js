const socket = io()                //connects to the server.
 
//elements

const $messageForm =  document.querySelector('#message-form')              //declaring var names with $ is merely a convention which suggests that the particular variable is an element from the dom that's been selected.
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
 const {username,room }=Qs.parse(location.search,{                   //an object is returned containing the query string
     ignoreQueryPrefix:true                                          //ignores the ?. By default, it is false.
})                                                                   //destructured the location.search query.

const autoscroll = ()=>{
     //New message element
     const $newMessage =$messages.lastElementChild                                    //grabs the last element as the child which would be the latest message

     //Height of the message                                                          //height includes the standard content including the margin             
     const newMessageStyles= getComputedStyle($newMessage)                            //made available globally by the browser so that we get to know the styles applied on that particular element                                     
     const newMessageMargin= parseInt(newMessageStyles.marginBottom)
     const newMessageHeight= $newMessage.offsetHeight + newMessageMargin              //offsetHeight doesn't take in account the margin-61
     //Visible Height                                                                 
     //basically the size of the division tag alloted for messages-297
     const visibleHeight = $messages.offsetHeight                                     //297
     //Height of messages container
     const containerHeight = $messages.scrollHeight                                   //total height: gives us the total height we could scroll through
     //How far scrolled
     const scrollOffset = $messages.scrollTop  + visibleHeight                       //gives us as a number the distance we've scrolled from the top
                                                                                     //when added with visible height, gives an almost idea as to how close to the bottom we are
     if(containerHeight - newMessageHeight<=scrollOffset){
          $messages.scrollTop = $messages.scrollHeight  
     }
}



socket.on('message',(message)=>{
     console.log(message)
      
     const html = Mustache.render(messageTemplate,{              //passing the data into the template, Mustache compiles it correctly and renders it.
            username:message.username,
            message:message.text,
            createdAt:moment(message.createdAt).format('h:mm a')                                //shorthand since message present in the template as well
     })
     $messages.insertAdjacentHTML('beforeend',html)              // inserts the messages into the html
     autoscroll()
})

socket.on('locationMessage',(location)=>{
     console.log(location)

     const html = Mustache.render(locationTemplate,{
          username:location.username,
          url:location.url,
          createdAt:moment(location.createdAt).format('h:mm a')
     })
     $messages.insertAdjacentHTML('beforeend',html)
     autoscroll()
})

socket.on('roomData',({room,users})=>{
     const html= Mustache.render(sidebarTemplate,{
          room,
          users
     })
     document.querySelector('#sidebar').innerHTML = html
}) 

$messageForm.addEventListener('submit',(e)=>{
         e.preventDefault()
          //disbale the form

          $messageFormButton.setAttribute('disabled','disabled')
          
        const message = e.target.elements.message.value          //message is the name of the button
       

        socket.emit('sendMessage',message,(error)=>{
             //enable the form

          $messageFormButton.removeAttribute('disabled')
          $messageFormInput.value = ''
          $messageFormInput.focus()               //moves the focus back to the input 

             if(error){
                  return console.log(error)
             }

             console.log('Message Delivered.')    
        })
     })


$sendLocationButton.addEventListener('click',()=>{
      if(!navigator.geolocation)                  //to check if mdn geolocation is supported within the browser
      {
           return alert('Geolocation is not supported by your browser.')
      }

      $sendLocationButton.setAttribute('disabled','disabled')

      navigator.geolocation.getCurrentPosition((position)=>{               //gets the current location
          //console.log(position)

          

          socket.emit('sendLocation',{
               latitude:position.coords.latitude,
               longitude:position.coords.longitude
          
          },(msg)=>{
               $sendLocationButton.removeAttribute('disabled')
               console.log(`Location ${msg}`)
          })
          
      })
})

socket.emit('join',{ username, room},(error)=>{
     if(error)                               //event acknowledged only when there is an error.
     {
          alert(error)
          location.href='/'
     }
})
 