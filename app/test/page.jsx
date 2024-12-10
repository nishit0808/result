"use client"
import axios from 'axios';
import React from 'react'

function page() {

    const data = {
        name: null,
        semester: ""
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        data[name] = value;
        console.log(data);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("starting req");
        axios.post('/api/course', {
            name: data.name,
            semester: data.semester.split(",")
        })
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {
            console.log(error);
        });

        
    };

  return (
    <form className='bg-red-600 h-full'>
      <input type="text" name='name' placeholder='Course Name' onChange={(e) => handleChange(e)}/>
      <input type="text" name='semester' placeholder='Semester' onChange={(e) => handleChange(e)}/>
      <button onClick={(e) => handleSubmit(e)}>Submit</button>
    </form>
  )
}

export default page
